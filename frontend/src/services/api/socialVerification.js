import { apiRequest } from "./baseClient";

/**
 * Add or update a social link (without verification)
 */
export const addSocialLink = (payload) =>
  apiRequest("/students/social/links", {
    method: "POST",
    body: payload,
  });

/**
 * Delete a social link
 */
export const deleteSocialLink = (platform) =>
  apiRequest(`/students/social/links/${platform}`, {
    method: "DELETE",
  });

/**
 * Verify a social link and claim bonus coins
 */
export const verifySocialLink = (payload) =>
  apiRequest("/students/social/verify", {
    method: "POST",
    body: payload,
  });

/**
 * Get social links for a user
 */
export const fetchSocialLinks = (userId = null) => {
  if (userId) {
    return apiRequest(`/students/${userId}/social/links`, {
      skipAuth: true, // Public endpoint
    });
  }
  return apiRequest("/students/social/links");
};

