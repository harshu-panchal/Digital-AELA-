import { apiRequest } from "./baseClient";

/**
 * Create Payment
 * POST /api/v1/payments
 */
export const createPayment = async (payload) => {
  return apiRequest("/payments", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get Payment History
 * GET /api/v1/payments/history
 */
export const getPaymentHistory = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);
  if (params.courseId) searchParams.set("courseId", params.courseId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const query = searchParams.toString();
  return apiRequest(`/payments/history${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Payment Details
 * GET /api/v1/payments/:paymentId
 */
export const getPaymentDetails = async (paymentId) => {
  return apiRequest(`/payments/${paymentId}`, {
    method: "GET",
  });
};

/**
 * Update Payment
 * PUT /api/v1/payments/:paymentId
 */
export const updatePayment = async (paymentId, payload) => {
  return apiRequest(`/payments/${paymentId}`, {
    method: "PUT",
    body: payload,
  });
};

/**
 * Process Refund (Admin Only)
 * POST /api/v1/payments/:paymentId/refund
 */
export const processRefund = async (paymentId, payload) => {
  return apiRequest(`/payments/${paymentId}/refund`, {
    method: "POST",
    body: payload,
  });
};

/**
 * Get Invoice
 * GET /api/v1/payments/:paymentId/invoice
 */
export const getInvoice = async (paymentId) => {
  return apiRequest(`/payments/${paymentId}/invoice`, {
    method: "GET",
  });
};

/**
 * Get Pending Payments
 * GET /api/v1/payments/pending
 */
export const getPendingPayments = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/payments/pending${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Teacher Earnings
 * GET /api/v1/payments/earnings
 */
export const getTeacherEarnings = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.courseId) searchParams.set("courseId", params.courseId);

  const query = searchParams.toString();
  return apiRequest(`/payments/earnings${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Create Razorpay Order
 * POST /api/v1/payments/:paymentId/razorpay/order
 */
export const createRazorpayOrder = async (paymentId) => {
  return apiRequest(`/payments/${paymentId}/razorpay/order`, {
    method: "POST",
  });
};

/**
 * Verify Razorpay Payment
 * POST /api/v1/payments/razorpay/verify
 */
export const verifyRazorpayPayment = async (payload) => {
  return apiRequest("/payments/razorpay/verify", {
    method: "POST",
    body: payload,
  });
};

/**
 * Create Razorpay Payment Link (Redirect-based)
 * POST /api/v1/payments/:paymentId/razorpay/payment-link
 */
export const createRazorpayPaymentLink = async (paymentId, callbackUrl) => {
  return apiRequest(`/payments/${paymentId}/razorpay/payment-link`, {
    method: "POST",
    body: callbackUrl ? { callbackUrl } : {},
  });
};

