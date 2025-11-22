import { apiRequest } from "./baseClient";

/**
 * Create Lead
 * POST /api/v1/crm/leads
 */
export const createLead = async (payload) => {
  return apiRequest("/crm/leads", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get All Leads
 * GET /api/v1/crm/leads
 */
export const getAllLeads = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);
  if (params.priority) searchParams.set("priority", params.priority);
  if (params.source) searchParams.set("source", params.source);
  if (params.assignedTo) searchParams.set("assignedTo", params.assignedTo);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return apiRequest(`/crm/leads${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Lead Details
 * GET /api/v1/crm/leads/:leadId
 */
export const getLeadDetails = async (leadId) => {
  return apiRequest(`/crm/leads/${leadId}`, {
    method: "GET",
  });
};

/**
 * Update Lead
 * PUT /api/v1/crm/leads/:leadId
 */
export const updateLead = async (leadId, payload) => {
  return apiRequest(`/crm/leads/${leadId}`, {
    method: "PUT",
    body: payload,
  });
};

/**
 * Delete Lead
 * DELETE /api/v1/crm/leads/:leadId
 */
export const deleteLead = async (leadId) => {
  return apiRequest(`/crm/leads/${leadId}`, {
    method: "DELETE",
  });
};

/**
 * Assign Lead to Team Member
 * POST /api/v1/crm/leads/:leadId/assign
 */
export const assignLead = async (leadId, payload) => {
  return apiRequest(`/crm/leads/${leadId}/assign`, {
    method: "POST",
    body: payload,
  });
};

/**
 * Create Follow-Up
 * POST /api/v1/crm/follow-ups
 */
export const createFollowUp = async (payload) => {
  return apiRequest("/crm/follow-ups", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get Follow-Ups
 * GET /api/v1/crm/follow-ups
 */
export const getFollowUps = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.leadId) searchParams.set("leadId", params.leadId);
  if (params.status) searchParams.set("status", params.status);
  if (params.assignedTo) searchParams.set("assignedTo", params.assignedTo);
  if (params.type) searchParams.set("type", params.type);
  if (params.overdue) searchParams.set("overdue", params.overdue);

  const query = searchParams.toString();
  return apiRequest(`/crm/follow-ups${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Update Follow-Up
 * PUT /api/v1/crm/follow-ups/:followUpId
 */
export const updateFollowUp = async (followUpId, payload) => {
  return apiRequest(`/crm/follow-ups/${followUpId}`, {
    method: "PUT",
    body: payload,
  });
};

/**
 * Delete Follow-Up
 * DELETE /api/v1/crm/follow-ups/:followUpId
 */
export const deleteFollowUp = async (followUpId) => {
  return apiRequest(`/crm/follow-ups/${followUpId}`, {
    method: "DELETE",
  });
};

/**
 * Create Public Lead (from Free Library form)
 * POST /api/v1/crm/leads/public
 */
export const createPublicLead = async (payload) => {
  return apiRequest("/crm/leads/public", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
};

/**
 * Get Team Members
 * GET /api/v1/crm/team-members
 */
export const getTeamMembers = async () => {
  return apiRequest("/crm/team-members", {
    method: "GET",
  });
};

