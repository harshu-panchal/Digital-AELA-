/**
 * Native WebRTC Signaling Service
 * Handles WebRTC signaling via Socket.IO (no mediasoup required)
 * Peer connections are created in the browser, this service only handles signaling
 */

// Store active speakers (users with audio streams) per room
// Structure: Map<roomId, Set<socketId>>
const roomSpeakers = new Map();

/**
 * Add a speaker to a room
 */
export function addSpeaker(roomId, socketId) {
  if (!roomSpeakers.has(roomId)) {
    roomSpeakers.set(roomId, new Set());
  }
  roomSpeakers.get(roomId).add(socketId);
}

/**
 * Remove a speaker from a room
 */
export function removeSpeaker(roomId, socketId) {
  const speakers = roomSpeakers.get(roomId);
  if (speakers) {
    speakers.delete(socketId);
    if (speakers.size === 0) {
      roomSpeakers.delete(roomId);
    }
  }
}

/**
 * Get all speakers in a room
 */
export function getRoomSpeakers(roomId) {
  const speakers = roomSpeakers.get(roomId);
  if (!speakers) {
    return [];
  }
  return Array.from(speakers);
}

/**
 * Check if a user is a speaker in a room
 */
export function isSpeaker(roomId, socketId) {
  const speakers = roomSpeakers.get(roomId);
  return speakers ? speakers.has(socketId) : false;
}

/**
 * Clean up all speakers in a room
 */
export function cleanupRoom(roomId) {
  roomSpeakers.delete(roomId);
}

/**
 * Get WebRTC configuration (STUN/TURN servers)
 */
export function getWebRTCConfig() {
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Add TURN server if configured
  if (process.env.TURN_SERVER_URL && process.env.TURN_SERVER_USERNAME && process.env.TURN_SERVER_CREDENTIAL) {
    config.iceServers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_SERVER_USERNAME,
      credential: process.env.TURN_SERVER_CREDENTIAL,
    });
  }

  return config;
}

