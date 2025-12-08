import { invalidateCache, clearAllCache } from "../middleware/cacheMiddleware.js";

/**
 * Cache Invalidation Utilities
 * Provides functions to invalidate cache on data mutations
 */

/**
 * Invalidate course-related cache
 * @param {string} courseId - Optional course ID for specific invalidation
 */
export const invalidateCourseCache = async (courseId = null) => {
  if (courseId) {
    // Invalidate specific course cache
    await invalidateCache(`api:*courses*:${courseId}*`);
  }
  // Invalidate all course listings
  await invalidateCache("api:*courses*");
  await invalidateCache("api:*home*");
};

/**
 * Invalidate job-related cache
 * @param {string} jobId - Optional job ID for specific invalidation
 */
export const invalidateJobCache = async (jobId = null) => {
  if (jobId) {
    await invalidateCache(`api:*jobs*:${jobId}*`);
  }
  await invalidateCache("api:*jobs*");
  await invalidateCache("api:*home*");
};

/**
 * Invalidate blog-related cache
 * @param {string} blogId - Optional blog ID for specific invalidation
 */
export const invalidateBlogCache = async (blogId = null) => {
  if (blogId) {
    await invalidateCache(`api:*blogs*:${blogId}*`);
  }
  await invalidateCache("api:*blogs*");
};

/**
 * Invalidate user-specific cache
 * @param {string} userId - User ID
 */
export const invalidateUserCache = async (userId) => {
  if (userId) {
    await invalidateCache(`api:*:${userId}:*`);
    await invalidateCache(`api:*dashboard*:${userId}*`);
    await invalidateCache(`api:*analytics*:${userId}*`);
  }
};

/**
 * Invalidate dashboard cache
 * @param {string} userId - Optional user ID
 * @param {string} role - Optional user role
 */
export const invalidateDashboardCache = async (userId = null, role = null) => {
  if (userId) {
    await invalidateCache(`api:*dashboard*:${userId}*`);
  } else if (role) {
    await invalidateCache(`api:*dashboard*:*:${role}*`);
  } else {
    await invalidateCache("api:*dashboard*");
  }
};

/**
 * Invalidate analytics cache
 * @param {string} userId - Optional user ID
 * @param {string} role - Optional user role
 */
export const invalidateAnalyticsCache = async (userId = null, role = null) => {
  if (userId) {
    await invalidateCache(`api:*analytics*:${userId}*`);
  } else if (role) {
    await invalidateCache(`api:*analytics*:*:${role}*`);
  } else {
    await invalidateCache("api:*analytics*");
  }
};

/**
 * Invalidate home page cache
 */
export const invalidateHomeCache = async () => {
  await invalidateCache("api:*home*");
};

/**
 * Invalidate settings cache
 */
export const invalidateSettingsCache = async () => {
  await invalidateCache("api:*settings*");
};

/**
 * Invalidate all cache (use with caution)
 */
export const invalidateAllCache = async () => {
  await clearAllCache();
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

