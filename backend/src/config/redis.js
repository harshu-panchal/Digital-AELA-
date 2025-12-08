import Redis from "ioredis";

let redisClient = null;
let lastErrorLogTime = 0;
const ERROR_LOG_INTERVAL = 30000; // Log errors at most once every 30 seconds
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5; // Stop trying after 5 attempts
let hasReachedMaxAttempts = false;

/**
 * Get or create Redis client
 * @returns {Redis} Redis client instance
 */
export const getRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const redisPassword = process.env.REDIS_PASSWORD;

  try {
    redisClient = new Redis(redisUrl, {
      password: redisPassword,
      retryStrategy: (times) => {
        // Stop retrying after max attempts
        if (hasReachedMaxAttempts || times > MAX_RECONNECT_ATTEMPTS) {
          hasReachedMaxAttempts = true;
          return null; // Stop reconnecting
        }
        reconnectAttempts = times;
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      lazyConnect: false,
      showFriendlyErrorStack: false, // Reduce error stack noise
    });

    redisClient.on("error", (error) => {
      // Suppress errors if we've reached max attempts
      if (hasReachedMaxAttempts) {
        return; // Silently ignore errors after max attempts
      }
      
      const now = Date.now();
      // Only log errors occasionally to avoid spam
      if (now - lastErrorLogTime > ERROR_LOG_INTERVAL) {
        console.warn("[Redis] Connection error (Redis unavailable - caching disabled):", error.message);
        lastErrorLogTime = now;
      }
      // Don't crash the app if Redis is unavailable
    });

    redisClient.on("connect", () => {
      reconnectAttempts = 0; // Reset on successful connection
      console.log("[Redis] Connecting to Redis...");
    });

    redisClient.on("ready", () => {
      reconnectAttempts = 0; // Reset on ready
      hasReachedMaxAttempts = false; // Reset flag on successful connection
      console.log("[Redis] Connected to Redis");
    });

    redisClient.on("close", () => {
      // Suppress close logs completely - they're expected when Redis is unavailable
      // No need to log these
    });

    redisClient.on("reconnecting", (delay) => {
      if (hasReachedMaxAttempts) {
        return; // Don't log if we've already reached max attempts
      }
      
      reconnectAttempts++;
      // Only log reconnection attempts occasionally, and stop after max attempts
      if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        const now = Date.now();
        if (now - lastErrorLogTime > ERROR_LOG_INTERVAL) {
          console.warn(`[Redis] Reconnecting... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          lastErrorLogTime = now;
        }
      } else if (reconnectAttempts === MAX_RECONNECT_ATTEMPTS + 1) {
        hasReachedMaxAttempts = true;
        // Log once when we stop trying
        console.warn("[Redis] Max reconnection attempts reached. Redis will remain unavailable. Caching is disabled.");
        // Disconnect to stop further reconnection attempts
        redisClient.disconnect();
      }
    });

    return redisClient;
  } catch (error) {
    console.error("[Redis] Failed to create Redis client:", error);
    // Return a mock client that does nothing if Redis fails
    return {
      get: async () => null,
      set: async () => "OK",
      del: async () => 0,
      exists: async () => 0,
      keys: async () => [],
      flushdb: async () => "OK",
      ping: async () => "PONG",
      quit: async () => "OK",
    };
  }
};

/**
 * Check if Redis is available
 * @returns {Promise<boolean>} True if Redis is available
 */
export const isRedisAvailable = async () => {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === "PONG";
  } catch (error) {
    return false;
  }
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default {
  getRedisClient,
  isRedisAvailable,
  closeRedis,
};

