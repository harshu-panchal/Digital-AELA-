import { apiRequest } from "./baseClient";

/**
 * Get room messages (chat history)
 */
export const getRoomMessages = (roomId, limit = 50) => {
  return apiRequest(`/live-rooms/${roomId}/messages?limit=${limit}`, {
    skipAuth: true, // Public endpoint (room is public)
  });
};

/**
 * Send room message
 */
export const sendRoomMessage = (roomId, content) => {
  return apiRequest(`/live-rooms/${roomId}/messages`, {
    method: "POST",
    body: { content },
  });
};

/**
 * Delete room message (host only)
 */
export const deleteRoomMessage = (roomId, messageId) => {
  return apiRequest(`/live-rooms/${roomId}/messages/${messageId}`, {
    method: "DELETE",
  });
};

/**
 * Mute user from chat (host only)
 */
export const muteUserChat = (roomId, userId) => {
  return apiRequest(`/live-rooms/${roomId}/messages/mute/${userId}`, {
    method: "POST",
  });
};

/**
 * Unmute user from chat (host only)
 */
export const unmuteUserChat = (roomId, userId) => {
  return apiRequest(`/live-rooms/${roomId}/messages/unmute/${userId}`, {
    method: "POST",
  });
};

