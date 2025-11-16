import { apiRequest } from "./baseClient";

export const fetchDashboardData = () => apiRequest("/learn-earn/dashboard");

export const searchLearners = (query, params = {}) => {
  const searchParams = new URLSearchParams({ q: query });
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  return apiRequest(`/learn-earn/search?${searchParams.toString()}`);
};

export const fetchPublicUserStats = (userId) =>
  apiRequest(`/students/${userId}/stats`, {
    skipAuth: true, // Public endpoint
  });

