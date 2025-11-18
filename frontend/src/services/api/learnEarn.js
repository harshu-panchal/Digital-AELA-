import { apiRequest } from "./baseClient";

/**
 * Get Learn & Earn dashboard data
 * GET /api/v1/learn-earn/dashboard
 */
export const fetchDashboardData = async () => {
  return apiRequest("/learn-earn/dashboard", {
    method: "GET",
  });
};

/**
 * Get enhanced dashboard metrics
 * GET /api/v1/learn-earn/dashboard/metrics
 */
export const fetchEnhancedDashboardMetrics = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set("period", params.period);

  const query = searchParams.toString();
  return apiRequest(`/learn-earn/dashboard/metrics${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Search learners
 * GET /api/v1/learn-earn/search
 */
export const searchLearners = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/learn-earn/search${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Advanced search learners with filters
 * GET /api/v1/learn-earn/search/advanced
 */
export const advancedSearchLearners = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.minRating) searchParams.set("minRating", params.minRating);
  if (params.maxRating) searchParams.set("maxRating", params.maxRating);
  if (params.minCoins) searchParams.set("minCoins", params.minCoins);
  if (params.maxCoins) searchParams.set("maxCoins", params.maxCoins);
  if (params.interests) {
    const interests = Array.isArray(params.interests) ? params.interests.join(",") : params.interests;
    searchParams.set("interests", interests);
  }
  if (params.category) searchParams.set("category", params.category);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/learn-earn/search/advanced${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get enhanced leaderboard
 * GET /api/v1/learn-earn/leaderboard
 */
export const fetchEnhancedLeaderboard = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set("type", params.type);
  if (params.period) searchParams.set("period", params.period);
  if (params.category) searchParams.set("category", params.category);
  if (params.limit) searchParams.set("limit", params.limit);

  const query = searchParams.toString();
  return apiRequest(`/learn-earn/leaderboard${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get reward system statistics
 * GET /api/v1/learn-earn/rewards/stats
 */
export const fetchRewardSystemStats = async () => {
  return apiRequest("/learn-earn/rewards/stats", {
    method: "GET",
  });
};

/**
 * Get public user stats (earnings, learning stats)
 * GET /api/v1/student/:userId/stats
 */
export const fetchPublicUserStats = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  return apiRequest(`/student/${userId}/stats`, {
    method: "GET",
    skipAuth: true, // Public endpoint
  });
};
