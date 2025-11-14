import { apiRequest } from "./baseClient";

export const fetchSocialStats = (userId = null) => {
  if (userId) {
    return apiRequest(`/social/${userId}/stats`, {
      skipAuth: true, // Public endpoint
    });
  }
  return apiRequest("/social/stats"); // Uses authenticated user's ID
};

export const fetchFollowers = (userId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/social/${userId}/followers${query ? `?${query}` : ""}`, {
    skipAuth: true, // Public endpoint
  });
};

export const fetchFollowing = (userId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/social/${userId}/following${query ? `?${query}` : ""}`, {
    skipAuth: true, // Public endpoint
  });
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

