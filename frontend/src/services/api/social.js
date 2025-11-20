import { apiRequest } from "./baseClient";

export const fetchSocialStats = (userId = null) => {
  if (userId) {
    return apiRequest(`/social/${userId}/stats`);
  }
  return apiRequest("/social/stats"); // Uses authenticated user's ID
};

export const fetchFollowers = (userId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/social/${userId}/followers${query ? `?${query}` : ""}`);
};

export const fetchFollowing = (userId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/social/${userId}/following${query ? `?${query}` : ""}`);
};

export const followUser = (targetUserId) =>
  apiRequest("/social/follow", {
    method: "POST",
    body: { targetUserId },
  });

export const unfollowUser = (targetUserId) =>
  apiRequest(`/social/follow/${targetUserId}`, {
    method: "DELETE",
  });

export const shareCoins = (recipientUserId, amount, note = "") =>
  apiRequest("/social/share-coins", {
    method: "POST",
    body: { recipientUserId, amount, note },
  });

/**
 * Get social feed/activity stream
 * GET /api/v1/social/feed
 */
export const fetchSocialFeed = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.type) searchParams.set("type", params.type);

  const query = searchParams.toString();
  return apiRequest(`/social/feed${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get enhanced follower suggestions
 * GET /api/v1/social/suggestions
 */
export const fetchFollowerSuggestions = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", params.limit);

  const query = searchParams.toString();
  return apiRequest(`/social/suggestions${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get social notifications
 * GET /api/v1/social/notifications
 */
export const fetchSocialNotifications = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.type) searchParams.set("type", params.type);
  if (params.unreadOnly) searchParams.set("unreadOnly", params.unreadOnly);

  const query = searchParams.toString();
  return apiRequest(`/social/notifications${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Mark notifications as read
 * PATCH /api/v1/social/notifications/read
 */
export const markSocialNotificationsRead = async (notificationIds = null, markAll = false) => {
  return apiRequest("/social/notifications/read", {
    method: "PATCH",
    body: { notificationIds, markAll },
  });
};

/**
 * Bulk share coins
 * POST /api/v1/social/share-coins/bulk
 */
export const bulkShareCoins = async (recipients, amount, note = "") => {
  return apiRequest("/social/share-coins/bulk", {
    method: "POST",
    body: { recipients, amount, note },
  });
};

/**
 * Get coin sharing history
 * GET /api/v1/social/share-coins/history
 */
export const fetchCoinSharingHistory = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set("type", params.type);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/social/share-coins/history${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get coin sharing limits
 * GET /api/v1/social/share-coins/limits
 */
export const fetchCoinSharingLimits = async () => {
  return apiRequest("/social/share-coins/limits", {
    method: "GET",
  });
};

