
import Redis from "ioredis";

let redisClient = null;
let lastErrorLogTime = 0;
const ERROR_LOG_INTERVAL = 30000; // Log errors at most once every 30 seconds
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3; // Reduced from 5 to fail faster
let hasReachedMaxAttempts = false;
let isMockClient = false;

// Mock client implementation for when Redis is unavailable
const createMockClient = () => {
  console.warn("[Redis] Using in-memory mock client (Data will not be persisted)");
  isMockClient = true;
  const store = new Map();

  return {
    get: async (key) => store.get(key) || null,
    set: async (key, value, ...args) => {
      store.set(key, value);
      return "OK";
    },
    del: async (key) => {
      const existed = store.has(key);
      store.delete(key);
      return existed ? 1 : 0;
    },
    exists: async (key) => store.has(key) ? 1 : 0,
    keys: async (pattern) => {
      // Simple prefix matching for mock
      const prefix = pattern.replace('*', '');
      return Array.from(store.keys()).filter(k => k.startsWith(prefix));
    },
    flushdb: async () => {
      store.clear();
      return "OK";
    },
    ping: async () => "PONG",
    quit: async () => "OK",
    disconnect: () => { },
    on: (event, callback) => { }, // No-op event listener
    status: "ready"
  };
};

/**
 * Get or create Redis client
 * @returns {Redis} Redis client instance
 */
export const getRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  // If we've already failed to connect max times, return mock immediately
  if (hasReachedMaxAttempts) {
    if (!isMockClient) {
      redisClient = createMockClient();
    }
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const redisPassword = process.env.REDIS_PASSWORD;

  try {
    const options = {
      retryStrategy: (times) => {
        // Stop retrying after max attempts
        if (hasReachedMaxAttempts || times > MAX_RECONNECT_ATTEMPTS) {
          hasReachedMaxAttempts = true;
          console.warn("[Redis] Max reconnection attempts reached. Switching to mock client.");
          // We can't easily swap the client instance out from under the caller, 
          // but we can ensure future calls get the mock.
          return null; // Stop reconnecting
        }
        reconnectAttempts = times;
        return Math.min(times * 200, 2000); // 200ms, 400ms, 600ms...
      },
      maxRetriesPerRequest: 1, // Fail fast on requests
      enableReadyCheck: true,
      enableOfflineQueue: false, // Start failing commands immediately if offline
      lazyConnect: true, // Don't connect immediately
      showFriendlyErrorStack: false,
    };

    if (redisPassword) {
      options.password = redisPassword;
    }

    redisClient = new Redis(redisUrl, options);

    // Initial connection attempt
    redisClient.connect().catch(() => {
      // Initial connection failed, but retry strategy will handle it
      // or it will eventually trigger the max attempts logic
    });

    redisClient.on("error", (error) => {
      if (hasReachedMaxAttempts) return;

      const now = Date.now();
      if (now - lastErrorLogTime > ERROR_LOG_INTERVAL) {
        console.warn("[Redis] Connection error:", error.message || error || "Unknown connection error");
        lastErrorLogTime = now;
      }
    });

    redisClient.on("connect", () => {
      reconnectAttempts = 0;
      console.log("[Redis] Connecting...");
    });

    redisClient.on("ready", () => {
      reconnectAttempts = 0;
      hasReachedMaxAttempts = false;
      isMockClient = false;
      console.log("[Redis] Connected and ready");
    });

    redisClient.on("close", () => {
      // Silent close
    });

    redisClient.on("end", () => {
      // If connection ended and we reached max attempts, ensure next getRedisClient returns mock
      if (hasReachedMaxAttempts) {
        redisClient = null; // Clear it so next call creates mock
      }
    });

    return redisClient;
  } catch (error) {
    console.error("[Redis] Failed to create Redis client:", error.message);
    hasReachedMaxAttempts = true;
    redisClient = createMockClient();
    return redisClient;
  }
};

/**
 * Check if Redis is available
 * @returns {Promise<boolean>} True if Redis is available
 */
export const isRedisAvailable = async () => {
  try {
    const client = getRedisClient();
    if (isMockClient) return false; // Mock client means real Redis is down

    // Set a short timeout for ping
    const pingPromise = client.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Ping timeout")), 1000)
    );

    const result = await Promise.race([pingPromise, timeoutPromise]);
    return result === "PONG";
  } catch (error) {
    return false;
  }
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  if (redisClient && !isMockClient) {
    await redisClient.quit().catch(() => { });
    redisClient = null;
  }
};

export default {
  getRedisClient,
  isRedisAvailable,
  closeRedis,
};

