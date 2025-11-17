import { apiRequest } from "./baseClient";

/**
 * Get student points
 * GET /api/v1/students/points
 */
export const fetchStudentPoints = async () => {
  return apiRequest("/students/points", {
    method: "GET",
  });
};

/**
 * Update student points
 * PATCH /api/v1/students/points
 * @param {Object} payload - { amount, type, reason, source }
 */
export const updateStudentPoints = async (payload) => {
  return apiRequest("/students/points", {
    method: "PATCH",
    body: payload,
  });
};

/**
 * Get points transaction history
 * GET /api/v1/students/points/history
 * @param {Object} params - { page, pageSize, type, source }
 */
export const fetchPointsHistory = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.type) searchParams.set("type", params.type);
  if (params.source) searchParams.set("source", params.source);

  const query = searchParams.toString();
  return apiRequest(`/students/points/history${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get points statistics
 * GET /api/v1/students/points/stats
 */
export const fetchPointsStats = async () => {
  return apiRequest("/students/points/stats", {
    method: "GET",
  });
};

