/**
 * Cache Invalidation Utilities (no-op version)
 * Redis has been removed. These functions are kept as stubs to preserve
 * the existing API surface so nothing breaks at import/call sites.
 */

export const invalidateCourseCache = async (courseId = null) => {
  // No-op: Redis removed
};

export const invalidateJobCache = async (jobId = null) => {
  // No-op: Redis removed
};

export const invalidateBlogCache = async (blogId = null) => {
  // No-op: Redis removed
};

export const invalidateUserCache = async (userId) => {
  // No-op: Redis removed
};

export const invalidateDashboardCache = async (userId = null, role = null) => {
  // No-op: Redis removed
};

export const invalidateAnalyticsCache = async (userId = null, role = null) => {
  // No-op: Redis removed
};

export const invalidateHomeCache = async () => {
  // No-op: Redis removed
};

export const invalidateSettingsCache = async () => {
  // No-op: Redis removed
};

export const invalidateAllCache = async () => {
  // No-op: Redis removed
};

export default {
  invalidateCourseCache,
  invalidateJobCache,
  invalidateBlogCache,
  invalidateUserCache,
  invalidateDashboardCache,
  invalidateAnalyticsCache,
  invalidateHomeCache,
  invalidateSettingsCache,
  invalidateAllCache,
};
