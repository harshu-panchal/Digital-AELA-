import { apiRequest } from "./baseClient";

/**
 * Get user's notifications
 * GET /api/v1/notifications
 */
export const fetchNotifications = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.type) searchParams.set("type", params.type);
  if (params.isRead !== undefined) searchParams.set("isRead", params.isRead);
  if (params.unreadOnly) searchParams.set("unreadOnly", params.unreadOnly);

  const query = searchParams.toString();
  return apiRequest(`/notifications${query ? `?${query}` : ""}`);
};

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
export const fetchUnreadCount = async () => {
  return apiRequest("/notifications/unread-count");
};

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:notificationId/read
 */
export const markAsRead = async (notificationId) => {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
};

/**
 * Mark all notifications as read
 * PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = async () => {
  return apiRequest("/notifications/read-all", {
    method: "PATCH",
  });
};

/**
 * Delete notification
 * DELETE /api/v1/notifications/:notificationId
 */
export const deleteNotification = async (notificationId) => {
  return apiRequest(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
};

/**
 * Clear all read notifications
 * DELETE /api/v1/notifications/clear-all
 */
export const clearAllRead = async () => {
  return apiRequest("/notifications/clear-all", {
    method: "DELETE",
  });
};

