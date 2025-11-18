import { apiRequest } from "./baseClient";

export const fetchEbooks = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.featured) searchParams.set("featured", "true");
  const query = searchParams.toString();
  return apiRequest(`/resources/ebooks${query ? `?${query}` : ""}`, {
    skipAuth: true,
  });
};

export const fetchEbookById = (ebookId) =>
  apiRequest(`/resources/ebooks/${ebookId}`, {
    skipAuth: true,
  });

/**
 * Update ebook reading progress
 * POST /api/v1/resources/ebooks/:ebookId/progress
 */
export const updateEbookProgress = (ebookId, payload) =>
  apiRequest(`/resources/ebooks/${ebookId}/progress`, {
    method: "POST",
    body: payload,
  });

/**
 * Get ebook reading progress
 * GET /api/v1/resources/ebooks/:ebookId/progress
 */
export const fetchEbookProgress = (ebookId) =>
  apiRequest(`/resources/ebooks/${ebookId}/progress`, {
    method: "GET",
  });

/**
 * Add bookmark to ebook
 * POST /api/v1/resources/ebooks/:ebookId/bookmarks
 */
export const addEbookBookmark = (ebookId, payload) =>
  apiRequest(`/resources/ebooks/${ebookId}/bookmarks`, {
    method: "POST",
    body: payload,
  });

/**
 * Rate an ebook
 * POST /api/v1/resources/ebooks/:ebookId/ratings
 */
export const rateEbook = (ebookId, payload) =>
  apiRequest(`/resources/ebooks/${ebookId}/ratings`, {
    method: "POST",
    body: payload,
  });

/**
 * Get ebook ratings and reviews
 * GET /api/v1/resources/ebooks/:ebookId/ratings
 */
export const fetchEbookRatings = (ebookId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.rating) searchParams.set("rating", params.rating);
  const query = searchParams.toString();
  return apiRequest(`/resources/ebooks/${ebookId}/ratings${query ? `?${query}` : ""}`, {
    skipAuth: true,
  });
};

/**
 * Get ebook analytics (for teachers/admins)
 * GET /api/v1/resources/ebooks/:ebookId/analytics
 */
export const fetchEbookAnalytics = (ebookId) =>
  apiRequest(`/resources/ebooks/${ebookId}/analytics`, {
    method: "GET",
  });

/**
 * Download ebook (track download)
 * GET /api/v1/resources/ebooks/:ebookId/download
 */
export const downloadEbook = (ebookId) =>
  apiRequest(`/resources/ebooks/${ebookId}/download`, {
    skipAuth: true,
  });

/**
 * Get featured book count
 * GET /api/v1/resources/ebooks/featured-count
 */
export const getFeaturedBookCount = async () => {
  return apiRequest("/resources/ebooks/featured-count", {
    method: "GET",
    skipAuth: true,
  });
};

