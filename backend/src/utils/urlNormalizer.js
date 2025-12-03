/**
 * URL Normalization Utility
 * 
 * Normalizes URLs to ensure they are stored correctly in the database.
 * Fixes malformed URLs like "https://static/..." to proper relative paths.
 */

/**
 * Normalize a URL to a relative path if it's a malformed static URL
 * 
 * @param {string|null|undefined} url - The URL to normalize
 * @returns {string|null} - The normalized URL or null if input was null/undefined/empty
 * 
 * @example
 * normalizeUrl("https://static/photos/courses/image.jpg")
 * // Returns: "/static/photos/courses/image.jpg"
 * 
 * normalizeUrl("/static/photos/courses/image.jpg")
 * // Returns: "/static/photos/courses/image.jpg" (unchanged)
 * 
 * normalizeUrl("https://example.com/image.jpg")
 * // Returns: "https://example.com/image.jpg" (unchanged)
 */
export const normalizeUrl = (url) => {
  // Handle null, undefined, or empty strings
  if (!url || typeof url !== "string" || url.trim() === "") {
    return null;
  }

  let normalizedUrl = url.trim();

  // Check for malformed URLs like "https://static/..." or "http://static/..." (missing domain)
  // Match: https://static, https://static/, https://static/photos, etc.
  if (/^https?:\/\/static(\/|$)/.test(normalizedUrl)) {
    // Extract the path part (everything after "https://static" or "http://static")
    // This handles both "https://static/photos/..." and "https://static" cases
    const path = normalizedUrl.replace(/^https?:\/\/static\/?/, "");
    // Ensure path starts with / if it doesn't already
    normalizedUrl = path.startsWith("/") ? path : `/${path}`;
  }

  // If it's already a valid full URL (with proper domain), return as-is
  // This regex checks for http:// or https:// followed by a valid domain (not just "static")
  if (/^https?:\/\/[^\/]+\//.test(normalizedUrl) || /^https?:\/\/[^\/]+$/.test(normalizedUrl)) {
    // Valid full URL with domain - return as-is
    return normalizedUrl;
  }

  // For relative URLs, ensure they start with / if they don't already
  if (normalizedUrl && !normalizedUrl.startsWith("/") && !normalizedUrl.startsWith("data:")) {
    normalizedUrl = `/${normalizedUrl}`;
  }

  return normalizedUrl;
};

/**
 * Normalize multiple URLs at once
 * 
 * @param {Array<string|null|undefined>} urls - Array of URLs to normalize
 * @returns {Array<string|null>} - Array of normalized URLs
 */
export const normalizeUrls = (urls) => {
  if (!Array.isArray(urls)) {
    return [];
  }
  return urls.map(url => normalizeUrl(url));
};

