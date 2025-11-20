import { apiRequest } from "./baseClient";

/**
 * Create course (super admin)
 */
export const createCourse = (payload) =>
  apiRequest("/admin/courses", {
    method: "POST",
    body: payload,
  });

/**
 * Create ebook (super admin)
 */
export const createEbook = (payload) =>
  apiRequest("/admin/ebooks", {
    method: "POST",
    body: payload,
  });

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

