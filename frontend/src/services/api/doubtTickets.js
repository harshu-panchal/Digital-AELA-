import { apiRequest } from "./baseClient";

/**
 * Create Doubt Ticket
 * POST /api/v1/doubt-tickets
 */
export const createDoubtTicket = async (payload) => {
  return apiRequest("/doubt-tickets", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get All Doubt Tickets
 * GET /api/v1/doubt-tickets
 */
export const getAllDoubtTickets = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);
  if (params.priority) searchParams.set("priority", params.priority);
  if (params.category) searchParams.set("category", params.category);
  if (params.course) searchParams.set("course", params.course);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return apiRequest(`/doubt-tickets${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Doubt Ticket Details
 * GET /api/v1/doubt-tickets/:ticketId
 */
export const getDoubtTicketDetails = async (ticketId) => {
  return apiRequest(`/doubt-tickets/${ticketId}`, {
    method: "GET",
  });
};

/**
 * Reply to Doubt Ticket
 * POST /api/v1/doubt-tickets/:ticketId/reply
 */
export const replyToDoubtTicket = async (ticketId, payload) => {
  return apiRequest(`/doubt-tickets/${ticketId}/reply`, {
    method: "POST",
    body: payload,
  });
};

/**
 * Update Doubt Ticket Status
 * PUT /api/v1/doubt-tickets/:ticketId/status
 */
export const updateDoubtTicketStatus = async (ticketId, status) => {
  return apiRequest(`/doubt-tickets/${ticketId}/status`, {
    method: "PUT",
    body: { status },
  });
};

/**
 * Assign Doubt Ticket to Teacher
 * PUT /api/v1/doubt-tickets/:ticketId/assign
 */
export const assignDoubtTicket = async (ticketId, teacherId) => {
  return apiRequest(`/doubt-tickets/${ticketId}/assign`, {
    method: "PUT",
    body: { teacherId },
  });
};

/**
 * Get Doubt Ticket Stats
 * GET /api/v1/doubt-tickets/stats
 */
export const getDoubtTicketStats = async () => {
  return apiRequest("/doubt-tickets/stats", {
    method: "GET",
  });
};

