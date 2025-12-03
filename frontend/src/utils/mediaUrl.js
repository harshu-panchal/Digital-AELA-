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
export const getMediaUrl = (url, options = {}) => {
  // Handle null, undefined, or empty strings
  if (!url || typeof url !== "string" || url.trim() === "") {
    return null;
  }

  let finalUrl = url.trim();

  // Handle data URLs (from FileReader) - return as-is
  if (finalUrl.startsWith("data:")) {
    return finalUrl;
  }

  // Check for malformed URLs like "https://static/..." or "http://static/..." (missing domain)
  // These should be fixed by extracting the path and reconstructing with proper base URL
  if (finalUrl.startsWith("https://static/") || finalUrl.startsWith("http://static/")) {
    // Extract the path part (everything after "https://static" or "http://static")
    const path = finalUrl.replace(/^https?:\/\/static/, "");
    finalUrl = path; // Continue processing as a relative URL
  }

  // If it's already a full URL (starts with http:// or https://), use as-is
  if (finalUrl.startsWith("http://") || finalUrl.startsWith("https://")) {
    // Add cache-busting parameter if requested (for updated images)
    if (options.cacheBust) {
      const separator = finalUrl.includes("?") ? "&" : "?";
      finalUrl = `${finalUrl}${separator}t=${Date.now()}`;
    }
    return finalUrl;
  }

  // Handle relative URLs (both /static/... and static/... formats)
  const baseUrl = getApiBaseUrlWithoutPath();
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  
  // Normalize the path - ensure it starts with /static/
  let normalizedPath = finalUrl;
  
  // Handle various URL formats that might be in the database
  if (normalizedPath.startsWith("static/photos/") || normalizedPath.startsWith("static/")) {
    // URL like "static/photos/..." - add leading slash
    normalizedPath = `/${normalizedPath}`;
  } else if (!normalizedPath.startsWith("/")) {
    // URL without any slash - assume it's a static file
    normalizedPath = `/static/${normalizedPath}`;
  } else if (!normalizedPath.startsWith("/static/")) {
    // URL starts with "/" but not "/static/" - prepend "/static"
    normalizedPath = `/static${normalizedPath}`;
  }
  // If it already starts with "/static/", use as-is

  finalUrl = `${cleanBaseUrl}${normalizedPath}`;

  // Add cache-busting parameter if requested (for updated images)
  if (options.cacheBust) {
    const separator = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${separator}t=${Date.now()}`;
  }

  return finalUrl;
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

