import { WebsimSocket } from "https://cdn.jsdelivr.net/npm/websimsocket@1.0.0/dist/index.es.js";

class Room {
  constructor() {
    this.socket = new WebsimSocket();
    this.hostId = null;
    this.onHostChange = null;
    this.setupHostAssignment();
  }

  setupHostAssignment() {
    // Initial host assignment when socket connects
    this.socket.onopen = () => {
      this.updateHost();
    };
    
    // Update host when peers change (join/leave)
    this.socket.party.subscribe((peers) => {
      this.updateHost();
    });
  }

  updateHost() {
    const peers = this.socket.party.peers;
    const clientId = this.socket.party.client.id;
    
    // Get all connected peers including current client
    const allPeers = { 
      ...peers,
      [clientId]: {
        username: this.socket.party.client.username,
        id: clientId
      }
    };

    // Get array of all peer IDs
    const peerIds = Object.keys(allPeers);

    if (peerIds.length === 0) {
      // If somehow no peers (shouldn't happen), current client is host
      this.hostId = clientId;
    } else {
      // First connected peer becomes host
      // The peers object maintains insertion order, so first key is oldest peer
      this.hostId = peerIds[0];
    }

    // Notify of host change
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