import { apiRequest } from "./baseClient";
import { API_BASE_URL } from "../../config/api.js";

/**
 * Create course (super admin)
 */
export const createCourse = (payload) =>
  apiRequest("/admin/courses", {
    method: "POST",
    body: payload,
  });

/**
 * Get course by ID (super admin)
 */
export const getAdminCourseById = async (courseId) => {
  try {
    const response = await apiRequest(`/admin/courses/${courseId}`, {
      method: "GET",
    });
    // Transform backend response to match frontend expectations
    return {
      id: response.course._id,
      ...response.course,
      modules: response.course.modules || [],
      resources: response.course.resources || [],
      enrolments: response.course.enrolments || [],
      quizzes: response.course.quizzes || [],
    };
  } catch (error) {
    return null;
  }
};

/**
 * Update course (super admin)
 */
export const updateAdminCourse = async (courseId, updates) => {
  const response = await apiRequest(`/admin/courses/${courseId}`, {
    method: "PUT",
    body: updates,
  });
  // Transform backend response to match frontend expectations
  return {
    id: response.course._id,
    ...response.course,
    modules: response.course.modules || [],
    resources: response.course.resources || [],
    enrolments: response.course.enrolments || [],
    quizzes: response.course.quizzes || [],
  };
};

/**
 * Create ebook (super admin)
 * Supports both FormData (with PDF file) and JSON payload
 */
export const createEbook = async (payload, isFormData = false) => {
  const { getStoredTokens } = await import("./baseClient");
  const tokens = getStoredTokens();

  if (!tokens?.accessToken) {
    throw new Error("Authentication required");
  }

  if (isFormData) {
    // Use FormData for file upload
    const response = await fetch(`${API_BASE_URL}/admin/ebooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        // Don't set Content-Type header - browser will set it with boundary for FormData
      },
      body: payload, // payload is already FormData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Failed to create ebook");
    }
    return data;
  } else {
    // Use regular JSON API request
    return apiRequest("/admin/ebooks", {
      method: "POST",
      body: payload,
    });
  }
};

/**
 * Upload course brochure PDF (super admin)
 */
export const uploadAdminCourseBrochure = async (courseId, file) => {
  const formData = new FormData();
  formData.append("brochure", file);

  const response = await apiRequest(`/admin/courses/${courseId}/brochure`, {
    method: "POST",
    body: formData,
    // Don't set headers - baseClient will handle FormData correctly
  });

  return {
    id: response.course._id,
    ...response.course,
    brochureUrl: response.brochureUrl,
  };
};

/**
 * Create blog (super admin)
 */
export const createBlog = (payload) =>
  apiRequest("/admin/blogs", {
    method: "POST",
    body: payload,
  });

