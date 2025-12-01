/**
 * Media URL Utility
 * 
 * Converts relative /static/ URLs from the backend to full URLs
 * that can be used in img src, video src, and other media elements.
 * 
 * The backend serves static files at /static route (root level, not under /api/v1),
 * so we need to prepend the base URL without the /api/v1 path.
 */

import { getApiBaseUrlWithoutPath } from "../config/api.js";

/**
 * Convert a media URL to a full URL if it's a relative /static/ URL
 * 
 * @param {string|null|undefined} url - The URL to convert (can be null/undefined)
 * @returns {string|null} - The converted URL or null if input was null/undefined/empty
 * 
 * @example
 * // Relative URL (from backend)
 * getMediaUrl("/static/photos/testimonials/123.jpg")
 * // Returns: "http://localhost:5000/static/photos/testimonials/123.jpg"
 * 
 * // Already full URL (external)
 * getMediaUrl("https://example.com/image.jpg")
 * // Returns: "https://example.com/image.jpg"
 * 
 * // Null/undefined
 * getMediaUrl(null)
 * // Returns: null
 */
export const getMediaUrl = (url) => {
  // Handle null, undefined, or empty strings
  if (!url || typeof url !== "string" || url.trim() === "") {
    return null;
  }

  // If it's already a full URL (starts with http:// or https://), return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If it's a relative /static/ URL, prepend the base URL
  if (url.startsWith("/static/")) {
    const baseUrl = getApiBaseUrlWithoutPath();
    // Remove trailing slash from baseUrl if present, and ensure /static/ path is correct
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    return `${cleanBaseUrl}${url}`;
  }

  // If it's a relative URL that doesn't start with /static/, 
  // assume it's meant to be a /static/ URL (for backward compatibility)
  if (url.startsWith("/")) {
    const baseUrl = getApiBaseUrlWithoutPath();
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    return `${cleanBaseUrl}${url}`;
  }

  // For any other format, return as-is (might be a data URL or other format)
  return url;
};

/**
 * Get multiple media URLs at once
 * 
 * @param {Array<string|null|undefined>} urls - Array of URLs to convert
 * @returns {Array<string|null>} - Array of converted URLs
 */
export const getMediaUrls = (urls) => {
  if (!Array.isArray(urls)) {
    return [];
  }
  return urls.map(url => getMediaUrl(url));
};

