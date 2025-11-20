import { apiRequest } from "./baseClient";

/**
 * Get Active Sessions
 * GET /api/v1/sessions/active
 */
export const getActiveSessions = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.userId) searchParams.set("userId", params.userId);
  if (params.device) searchParams.set("device", params.device);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return apiRequest(`/sessions/active${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get All Sessions
 * GET /api/v1/sessions
 */
export const getAllSessions = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.userId) searchParams.set("userId", params.userId);
  if (params.isActive !== undefined) searchParams.set("isActive", params.isActive);
  if (params.device) searchParams.set("device", params.device);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return apiRequest(`/sessions${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Session Details
 * GET /api/v1/sessions/:sessionId
 */
export const getSessionDetails = async (sessionId) => {
  return apiRequest(`/sessions/${sessionId}`, {
    method: "GET",
  });
};

/**
 * Terminate Session
 * POST /api/v1/sessions/:sessionId/terminate
 */
export const terminateSession = async (sessionId) => {
  return apiRequest(`/sessions/${sessionId}/terminate`, {
    method: "POST",
  });
};

/**
 * Get Session Statistics
 * GET /api/v1/sessions/stats
 */
export const getSessionStats = async () => {
  return apiRequest("/sessions/stats", {
    method: "GET",
  });
};

/**
 * Get User Sessions
 * GET /api/v1/sessions/user/:userId
 */
export const getUserSessions = async (userId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.isActive !== undefined) searchParams.set("isActive", params.isActive);

  const query = searchParams.toString();
  return apiRequest(`/sessions/user/${userId}${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

