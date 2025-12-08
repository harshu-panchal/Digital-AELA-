import { getRedisClient, isRedisAvailable } from "../config/redis.js";
import crypto from "crypto";

const CACHE_ENABLED = process.env.CACHE_ENABLED !== "false";
const DEFAULT_TTL = parseInt(process.env.REDIS_TTL_DEFAULT || "300", 10); // 5 minutes default

/**
 * Generate cache key from request
 * @param {Object} req - Express request object
 * @param {string} prefix - Cache key prefix
 * @returns {string} Cache key
 */
const generateCacheKey = (req, prefix = "api") => {
  const { path, query, auth } = req;
  const userId = auth?.userId || "anonymous";
  const role = auth?.userRole || "public";
  
  // Create hash of query params for consistent keys
  const queryHash = crypto
    .createHash("md5")
    .update(JSON.stringify(query))
    .digest("hex")
    .substring(0, 8);
  
  return `${prefix}:${path}:${userId}:${role}:${queryHash}`;
};

/**
 * Check if request should be cached
 * @param {Object} req - Express request object
 * @returns {boolean} True if should cache
 */
const shouldCache = (req) => {
  // Don't cache if caching is disabled
  if (!CACHE_ENABLED) return false;
  
  // Only cache GET requests
  if (req.method !== "GET") return false;
  
  // Don't cache authenticated admin requests (they need fresh data)
  const { userRole } = req.auth || {};
  if (userRole === "super-admin") {
    // Allow caching for super-admin if explicitly enabled via query param
    return req.query.cache === "true";
  }
  
  // Cache public and user-specific endpoints
  return true;
};

/**
 * Get cache TTL based on endpoint
 * @param {string} path - Request path
 * @returns {number} TTL in seconds
 */
const getCacheTTL = (path) => {
  // Public data - longer TTL
  if (path.includes("/home/data") || path.includes("/courses") || path.includes("/jobs") || path.includes("/blogs")) {
    return 900; // 15 minutes
  }
  
  // User dashboards - medium TTL
  if (path.includes("/dashboard") || path.includes("/analytics")) {
    return 300; // 5 minutes
  }
  
  // Frequently updated data - short TTL
  if (path.includes("/notifications") || path.includes("/messages")) {
    return 60; // 1 minute
  }
  
  // Default TTL
  return DEFAULT_TTL;
};

/**
 * Cache middleware
 * Caches GET requests based on path, query params, and user
 */
export const cacheMiddleware = async (req, res, next) => {
  // Check if should cache
  if (!shouldCache(req)) {
    return next();
  }
  
  // Check if Redis is available
  const redisAvailable = await isRedisAvailable();
  if (!redisAvailable) {
    // Redis not available, skip caching
    return next();
  }
  
  const cacheKey = generateCacheKey(req);
  const ttl = getCacheTTL(req.path);
  const redis = getRedisClient();
  
  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      
      // Add cache headers
      res.set("X-Cache", "HIT");
      res.set("Cache-Control", `public, max-age=${ttl}`);
      
      return res.status(200).json(data);
    }
    
    // Cache miss - continue to handler
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = function (data) {
      // Cache the response
      if (res.statusCode === 200 && data) {
        redis.setex(cacheKey, ttl, JSON.stringify(data)).catch((error) => {
          // Log but don't fail request if caching fails
          if (process.env.NODE_ENV === "development") {
            console.warn("[Cache] Failed to cache response:", error.message);
          }
        });
      }
      
      // Add cache headers
      res.set("X-Cache", "MISS");
      res.set("Cache-Control", `public, max-age=${ttl}`);
      
      // Call original json method
      return originalJson(data);
    };
    
    next();
  } catch (error) {
    // If caching fails, continue without cache
    if (process.env.NODE_ENV === "development") {
      console.warn("[Cache] Cache middleware error:", error.message);
    }
    next();
  }
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Cache key pattern (supports wildcards)
 */
export const invalidateCache = async (pattern) => {
  if (!CACHE_ENABLED) return;
  
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      if (process.env.NODE_ENV === "development") {
        console.log(`[Cache] Invalidated ${keys.length} cache entries matching: ${pattern}`);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Cache] Failed to invalidate cache:", error.message);
    }
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
  if (!CACHE_ENABLED) return;
  
  try {
    const redis = getRedisClient();
    await redis.flushdb();
    if (process.env.NODE_ENV === "development") {
      console.log("[Cache] Cleared all cache");
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Cache] Failed to clear cache:", error.message);
    }
  }
};

export default {
  cacheMiddleware,
  invalidateCache,
  clearAllCache,
  generateCacheKey,
};

