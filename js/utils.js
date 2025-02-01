export function getYouTubeVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

export function updateHostUI(isHost, hostUsername) {
  const hostControls = document.getElementById("host-controls");
  const hostIndicator = document.getElementById("hostIndicator");

  if (isHost) {
    hostIndicator.textContent = "Status: You are the host";
    hostControls.classList.remove("hidden");
  } else {
    hostIndicator.textContent = `Status: You are a guest. Host: ${hostUsername}`;
    hostControls.classList.add("hidden");
  }
}