import { apiRequest } from "./baseClient";

/**
 * Get Earnings Summary
 * GET /api/v1/earnings/summary
 */
export const getEarningsSummary = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.month) searchParams.set("month", params.month);
  if (params.year) searchParams.set("year", params.year);
  if (params.courseId) searchParams.set("courseId", params.courseId);

  const query = searchParams.toString();
  return apiRequest(`/earnings/summary${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Monthly Earnings
 * GET /api/v1/earnings/monthly
 */
export const getMonthlyEarnings = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.year) searchParams.set("year", params.year);

  const query = searchParams.toString();
  return apiRequest(`/earnings/monthly${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Course Earnings
 * GET /api/v1/earnings/courses
 */
export const getCourseEarnings = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const query = searchParams.toString();
  return apiRequest(`/earnings/courses${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Create Payout Request
 * POST /api/v1/earnings/payout-requests
 */
export const createPayoutRequest = async (payload) => {
  return apiRequest("/earnings/payout-requests", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get Payout Requests
 * GET /api/v1/earnings/payout-requests
 */
export const getPayoutRequests = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/earnings/payout-requests${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Update Payout Request (Admin)
 * PUT /api/v1/earnings/payout-requests/:requestId
 */
export const updatePayoutRequest = async (requestId, payload) => {
  return apiRequest(`/earnings/payout-requests/${requestId}`, {
    method: "PUT",
    body: payload,
  });
};

/**
 * Generate Payment Slip (Admin)
 * POST /api/v1/earnings/payment-slips
 */
export const generatePaymentSlip = async (payload) => {
  return apiRequest("/earnings/payment-slips", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get Payment Slips
 * GET /api/v1/earnings/payment-slips
 */
export const getPaymentSlips = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/earnings/payment-slips${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Referral Earnings
 * GET /api/v1/earnings/referrals
 */
export const getReferralEarnings = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const query = searchParams.toString();
  return apiRequest(`/earnings/referrals${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

