import { WebsimSocket } from "https://cdn.jsdelivr.net/npm/websimsocket@1.0.0/dist/index.es.js";

class Room {
  constructor() {
    this.socket = new WebsimSocket();
    this.hostId = null;
    this.onHostChange = null;
    this.setupHostAssignment();
  }

  setupHostAssignment() {
    // Initial host assignment
    this.updateHost();
    
    // Update host when peers change
    this.socket.party.subscribe(() => {
      this.updateHost();
    });
  }

  updateHost() {
    const peers = this.socket.party.peers;
    const allClientsIds = Object.keys(peers);
    
    // If no other peers, current client becomes host
    if (allClientsIds.length === 0) {
      this.hostId = this.socket.party.client.id;
    } else {
      // Sort by connection time (implicit in the order of peers)
      allClientsIds.sort();
      this.hostId = allClientsIds[0];
    }

    if (this.onHostChange) {
      this.onHostChange(this.isHost(), this.getHostUsername());
    }
  }

  isHost() {
    return this.socket.party.client.id === this.hostId;
  }

  getHostUsername() {
    if (!this.hostId) return "Unknown";
    if (this.hostId === this.socket.party.client.id) {
      return this.socket.party.client.username;
    }
    return this.socket.party.peers[this.hostId]?.username || "Unknown";
  }

  send(data) {
    this.socket.send(data);
  }

  onMessage(callback) {
    this.socket.onmessage = callback;
  }

  getUsername() {
    return this.socket.party.client.username;
  }
}

export const room = new Room();