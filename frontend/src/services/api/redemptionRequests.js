import { apiRequest } from "./baseClient";

/**
 * Create redemption request
 */
export const createRedemptionRequest = (rewardId) =>
  apiRequest("/redemption-requests", {
    method: "POST",
    body: { rewardId },
  });

/**
 * Get user's redemption requests
 */
export const getMyRedemptionRequests = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/redemption-requests/my-requests${query ? `?${query}` : ""}`);
};

/**
 * Get single redemption request
 */
export const getRedemptionRequest = (requestId) =>
  apiRequest(`/redemption-requests/${requestId}`);

/**
 * Get all redemption requests (admin only)
 */
export const getAllRedemptionRequests = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.category) searchParams.set("category", params.category);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/redemption-requests${query ? `?${query}` : ""}`);
};

/**
 * Approve redemption request (admin only)
 */
export const approveRedemptionRequest = (requestId, adminNotes = "") =>
  apiRequest(`/redemption-requests/${requestId}/approve`, {
    method: "PATCH",
    body: { adminNotes },
  });

/**
 * Reject redemption request (admin only)
 */
export const rejectRedemptionRequest = (requestId, rejectionReason = "", adminNotes = "") =>
  apiRequest(`/redemption-requests/${requestId}/reject`, {
    method: "PATCH",
    body: { rejectionReason, adminNotes },
  });

