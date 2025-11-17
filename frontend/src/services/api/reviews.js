import { apiRequest } from "./baseClient";

/**
 * Submit a review for a course
 * POST /api/v1/courses/:courseId/reviews
 */
export const submitReview = async (courseId, reviewData) => {
  return apiRequest(`/courses/${courseId}/reviews`, {
    method: "POST",
    body: reviewData,
  });
};

/**
 * Get reviews for a course
 * GET /api/v1/courses/:courseId/reviews
 */
export const getCourseReviews = async (courseId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.rating) searchParams.set("rating", params.rating);
  if (params.status) searchParams.set("status", params.status);
  
  const query = searchParams.toString();
  return apiRequest(`/courses/${courseId}/reviews${query ? `?${query}` : ""}`, {
    skipAuth: true,
  });
};

/**
 * Get user's review for a course
 * GET /api/v1/courses/:courseId/reviews/my-review
 */
export const getMyReview = async (courseId) => {
  return apiRequest(`/courses/${courseId}/reviews/my-review`, {
    method: "GET",
  });
};

/**
 * Update a review
 * PATCH /api/v1/reviews/:reviewId
 */
export const updateReview = async (reviewId, reviewData) => {
  return apiRequest(`/reviews/${reviewId}`, {
    method: "PATCH",
    body: reviewData,
  });
};

/**
 * Delete a review
 * DELETE /api/v1/reviews/:reviewId
 */
export const deleteReview = async (reviewId) => {
  return apiRequest(`/reviews/${reviewId}`, {
    method: "DELETE",
  });
};

/**
 * Mark review as helpful
 * POST /api/v1/reviews/:reviewId/helpful
 */
export const markReviewHelpful = async (reviewId) => {
  return apiRequest(`/reviews/${reviewId}/helpful`, {
    method: "POST",
  });
};

/**
 * Get a single review
 * GET /api/v1/reviews/:reviewId
 */
export const getReview = async (reviewId) => {
  return apiRequest(`/reviews/${reviewId}`, {
    skipAuth: true,
  });
};

/**
 * Get pending reviews (Admin only)
 * GET /api/v1/admin/reviews/pending
 */
export const getPendingReviews = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  
  const query = searchParams.toString();
  return apiRequest(`/admin/reviews/pending${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Moderate review (Admin only)
 * PATCH /api/v1/admin/reviews/:reviewId/moderate
 */
export const moderateReview = async (reviewId, action) => {
  return apiRequest(`/admin/reviews/${reviewId}/moderate`, {
    method: "PATCH",
    body: { action }, // "approve" or "reject"
  });
};

