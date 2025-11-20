import { apiRequest } from "./baseClient";

/**
 * Get all live rooms (debates and open rooms)
 */
export const fetchLiveRooms = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append("type", params.type);
  if (params.status) queryParams.append("status", params.status);

  const queryString = queryParams.toString();
  return apiRequest(`/live-rooms${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get a single live room by ID
 */
export const fetchLiveRoom = (roomId) =>
  apiRequest(`/live-rooms/${roomId}`, {
    skipAuth: true, // Public endpoint
  });

/**
 * Create a new live room
 */
export const createLiveRoom = (payload) =>
  apiRequest("/live-rooms", {
    method: "POST",
    body: payload,
  });

/**
 * Vote on a debate
 */
export const voteOnDebate = (roomId, side) =>
  apiRequest(`/live-rooms/${roomId}/vote`, {
    method: "POST",
    body: { side },
  });

/**
 * Join a room
 */
export const joinRoom = (roomId) =>
  apiRequest(`/live-rooms/${roomId}/join`, {
    method: "POST",
    skipAuth: true, // Public endpoint
  });

/**
 * Leave a room
 */
export const leaveRoom = (roomId) =>
  apiRequest(`/live-rooms/${roomId}/leave`, {
    method: "POST",
    skipAuth: true, // Public endpoint
  });

