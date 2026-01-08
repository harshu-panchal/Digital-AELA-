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
export const createEbook = async (payload, isFormData = false, onProgress) => {
  if (isFormData) {
    // Use FormData for file upload with extended timeout for large PDFs
    return apiRequest("/admin/ebooks", {
      method: "POST",
      body: payload, // payload is already FormData
      onUploadProgress: onProgress,
      timeout: 7200000, // 2 hours timeout for large PDF files
    });
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
export const uploadAdminCourseBrochure = async (courseId, file, onProgress) => {
  const formData = new FormData();
  formData.append("brochure", file);

  const response = await apiRequest(`/admin/courses/${courseId}/brochure`, {
    method: "POST",
    body: formData,
    onUploadProgress: onProgress,
    timeout: 10800000, // 3 hours timeout for large PDF files
    // Don't set headers - baseClient will handle FormData correctly
  });

  return {
    id: response.course._id,
    ...response.course,
    brochureUrl: response.brochureUrl,
  };
};

/**
 * Upload course intro video (super admin)
 */
export const uploadAdminCourseIntroVideo = async (courseId, file, onProgress) => {
  const formData = new FormData();
  formData.append("video", file);

  const response = await apiRequest(`/admin/courses/${courseId}/intro-video`, {
    method: "POST",
    body: formData,
    onUploadProgress: onProgress,
    timeout: 10800000, // 3 hours timeout for large video files
  });

  return {
    id: response.course._id,
    ...response.course,
    introVideoUrl: response.introVideoUrl,
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

