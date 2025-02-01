export class YoutubePlayer {
  constructor(onReady) {
    this.player = null;
    this.onReady = onReady;
    this.setupPlayer();
  }

  setupPlayer() {
    window.onYouTubeIframeAPIReady = () => {
      this.player = new YT.Player("player", {
        height: "450",
        width: "800",
        playerVars: {
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => this.onReady(this),
          onStateChange: (event) => {
            if (this.onStateChange) {
              this.onStateChange(event);
            }
          }
        },
      });
    };
  }

  setStateChangeHandler(handler) {
    this.onStateChange = handler;
  }

  loadVideo(videoId) {
    if (this.player && videoId) {
      this.player.loadVideoById(videoId);
    }
  }

  play() {
    if (this.player) {
      this.player.playVideo();
    }
  }

  pause() {
    if (this.player) {
      this.player.pauseVideo();
    }
  }

  seekTo(time) {
    if (this.player) {
      this.player.seekTo(time, true);
    }
  }

  getCurrentTime() {
    return this.player ? this.player.getCurrentTime() : 0;
  }

  getPlayerState() {
    return this.player ? this.player.getPlayerState() : -1;
  }
}