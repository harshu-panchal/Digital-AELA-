import { apiRequest } from "./baseClient";

/**
 * Get pending courses
 */
export const fetchPendingCourses = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/courses${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get pending ebooks
 */
export const fetchPendingEbooks = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/ebooks${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get pending jobs
 */
export const fetchPendingJobs = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/jobs${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get pending teachers
 */
export const fetchPendingTeachers = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/teachers${queryString ? `?${queryString}` : ""}`);
};

/**
 * Approve/Reject course
 */
export const approveCourse = (courseId, action) =>
  apiRequest(`/admin/courses/${courseId}/approve`, {
    method: "PATCH",
    body: { action },
  });

/**
 * Approve/Reject ebook
 */
export const approveEbook = (ebookId, action) =>
  apiRequest(`/admin/ebooks/${ebookId}/approve`, {
    method: "PATCH",
    body: { action },
  });

/**
 * Approve/Reject job
 */
export const approveJob = (jobId, action) =>
  apiRequest(`/admin/jobs/${jobId}/approve`, {
    method: "PATCH",
    body: { action },
  });

/**
 * Approve/Reject teacher
 */
export const approveTeacher = (userId, action) =>
  apiRequest(`/admin/teachers/${userId}/approve`, {
    method: "PATCH",
    body: { action },
  });

