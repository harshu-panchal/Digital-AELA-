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

  // Normalize Windows-style paths (backslashes) to forward slashes
  // This handles paths like "data\photos\courses\..." from Windows file system
  finalUrl = finalUrl.replace(/\\/g, "/");

  // Handle paths that start with "data/" (Windows file system paths)
  // Convert "data/photos/..." to "/static/photos/..."
  if (finalUrl.startsWith("data/")) {
    finalUrl = finalUrl.replace(/^data\//, "/static/");
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[getMediaUrl] Converted data/ path to /static/ path: "${url}" -> "${finalUrl}"`
      );
    }
  }

  // CRITICAL: Fix malformed URLs FIRST - before any other processing
  // Check for malformed URLs like "https://static/..." or "http://static/..." (missing domain)
  // These occur when URLs are incorrectly constructed. "static" is not a valid hostname.
  // Match patterns:
  // - https://static/photos/...
  // - http://static/photos/...
  // - https://static/
  // - http://static/
  // - https://static (no trailing slash)
  if (/^https?:\/\/static(\/|$)/i.test(finalUrl)) {
    // Extract the path part (everything after "https://static" or "http://static")
    // This handles both "https://static/photos/..." and "https://static" cases
    const path = finalUrl.replace(/^https?:\/\/static\/?/i, "");
    // Ensure path starts with /static/ prefix
    finalUrl = path.startsWith("/static/") 
      ? path 
      : path.startsWith("/") 
        ? `/static${path}` 
        : `/static/${path}`;
    
    // Log the fix for debugging
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[getMediaUrl] Fixed malformed URL: "${url}" -> "${finalUrl}"`
      );
    }
  }
  
  // Also check for URLs that start with "static/" (no leading slash, no protocol)
  // These might be getting incorrectly converted to "https://static/..." somewhere
  // We should normalize them to "/static/..." before processing
  if (finalUrl.startsWith("static/") && !finalUrl.startsWith("/") && !finalUrl.startsWith("http")) {
    finalUrl = `/${finalUrl}`;
  }

  // CRITICAL: Fix URLs with triple slashes (https:/// or http:///)
  // These are malformed URLs that browsers normalize incorrectly
  // Pattern: https:///static/photos/... or http:///static/photos/...
  if (/^https?:\/\/\//i.test(finalUrl)) {
    // Extract the path part (everything after "https:///" or "http:///")
    const path = finalUrl.replace(/^https?:\/\/\//i, "");
    // Ensure path starts with /static/ prefix
    finalUrl = path.startsWith("/static/") 
      ? path 
      : path.startsWith("/") 
        ? `/static${path}` 
        : `/static/${path}`;
    
    // Log the fix for debugging
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[getMediaUrl] Fixed triple-slash malformed URL: "${url}" -> "${finalUrl}"`
      );
    }
  }

  // If it's already a full URL (starts with http:// or https://), use as-is
  // BUT: Skip this check if we just fixed a malformed URL (which would now start with /)
  if (finalUrl.startsWith("http://") || finalUrl.startsWith("https://")) {
    // Double-check: Don't return if it's still malformed (shouldn't happen after fix above)
    if (/^https?:\/\/static(\/|$)/i.test(finalUrl)) {
      // This shouldn't happen, but log an error if it does
      console.error(
        `[getMediaUrl] ❌ Still malformed after fix attempt: "${url}"`
      );
      // Force fix it again
      const path = finalUrl.replace(/^https?:\/\/static\/?/i, "");
      finalUrl = path.startsWith("/static/") 
        ? path 
        : path.startsWith("/") 
          ? `/static${path}` 
          : `/static/${path}`;
    } else {
      // Valid full URL - return as-is
      // Add cache-busting parameter if requested (for updated images)
      if (options.cacheBust) {
        const separator = finalUrl.includes("?") ? "&" : "?";
        finalUrl = `${finalUrl}${separator}t=${Date.now()}`;
      }
      return finalUrl;
    }
  }

  // Normalize the path FIRST - ensure it starts with /static/
  // This must happen before checking the base URL to handle all path formats correctly
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

  // Handle relative URLs (both /static/... and static/... formats)
  let baseUrl = getApiBaseUrlWithoutPath();
  
  // Extract backend domain from VITE_API_URL if baseUrl is invalid
  // This handles cases where VITE_API_URL might be malformed
  const extractBackendDomain = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      try {
        // Try to parse the URL to extract the origin
        const url = new URL(envUrl);
        return `${url.protocol}//${url.host}`;
      } catch (e) {
        // If URL parsing fails, try to extract domain manually
        const match = envUrl.match(/^(https?:\/\/[^\/]+)/i);
        if (match) {
          return match[1];
        }
      }
    }
    return null;
  };
  
  // Validate and fix base URL if it's empty or invalid
  // Check for cases where baseUrl might be just "https://" or "http://" (protocol only)
  if (!baseUrl || baseUrl.trim() === "" || baseUrl === "https://" || baseUrl === "http://" || /^https?:\/\/$/.test(baseUrl)) {
    // Try to extract backend domain from VITE_API_URL
    const extractedDomain = extractBackendDomain();
    if (extractedDomain && extractedDomain !== "https://" && extractedDomain !== "http://") {
      baseUrl = extractedDomain;
      console.warn(
        "[getMediaUrl] ⚠️ Base URL was invalid, extracted backend domain from VITE_API_URL. " +
        `Using: "${baseUrl}" for path: "${normalizedPath}"`
      );
    } else if (typeof window !== "undefined" && window.location) {
      // Last resort: use window.location.origin (only works if frontend and backend are on same domain)
      baseUrl = window.location.origin;
      console.warn(
        "[getMediaUrl] ⚠️ Base URL is invalid, using window.location.origin as fallback. " +
        "Please set VITE_API_URL environment variable correctly. " +
        `Using: "${baseUrl}" for path: "${normalizedPath}"`
      );
    } else {
      // Fallback for SSR or when window is not available
      console.error(
        "[getMediaUrl] ❌ Base URL is empty or invalid. " +
        "Please set VITE_API_URL environment variable correctly. " +
        `Current baseUrl: "${baseUrl}", path: "${normalizedPath}"`
      );
      // Return the path as-is (relative URL) - browser will resolve it relative to current origin
      baseUrl = "";
    }
  }
  
  // Additional validation: ensure baseUrl is a valid URL with a domain
  // If baseUrl looks like just a protocol (https:// or http://), it's invalid
  if (baseUrl && /^https?:\/\/$/.test(baseUrl)) {
    // Try to extract backend domain again
    const extractedDomain = extractBackendDomain();
    if (extractedDomain && extractedDomain !== "https://" && extractedDomain !== "http://") {
      baseUrl = extractedDomain;
    } else {
      console.error(
        "[getMediaUrl] ❌ Base URL is just a protocol without domain. " +
        `baseUrl: "${baseUrl}", path: "${normalizedPath}"`
      );
      if (typeof window !== "undefined" && window.location) {
        baseUrl = window.location.origin;
      } else {
        baseUrl = "";
      }
    }
  }
  
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");

  // Final safety check: if cleanBaseUrl is just a protocol (https:// or http://), don't use it
  // This prevents URLs like "https:///static/photos/..." which browsers normalize to "https://static/photos/..."
  if (cleanBaseUrl && /^https?:\/\/$/.test(cleanBaseUrl)) {
    console.error(
      "[getMediaUrl] ❌ Base URL is just a protocol. Returning relative path instead. " +
      `baseUrl: "${cleanBaseUrl}", path: "${normalizedPath}"`
    );
    // Return relative path - browser will resolve it relative to current origin
    finalUrl = normalizedPath;
  } else {
    // Construct final URL - if baseUrl is empty, return relative path (browser will resolve it)
    // Ensure we don't create malformed URLs like "https:///static/..." which becomes "https://static/..."
    if (cleanBaseUrl && cleanBaseUrl.endsWith("://")) {
      console.error(
        "[getMediaUrl] ❌ Base URL ends with :// (malformed). Returning relative path instead. " +
        `baseUrl: "${cleanBaseUrl}", path: "${normalizedPath}"`
      );
      finalUrl = normalizedPath;
    } else {
      finalUrl = cleanBaseUrl ? `${cleanBaseUrl}${normalizedPath}` : normalizedPath;
    }
  }

  // Final validation: ensure we never return a malformed URL like "https://static/..." or "https:///static/..."
  // This is a last safety check to catch any edge cases
  if (/^https?:\/\/static(\/|$)/i.test(finalUrl) || /^https?:\/\/\//i.test(finalUrl)) {
    console.error(
      `[getMediaUrl] ❌ CRITICAL: About to return malformed URL: "${finalUrl}". ` +
      `Original URL: "${url}". Fixing to relative path.`
    );
    // Extract path and return as relative URL
    // Handle both "https://static/..." and "https:///static/..." patterns
    const path = finalUrl.replace(/^https?:\/\/\/?static\/?/i, "").replace(/^https?:\/\/\//i, "");
    finalUrl = path.startsWith("/static/") 
      ? path 
      : path.startsWith("/") 
        ? `/static${path}` 
        : `/static/${path}`;
  }

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

