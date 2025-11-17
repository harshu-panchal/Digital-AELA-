import { apiRequest } from "./baseClient";

/**
 * Get all live rooms for moderation
 */
export const fetchLiveRoomsForModeration = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append("status", params.status);
  if (params.moderationStatus) queryParams.append("moderationStatus", params.moderationStatus);
  if (params.type) queryParams.append("type", params.type);
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  
  const queryString = queryParams.toString();
  return apiRequest(`/admin/live-rooms${queryString ? `?${queryString}` : ""}`);
};

/**
 * Moderate a live room (approve, suspend, reject, end)
 */
export const moderateLiveRoom = (roomId, action, reason = "") =>
  apiRequest(`/admin/live-rooms/${roomId}/moderate`, {
    method: "PATCH",
    body: { action, reason },
  });

/**
 * Delete a live room
 */
export const deleteLiveRoom = (roomId) =>
  apiRequest(`/admin/live-rooms/${roomId}`, {
    method: "DELETE",
  });

