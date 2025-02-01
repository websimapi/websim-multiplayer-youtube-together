import { room } from './room.js';
import { YoutubePlayer } from './youtube.js';
import { Chat } from './chat.js';
import { getYouTubeVideoId, updateHostUI } from './utils.js';

class App {
  constructor() {
    this.currentVideoId = null;
    this.syncInterval = null;
    this.setupConnectionFlow();
  }

  setupConnectionFlow() {
    const connectBtn = document.getElementById("connectBtn");
    const connectOverlay = document.getElementById("connect-overlay");
    const container = document.getElementById("container");

    connectBtn.addEventListener("click", () => {
      // Initialize everything after connection button is clicked
      this.setupRoom();
      this.setupChat();
      this.setupYoutubePlayer();
      this.setupHostControls();

      // Hide overlay and show main container
      connectOverlay.style.display = "none";
      container.classList.remove("hidden");
    });
  }

  setupRoom() {
    room.onHostChange = (isHost, hostUsername) => {
      updateHostUI(isHost, hostUsername);
    };

    room.onMessage((event) => {
      const data = event.data;
      switch (data.type) {
        case "updateUrl":
          if (!room.isHost()) {
            this.currentVideoId = data.videoId;
            this.player?.loadVideo(data.videoId);
          }
          break;
        case "updateState":
          if (!room.isHost() && this.player) {
            this.player.seekTo(data.currentTime);
            if (data.playing) {
              this.player.play();
            } else {
              this.player.pause();
            }
          }
          break;
        case "chatMessage":
          this.chat.appendMessage(data.username, data.message);
          break;
      }
    });
  }

  setupChat() {
    this.chat = new Chat(room);
  }

  setupYoutubePlayer() {
    this.player = new YoutubePlayer((player) => {
      if (!room.isHost() && this.currentVideoId) {
        player.loadVideo(this.currentVideoId);
      }
    });

    this.player.setStateChangeHandler((event) => {
      if (!room.isHost()) return;
      
      const state = event.data;
      if (state === YT.PlayerState.PLAYING) {
        room.send({
          type: "updateState",
          playing: true,
          currentTime: this.player.getCurrentTime(),
        });
      } else if (state === YT.PlayerState.PAUSED) {
        room.send({
          type: "updateState",
          playing: false,
          currentTime: this.player.getCurrentTime(),
        });
      }
    });
  }

  setupHostControls() {
    const setUrlBtn = document.getElementById("setUrlBtn");
    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const youtubeUrlInput = document.getElementById("youtubeUrlInput");

    setUrlBtn.addEventListener("click", () => {
      const videoId = getYouTubeVideoId(youtubeUrlInput.value.trim());
      if (videoId) {
        this.currentVideoId = videoId;
        this.player.loadVideo(videoId);
        room.send({
          type: "updateUrl",
          videoId: videoId,
        });
      }
    });

    playBtn.addEventListener("click", () => {
      this.player.play();
      room.send({
        type: "updateState",
        playing: true,
        currentTime: this.player.getCurrentTime(),
      });
    });

    pauseBtn.addEventListener("click", () => {
      this.player.pause();
      room.send({
        type: "updateState",
        playing: false,
        currentTime: this.player.getCurrentTime(),
      });
    });

    // Start sync interval
    this.syncInterval = setInterval(() => {
      if (room.isHost() && 
          this.player && 
          this.player.getPlayerState() === YT.PlayerState.PLAYING) {
        room.send({
          type: "updateState",
          playing: true,
          currentTime: this.player.getCurrentTime(),
        });
      }
    }, 5000);
  }
}

// Initialize the application
new App();