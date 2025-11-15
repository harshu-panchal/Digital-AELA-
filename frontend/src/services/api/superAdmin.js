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

