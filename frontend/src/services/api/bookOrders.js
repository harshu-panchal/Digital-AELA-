import { apiRequest } from "./baseClient";

/**
 * Create a guest book order (no authentication required)
 * POST /api/v1/book-orders
 */
export const createGuestBookOrder = async (payload) => {
  return apiRequest("/book-orders", {
    method: "POST",
    body: payload,
  });
};

/**
 * Create a registered user book order (authentication required)
 * POST /api/v1/book-orders/registered
 */
export const createRegisteredBookOrder = async (payload) => {
  return apiRequest("/book-orders/registered", {
    method: "POST",
    body: payload,
  });
};

/**
 * Verify payment after Razorpay callback
 * POST /api/v1/book-orders/verify-payment
 */
export const verifyBookOrderPayment = async (payload) => {
  return apiRequest("/book-orders/verify-payment", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get the authenticated user's book orders
 * GET /api/v1/book-orders/my-orders
 */
export const getMyBookOrders = async (params = {}) => {
  const searchParams = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const query = searchParams.toString();
  return apiRequest(`/book-orders/my-orders${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get a specific user book order by ID
 * GET /api/v1/book-orders/my-orders/:orderId
 */
export const getMyBookOrderById = async (orderId) => {
  return apiRequest(`/book-orders/my-orders/${orderId}`, {
    method: "GET",
  });
};

/**
 * Admin: Get all book orders with optional filters
 * GET /api/v1/book-orders/admin
 */
export const getAdminBookOrders = async (params = {}) => {
  const searchParams = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const query = searchParams.toString();
  return apiRequest(`/book-orders/admin${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Admin: Get aggregate stats for the dashboard widget
 * GET /api/v1/book-orders/admin/stats
 */
export const getAdminBookOrderStats = async () => {
  return apiRequest("/book-orders/admin/stats", {
    method: "GET",
  });
};

/**
 * Admin: Get a specific book order by ID
 * GET /api/v1/book-orders/admin/:orderId
 */
export const getAdminBookOrderById = async (orderId) => {
  return apiRequest(`/book-orders/admin/${orderId}`, {
    method: "GET",
  });
};

/**
 * Admin: Update order status and fulfillment details
 * PUT /api/v1/book-orders/admin/:orderId/status
 */
export const updateBookOrderStatus = async (orderId, payload) => {
  return apiRequest(`/book-orders/admin/${orderId}/status`, {
    method: "PUT",
    body: payload,
  });
};
