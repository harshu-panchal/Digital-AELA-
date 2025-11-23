/**
 * API Health Check Utility
 * 
 * Provides utilities to check if the API is reachable and healthy.
 * Used by contexts to determine when to show dummy data vs error states.
 */

import { API_BASE_URL } from "../config/api.js";

let healthCheckCache = {
  isHealthy: null,
  lastCheck: null,
  cacheDuration: 30000, // Cache health check for 30 seconds
};

/**
 * Check if the API is reachable and healthy
 * @param {boolean} forceRefresh - Force a new check even if cached
 * @returns {Promise<boolean>} - True if API is healthy, false otherwise
 */
export const checkApiHealth = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached result if still valid and not forcing refresh
  if (
    !forceRefresh &&
    healthCheckCache.isHealthy !== null &&
    healthCheckCache.lastCheck &&
    now - healthCheckCache.lastCheck < healthCheckCache.cacheDuration
  ) {
    return healthCheckCache.isHealthy;
  }

  try {
    // Try to fetch a lightweight endpoint (health check or public settings)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${API_BASE_URL}/public/settings?category=health`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    // Consider API healthy if we get any response (even 404 is better than connection error)
    const isHealthy = response.status !== 0 && response.status < 500;

    // Update cache
    healthCheckCache = {
      isHealthy,
      lastCheck: now,
      cacheDuration: healthCheckCache.cacheDuration,
    };

    return isHealthy;
  } catch (error) {
    // Connection errors mean API is not healthy
    const isHealthy = false;

    // Update cache
    healthCheckCache = {
      isHealthy,
      lastCheck: now,
      cacheDuration: healthCheckCache.cacheDuration,
    };

    return isHealthy;
  }
};

/**
 * Clear the health check cache
 */
export const clearHealthCheckCache = () => {
  healthCheckCache = {
    isHealthy: null,
    lastCheck: null,
    cacheDuration: 30000,
  };
};

/**
 * Get cached health status (doesn't make a new request)
 * @returns {boolean|null} - Cached health status or null if not checked yet
 */
export const getCachedHealthStatus = () => {
  const now = Date.now();
  
  if (
    healthCheckCache.isHealthy !== null &&
    healthCheckCache.lastCheck &&
    now - healthCheckCache.lastCheck < healthCheckCache.cacheDuration
  ) {
    return healthCheckCache.isHealthy;
  }

  return null;
};

/**
 * Check if we should show dummy data based on API health and environment
 * @param {boolean} apiHealthy - Whether the API is healthy
 * @returns {boolean} - True if dummy data should be shown
 */
export const shouldShowDummyData = (apiHealthy) => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  // Only show dummy data in development mode when API is not healthy
  return isDevelopment && !apiHealthy;
};

