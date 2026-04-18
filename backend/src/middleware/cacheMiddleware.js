import crypto from "crypto";

/**
 * Cache Middleware (no-op version)
 * Redis has been removed. These functions are kept as stubs to preserve
 * the existing API surface so nothing breaks at import/call sites.
 */

/**
 * Generate cache key from request (kept for API compatibility)
 */
export const generateCacheKey = (req, prefix = "api") => {
  const { path, query, auth } = req;
  const userId = auth?.userId || "anonymous";
  const role = auth?.userRole || "public";
  const queryHash = crypto
    .createHash("md5")
    .update(JSON.stringify(query))
    .digest("hex")
    .substring(0, 8);
  return `${prefix}:${path}:${userId}:${role}:${queryHash}`;
};

/**
 * Cache middleware - passes through immediately (no caching without Redis)
 */
export const cacheMiddleware = (req, res, next) => {
  next();
};

/**
 * Invalidate cache by pattern - no-op without Redis
 */
export const invalidateCache = async (pattern) => {
  // No-op: Redis removed
};

/**
 * Clear all cache - no-op without Redis
 */
export const clearAllCache = async () => {
  // No-op: Redis removed
};

export default {
  cacheMiddleware,
  invalidateCache,
  clearAllCache,
  generateCacheKey,
};
