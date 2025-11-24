import { apiRequest } from "./baseClient";

/**
 * Submit a rating for a user
 * POST /api/v1/users/:userId/ratings
 * @param {string} userId - ID of the user being rated
 * @param {number} rating - Rating value (1-5)
 * @param {string[]} tags - Array of tag strings
 * @param {string} comment - Optional comment (max 500 chars)
 */
export const submitUserRating = (userId, rating, tags = [], comment = "") => {
  return apiRequest(`/users/${userId}/ratings`, {
    method: "POST",
    body: {
      rating,
      tags,
      comment,
    },
  });
};

/**
 * Get all ratings for a user
 * GET /api/v1/users/:userId/ratings
 * @param {string} userId - ID of the user whose ratings to fetch
 */
export const getUserRatings = (userId) => {
  return apiRequest(`/users/${userId}/ratings`, {
    method: "GET",
  });
};

/**
 * Get rating statistics for a user
 * GET /api/v1/users/:userId/ratings/stats
 * @param {string} userId - ID of the user whose rating stats to fetch
 */
export const getUserRatingStats = (userId) => {
  return apiRequest(`/users/${userId}/ratings/stats`, {
    method: "GET",
  });
};

