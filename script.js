import { WebsimSocket } from "https://cdn.jsdelivr.net/npm/websimsocket@1.0.0/dist/index.es.js";

// Initialize the WebsimSocket room
const room = new WebsimSocket();

// Global state variables
let isHost = false;
let player; // YouTube player instance
let currentVideoId = null;
let syncInterval = null;

// Utility: get YouTube Video ID from URL
function getYouTubeVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

// Update host assignment based on connected peers
function updateHostStatus() {
  const peers = room.party.peers;
  const clientIds = Object.keys(peers).sort();
  // The first id in sorted order is considered host
  const hostId = clientIds[0];
  isHost = (room.party.client.id === hostId);
  const hostIndicatorElem = document.getElementById("hostIndicator");
  if (isHost) {
    hostIndicatorElem.textContent = "Status: You are the host.";
    document.getElementById("host-controls").classList.remove("hidden");
  } else {
    hostIndicatorElem.textContent = "Status: You are a guest. Host: " + peers[hostId].username;
    document.getElementById("host-controls").classList.add("hidden");
  }
}

// Append chat message to chat panel
function appendChatMessage(username, message) {
  const messagesElem = document.getElementById("chat-messages");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.innerHTML = `<span class="username">${username}:</span> <span class="text">${message}</span>`;
  messagesElem.appendChild(messageDiv);
  messagesElem.scrollTop = messagesElem.scrollHeight;
}

// Listen for chat message send
function setupChat() {
  const sendBtn = document.getElementById("sendMessageBtn");
  const messageInput = document.getElementById("messageInput");

  sendBtn.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message !== "") {
      room.send({
        type: "chatMessage",
        username: room.party.client.username,
        message: message,
      });
      appendChatMessage(room.party.client.username, message);
      messageInput.value = "";
    }
  });

  messageInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      sendBtn.click();
    }
  });
}

// Setup host controls if this client is host
function setupHostControls() {
  const setUrlBtn = document.getElementById("setUrlBtn");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const youtubeUrlInput = document.getElementById("youtubeUrlInput");

  setUrlBtn.addEventListener("click", () => {
    const url = youtubeUrlInput.value.trim();
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      currentVideoId = videoId;
      if (player) {
        player.loadVideoById(videoId);
      }
      // Broadcast new URL to all users
      room.send({
        type: "updateUrl",
        videoId: videoId,
      });
    } else {
      alert("Invalid YouTube URL!");
    }
  });

  playBtn.addEventListener("click", () => {
    if (player) {
      player.playVideo();
      // Broadcast play event with current time
      room.send({
        type: "updateState",
        playing: true,
        currentTime: player.getCurrentTime(),
      });
    }
  });

  pauseBtn.addEventListener("click", () => {
    if (player) {
      player.pauseVideo();
      // Broadcast pause event with current time
      room.send({
        type: "updateState",
        playing: false,
        currentTime: player.getCurrentTime(),
      });
    }
  });
}

// YouTube IFrame API callback
window.onYouTubeIframeAPIReady = function() {
  player = new YT.Player("player", {
    height: "450",
    width: "800",
    videoId: currentVideoId,
    playerVars: {
      // Enable modestbranding and rel controls
      modestbranding: 1,
      rel: 0,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
};

// Called when player is ready
function onPlayerReady(event) {
  // If not host, do nothing; wait for host instructions
  if (!isHost && currentVideoId) {
    player.cueVideoById(currentVideoId);
  }
}

// Called on player state changes
function onPlayerStateChange(event) {
  if (!isHost) return; // Only host broadcasts state changes
  const state = event.data;
  // When video starts or is paused, the host broadcasts the state
  if (state === YT.PlayerState.PLAYING) {
    room.send({
      type: "updateState",
      playing: true,
      currentTime: player.getCurrentTime(),
    });
  } else if (state === YT.PlayerState.PAUSED) {
    room.send({
      type: "updateState",
      playing: false,
      currentTime: player.getCurrentTime(),
    });
  }
}

// Handle incoming events from WebsimSocket
room.onmessage = (event) => {
  const data = event.data;
  switch (data.type) {
    case "updateUrl":
      // If this is not the host, update video URL
      if (!isHost) {
        currentVideoId = data.videoId;
        if (player) {
          player.loadVideoById(data.videoId);
        }
      }
      break;
    case "updateState":
      // Only apply updates if not host; host already controls their player
      if (!isHost && player) {
        player.seekTo(data.currentTime, true);
        if (data.playing) {
          player.playVideo();
        } else {
          player.pauseVideo();
        }
      }
      break;
    case "chatMessage":
      appendChatMessage(data.username, data.message);
      break;
    default:
      console.log("Received unknown event:", data);
  }
};

// Subscribe to changes in peers to update host status when someone connects/disconnects
room.party.subscribe(() => {
  updateHostStatus();
});

// Periodic sync from host to adjust video time drift
function startSyncInterval() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    if (isHost && player && player.getPlayerState() === YT.PlayerState.PLAYING) {
      room.send({
        type: "updateState",
        playing: true,
        currentTime: player.getCurrentTime(),
      });
    }
  }, 5000);
}

// Initialize the app after connection is ready
function init() {
  updateHostStatus();
  setupChat();
  setupHostControls();
  startSyncInterval();
}

// Wait a moment for room to initialize peers (simulate a delay if needed)
setTimeout(init, 1000);