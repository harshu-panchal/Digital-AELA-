import { apiRequest } from "./baseClient";

/**
 * Create Announcement
 * POST /api/v1/announcements
 */
export const createAnnouncement = async (payload) => {
  return apiRequest("/announcements", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get All Announcements
 * GET /api/v1/announcements
 */
export const getAllAnnouncements = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);
  if (params.targetAudience) searchParams.set("targetAudience", params.targetAudience);
  if (params.priority) searchParams.set("priority", params.priority);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return apiRequest(`/announcements${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Announcement Details
 * GET /api/v1/announcements/:announcementId
 */
export const getAnnouncementDetails = async (announcementId) => {
  return apiRequest(`/announcements/${announcementId}`, {
    method: "GET",
  });
};

/**
 * Update Announcement
 * PUT /api/v1/announcements/:announcementId
 */
export const updateAnnouncement = async (announcementId, payload) => {
  return apiRequest(`/announcements/${announcementId}`, {
    method: "PUT",
    body: payload,
  });
};

/**
 * Delete Announcement
 * DELETE /api/v1/announcements/:announcementId
 */
export const deleteAnnouncement = async (announcementId) => {
  return apiRequest(`/announcements/${announcementId}`, {
    method: "DELETE",
  });
};

/**
 * Publish Announcement
 * POST /api/v1/announcements/:announcementId/publish
 */
export const publishAnnouncement = async (announcementId) => {
  return apiRequest(`/announcements/${announcementId}/publish`, {
    method: "POST",
  });
};

/**
 * Mark Announcement as Read
 * POST /api/v1/announcements/:announcementId/read
 */
export const markAnnouncementAsRead = async (announcementId) => {
  return apiRequest(`/announcements/${announcementId}/read`, {
    method: "POST",
  });
};

/**
 * Get Announcement Stats
 * GET /api/v1/announcements/stats
 */
export const getAnnouncementStats = async () => {
  return apiRequest("/announcements/stats", {
    method: "GET",
  });
};

/**
 * Get Student Announcements
 * GET /api/v1/announcements/student
 */
export const getStudentAnnouncements = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/announcements/student${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

