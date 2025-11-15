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

