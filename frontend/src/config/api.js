/**
 * Centralized API Configuration
 *
 * This file provides a single source of truth for the API base URL.
 * All API service files should import from this file instead of directly
 * accessing import.meta.env.VITE_API_URL.
 *
 * Environment Variable:
 * - VITE_API_URL: The base URL for the API (e.g., "https://api.example.com/api/v1")
 *
 * If VITE_API_URL is not set, it defaults to localhost for development.
 * In production, VITE_API_URL MUST be set in the deployment platform (e.g., Vercel).
 */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    // Remove trailing slashes
    return envUrl.replace(/\/$/, "");
  }

  // Default to localhost for development
  const isDevelopment =
    import.meta.env.DEV || import.meta.env.MODE === "development";
  if (isDevelopment) {
    return "http://localhost:5000/api/v1";
  }

  // In production, if VITE_API_URL is not set, log a critical error
  if (import.meta.env.PROD) {
    console.error(
      "[API Config] ❌ CRITICAL: VITE_API_URL is not set in production!\n" +
        "Translation and all API calls will fail.\n" +
        "Please set VITE_API_URL environment variable in your deployment platform (Vercel, Netlify, etc.)\n" +
        "Example: VITE_API_URL=https://your-backend-domain.com/api/v1"
    );
  }

  // Fallback (should not be used in production)
  return "http://localhost:5000/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();

// Export a function to get the base URL without /api/v1 suffix (for Socket.IO, etc.)
export const getApiBaseUrlWithoutPath = () => {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
};

// API Base URL is configured above
