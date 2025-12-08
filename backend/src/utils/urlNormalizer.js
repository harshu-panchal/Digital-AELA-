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

  // CRITICAL: Fix malformed URLs FIRST - before any other processing
  // Handle triple slash pattern (https:/// or http:///) - most malformed
  if (/^https?:\/\/\//i.test(normalizedUrl)) {
    // Extract the path part (everything after "https:///" or "http:///")
    const path = normalizedUrl.replace(/^https?:\/\/\//i, "");
    // Ensure path starts with /static/ prefix if it contains /static/
    if (path.includes("/static/")) {
      // Extract everything from /static/ onwards
      const staticIndex = path.indexOf("/static/");
      normalizedUrl = path.substring(staticIndex);
    } else if (path.startsWith("/")) {
      normalizedUrl = `/static${path}`;
    } else {
      normalizedUrl = `/static/${path}`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[normalizeUrl] Fixed triple-slash URL: "${url}" -> "${normalizedUrl}"`
      );
    }
  }
  
  // Check for malformed URLs like "https://static/..." or "http://static/..." (missing domain)
  // "static" is not a valid hostname - these URLs are malformed and need fixing
  // Match patterns:
  // - https://static/photos/...
  // - http://static/photos/...
  // - https://static/
  // - http://static/
  // - https://static (no trailing slash)
  // Use case-insensitive matching to catch all variations
  if (/^https?:\/\/static(\/|$)/i.test(normalizedUrl)) {
    // Extract the path part (everything after "https://static" or "http://static")
    const path = normalizedUrl.replace(/^https?:\/\/static\/?/i, "");
    // Ensure path starts with /static/ prefix
    if (path.startsWith("/static/")) {
      normalizedUrl = path;
    } else if (path.startsWith("/")) {
      normalizedUrl = `/static${path}`;
    } else if (path) {
      normalizedUrl = `/static/${path}`;
    } else {
      // Empty path after "https://static" - default to /static/
      normalizedUrl = "/static/";
    }
    
    // Log the fix for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[normalizeUrl] Fixed malformed URL: "${url}" -> "${normalizedUrl}"`
      );
    }
  }

  // If it's already a valid full URL (with proper domain), return as-is
  // IMPORTANT: Check this AFTER fixing malformed URLs
  // This regex checks for http:// or https:// followed by a valid domain (not just "static")
  // Must have at least one character that's not a slash after the protocol
  if (/^https?:\/\/[^\/\s]+\//.test(normalizedUrl) || /^https?:\/\/[^\/\s]+$/.test(normalizedUrl)) {
    // Additional check: ensure it's not still a malformed static URL
    // (shouldn't happen after fix above, but double-check)
    if (!/^https?:\/\/static(\/|$)/i.test(normalizedUrl)) {
      // Valid full URL with domain - return as-is
      return normalizedUrl;
    }
    // If it's still malformed, continue with normalization below
  }

  // Handle data URLs - return as-is
  if (normalizedUrl.startsWith("data:")) {
    return normalizedUrl;
  }

  // For relative URLs, ensure proper formatting
  // If it doesn't start with /, add it (unless it's a data URL)
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

/**
 * Normalize URLs in course objects
 * 
 * @param {Array} courses - Array of course objects
 * @returns {Array} - Array of courses with normalized URLs
 */
export const normalizeCoursesUrls = async (courses) => {
  if (!Array.isArray(courses)) {
    return [];
  }
  
  return courses.map(course => {
    if (course.thumbnailUrl) {
      course.thumbnailUrl = normalizeUrl(course.thumbnailUrl) || course.thumbnailUrl;
    }
    if (course.brochureUrl) {
      course.brochureUrl = normalizeUrl(course.brochureUrl) || course.brochureUrl;
    }
    if (course.metadata?.introVideoUrl) {
      course.metadata.introVideoUrl = normalizeUrl(course.metadata.introVideoUrl) || course.metadata.introVideoUrl;
    }
    return course;
  });
};

