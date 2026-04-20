import { apiRequest } from "./baseClient";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("pageSize", params.pageSize);
  if (params.status) query.append("status", params.status);
  if (params.approvalStatus) query.append("approvalStatus", params.approvalStatus);
  if (params.isPublic !== undefined) query.append("isPublic", params.isPublic);
  if (params.role) query.append("role", params.role);
  if (params.search) query.append("search", params.search);
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const fetchBranchDashboard = () => apiRequest("/branch-owner/dashboard");

export const fetchBranchProfile = () => apiRequest("/branch-owner/profile");

export const updateBranchProfile = (payload) =>
  apiRequest("/branch-owner/profile", {
    method: "PATCH",
    body: payload,
  });

export const fetchBranchTeachers = (params = {}) =>
  apiRequest(`/branch-owner/teachers${buildQuery(params)}`);

export const fetchBranchStudents = (params = {}) =>
  apiRequest(`/branch-owner/students${buildQuery(params)}`);

export const fetchPendingBranchUsers = (params = {}) =>
  apiRequest(`/branch-owner/users/pending${buildQuery(params)}`);

export const fetchBranchUserDetails = (userId) =>
  apiRequest(`/branch-owner/users/${userId}`);

export const approveBranchUser = (userId) =>
  apiRequest(`/branch-owner/users/${userId}/approve`, {
    method: "PATCH",
    body: {},
  });

export const rejectBranchUser = (userId, rejectionReason) =>
  apiRequest(`/branch-owner/users/${userId}/reject`, {
    method: "PATCH",
    body: { rejectionReason },
  });

export const removeBranchUser = (userId, reason) =>
  apiRequest(`/branch-owner/users/${userId}/remove`, {
    method: "PATCH",
    body: { reason },
  });

export const fetchBranchCourses = (params = {}) =>
  apiRequest(`/branch-owner/courses${buildQuery(params)}`);

export const approveBranchCourse = (courseId) =>
  apiRequest(`/branch-owner/courses/${courseId}/approve`, {
    method: "PATCH",
    body: {},
  });

export const rejectBranchCourse = (courseId, rejectionReason) =>
  apiRequest(`/branch-owner/courses/${courseId}/reject`, {
    method: "PATCH",
    body: { rejectionReason },
  });

export const fetchBranchBooks = (params = {}) =>
  apiRequest(`/branch-owner/books${buildQuery(params)}`);

export const approveBranchBook = (bookId) =>
  apiRequest(`/branch-owner/books/${bookId}/approve`, {
    method: "PATCH",
    body: {},
  });

export const rejectBranchBook = (bookId, rejectionReason) =>
  apiRequest(`/branch-owner/books/${bookId}/reject`, {
    method: "PATCH",
    body: { rejectionReason },
  });

export const fetchBranchAnnouncements = (params = {}) =>
  apiRequest(`/branch-owner/announcements${buildQuery(params)}`);

export const createBranchAnnouncement = (payload) =>
  apiRequest("/branch-owner/announcements", {
    method: "POST",
    body: payload,
  });

export const updateBranchAnnouncement = (announcementId, payload) =>
  apiRequest(`/branch-owner/announcements/${announcementId}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteBranchAnnouncement = (announcementId) =>
  apiRequest(`/branch-owner/announcements/${announcementId}`, {
    method: "DELETE",
  });

export const fetchBranchAnalytics = () => apiRequest("/branch-owner/analytics");

export const fetchBranchSettings = () => apiRequest("/branch-owner/settings");

export const updateBranchSettings = (payload) =>
  apiRequest("/branch-owner/settings", {
    method: "PATCH",
    body: payload,
  });
