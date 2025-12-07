import { apiRequest } from "./baseClient";

/**
 * Get all super admin dashboard data
 */
export const fetchDashboardData = () => apiRequest("/admin/dashboard");

/**
 * Get dashboard statistics only
 */
export const fetchDashboardStats = () => apiRequest("/admin/stats");

/**
 * Get pending approvals only
 */
export const fetchPendingApprovals = () => apiRequest("/admin/approvals");

/**
 * Get recent activity only
 */
export const fetchRecentActivity = () => apiRequest("/admin/activity");

/**
 * Get system health status
 */
export const fetchSystemHealth = () => apiRequest("/admin/system-health");

/**
 * Advanced Analytics APIs
 */

/**
 * Get platform overview analytics
 * GET /api/v1/admin/analytics/overview
 */
export const fetchOverviewAnalytics = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  const query = searchParams.toString();
  return apiRequest(`/admin/analytics/overview${query ? `?${query}` : ""}`);
};

/**
 * Get user analytics
 * GET /api/v1/admin/analytics/users
 */
export const fetchUserAnalytics = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.groupBy) searchParams.set("groupBy", params.groupBy);
  const query = searchParams.toString();
  return apiRequest(`/admin/analytics/users${query ? `?${query}` : ""}`);
};

/**
 * Get course analytics
 * GET /api/v1/admin/analytics/courses
 */
export const fetchCourseAnalytics = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.groupBy) searchParams.set("groupBy", params.groupBy);
  const query = searchParams.toString();
  return apiRequest(`/admin/analytics/courses${query ? `?${query}` : ""}`);
};

/**
 * Get revenue analytics
 * GET /api/v1/admin/analytics/revenue
 */
export const fetchRevenueAnalytics = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.groupBy) searchParams.set("groupBy", params.groupBy);
  const query = searchParams.toString();
  return apiRequest(`/admin/analytics/revenue${query ? `?${query}` : ""}`);
};

/**
 * Get job portal analytics
 * GET /api/v1/admin/analytics/jobs
 */
export const fetchJobAnalytics = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.groupBy) searchParams.set("groupBy", params.groupBy);
  const query = searchParams.toString();
  return apiRequest(`/admin/analytics/jobs${query ? `?${query}` : ""}`);
};

/**
 * System Settings APIs
 */

/**
 * Get all settings or by category
 * GET /api/v1/admin/settings
 */
export const fetchAllSettings = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.public) searchParams.set("public", params.public);
  const query = searchParams.toString();
  return apiRequest(`/admin/settings${query ? `?${query}` : ""}`);
};

/**
 * Get a specific setting by key
 * GET /api/v1/admin/settings/:key
 */
export const fetchSetting = (key) => apiRequest(`/admin/settings/${key}`);

/**
 * Verify Financial Password
 * POST /api/v1/admin/settings/financial-password/verify
 */
export const verifyFinancialPassword = async (password) => {
  const response = await apiRequest("/admin/settings/financial-password/verify", {
    method: "POST",
    body: { password },
  });
  return response.valid === true;
};

/**
 * Set Financial Password
 * POST /api/v1/admin/settings/financial-password/set
 */
export const setFinancialPassword = async (password) => {
  return apiRequest("/admin/settings/financial-password/set", {
    method: "POST",
    body: { password },
  });
};

/**
 * Request Financial Password Reset
 * POST /api/v1/admin/settings/financial-password/request-reset
 */
export const requestFinancialPasswordReset = async () => {
  return apiRequest("/admin/settings/financial-password/request-reset", {
    method: "POST",
  });
};

/**
 * Verify Financial Password Reset Token
 * GET /api/v1/admin/settings/financial-password/verify-token?token=xxx
 */
export const verifyFinancialPasswordToken = async (token) => {
  return apiRequest(`/admin/settings/financial-password/verify-token?token=${encodeURIComponent(token)}`);
};

/**
 * Reset Financial Password with Token
 * POST /api/v1/admin/settings/financial-password/reset
 */
export const resetFinancialPasswordWithToken = async (token, newPassword) => {
  return apiRequest("/admin/settings/financial-password/reset", {
    method: "POST",
    body: { token, newPassword },
  });
};

/**
 * Get settings by category
 * GET /api/v1/admin/settings/category/:category
 */
export const fetchSettingsByCategory = (category) => apiRequest(`/admin/settings/category/${category}`);

/**
 * Update settings (bulk)
 * PUT /api/v1/admin/settings
 */
export const updateSettings = (settings) => apiRequest("/admin/settings", { method: "PUT", body: { settings } });

/**
 * Update a single setting
 * PATCH /api/v1/admin/settings/:key
 */
export const updateSetting = (key, data) => apiRequest(`/admin/settings/${key}`, { method: "PATCH", body: data });

/**
 * Delete a setting
 * DELETE /api/v1/admin/settings/:key
 */
export const deleteSetting = (key) => apiRequest(`/admin/settings/${key}`, { method: "DELETE" });

/**
 * Initialize default settings
 * POST /api/v1/admin/settings/initialize
 */
export const initializeDefaultSettings = () => apiRequest("/admin/settings/initialize", { method: "POST" });

