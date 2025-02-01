export class Chat {
  constructor(room) {
    this.room = room;
    this.messageInput = document.getElementById("messageInput");
    this.sendButton = document.getElementById("sendMessageBtn");
    this.messagesContainer = document.getElementById("chat-messages");
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.sendButton.addEventListener("click", () => this.sendMessage());
    this.messageInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      }
    });
  }

  sendMessage() {
    const message = this.messageInput.value.trim();
    if (message === "") return;

    this.room.send({
      type: "chatMessage",
      message: message,
    });

    this.appendMessage(this.room.getUsername(), message);
    this.messageInput.value = "";
  }

  appendMessage(username, message) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.innerHTML = `
      <span class="username">${username}:</span>
      <span class="text">${message}</span>
    `;
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}