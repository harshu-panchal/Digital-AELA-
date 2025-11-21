import { apiRequest } from "./baseClient";

/**
 * Get all rewards (public)
 */
export const getRewards = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.activeOnly !== undefined) searchParams.set("activeOnly", params.activeOnly);
  const query = searchParams.toString();
  return apiRequest(`/rewards${query ? `?${query}` : ""}`, {
    skipAuth: true,
  });
};

/**
 * Get single reward
 */
export const getReward = (rewardId) =>
  apiRequest(`/rewards/${rewardId}`, {
    skipAuth: true,
  });

/**
 * Create reward (admin only)
 */
export const createReward = (payload) =>
  apiRequest("/rewards", {
    method: "POST",
    body: JSON.stringify(payload),
  });

/**
 * Update reward (admin only)
 */
export const updateReward = (rewardId, payload) =>
  apiRequest(`/rewards/${rewardId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

/**
 * Delete reward (admin only)
 */
export const deleteReward = (rewardId) =>
  apiRequest(`/rewards/${rewardId}`, {
    method: "DELETE",
  });

/**
 * Get reward analytics (admin only)
 */
export const getRewardAnalytics = () => apiRequest("/rewards/analytics");

