import { apiRequest } from "./baseClient";

/**
 * Get teacher dashboard data
 */
export const fetchTeacherDashboard = async () => {
  return apiRequest("/teacher/dashboard", {
    method: "GET",
  });
};

/**
 * Get teacher analytics
 * GET /api/v1/teacher/analytics
 * @param {Object} params - { period }
 */
export const fetchTeacherAnalytics = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set("period", params.period);

  const query = searchParams.toString();
  return apiRequest(`/teacher/analytics${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get course analytics
 * GET /api/v1/teacher/courses/:courseId/analytics
 * @param {string} courseId
 * @param {Object} params - { period }
 */
export const fetchCourseAnalytics = async (courseId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set("period", params.period);

  const query = searchParams.toString();
  return apiRequest(`/teacher/courses/${courseId}/analytics${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get all students enrolled in teacher's courses
 * GET /api/v1/teacher/students
 * @param {Object} params - { page, pageSize, courseId, search }
 */
export const fetchTeacherStudents = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.courseId) searchParams.set("courseId", params.courseId);
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  return apiRequest(`/teacher/students${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get students for a specific course
 * GET /api/v1/teacher/courses/:courseId/students
 * @param {string} courseId
 * @param {Object} params - { page, pageSize, status, search }
 */
export const fetchCourseStudents = async (courseId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  return apiRequest(`/teacher/courses/${courseId}/students${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get student details and performance
 * GET /api/v1/teacher/students/:studentId
 * @param {string} studentId
 */
export const fetchStudentDetails = async (studentId) => {
  return apiRequest(`/teacher/students/${studentId}`, {
    method: "GET",
  });
};

