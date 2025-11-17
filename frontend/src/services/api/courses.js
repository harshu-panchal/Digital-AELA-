import { apiRequest } from "./baseClient";

/**
 * Fetch all published courses (public endpoint)
 * Backend automatically filters for status: "published"
 */
export const fetchPublishedCourses = async () => {
  return apiRequest("/courses", {
    method: "GET",
    skipAuth: true,
  });
};

/**
 * Fetch a single course by ID (public endpoint)
 */
export const fetchCourseById = async (courseId) => {
  return apiRequest(`/courses/${courseId}`, {
    method: "GET",
    skipAuth: true,
  });
};

// ==================== Enrollment Functions ====================

/**
 * Enroll in a course
 * POST /api/v1/courses/:courseId/enroll
 */
export const enrollInCourse = async (courseId) => {
  return apiRequest(`/courses/${courseId}/enroll`, {
    method: "POST",
  });
};

/**
 * Get all enrolled courses for the authenticated student
 * GET /api/v1/courses/enrolled
 */
export const fetchEnrolledCourses = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  
  const query = searchParams.toString();
  return apiRequest(`/courses/enrolled${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get enrollment status for a specific course
 * GET /api/v1/courses/:courseId/enrollment
 */
export const getEnrollmentStatus = async (courseId) => {
  return apiRequest(`/courses/${courseId}/enrollment`, {
    method: "GET",
  });
};

/**
 * Update enrollment status (pause, resume, complete, etc.)
 * PATCH /api/v1/courses/:courseId/enrollment
 */
export const updateEnrollmentStatus = async (courseId, status) => {
  return apiRequest(`/courses/${courseId}/enrollment`, {
    method: "PATCH",
    body: { status },
  });
};

/**
 * Unenroll from a course
 * DELETE /api/v1/courses/:courseId/enroll
 */
export const unenrollFromCourse = async (courseId) => {
  return apiRequest(`/courses/${courseId}/enroll`, {
    method: "DELETE",
  });
};


