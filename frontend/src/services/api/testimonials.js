import { apiRequest } from "./baseClient";

/**
 * Get all published testimonials
 */
export const getTestimonials = async (section = null) => {
  try {
    const endpoint = section
      ? `/testimonials/section/${section}`
      : "/testimonials";
    const response = await apiRequest(endpoint, {
      method: "GET",
      skipAuth: true,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get testimonials by section
 */
export const getTestimonialsBySection = async (section) => {
  try {
    const response = await apiRequest(`/testimonials/section/${section}`, {
      method: "GET",
      skipAuth: true,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all testimonials for admin (with pagination)
 */
export const getAdminTestimonials = async (page = 1, pageSize = 20, filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters.status) {
      params.append("status", filters.status);
    }
    if (filters.section) {
      params.append("section", filters.section);
    }
    if (filters.search) {
      params.append("search", filters.search);
    }

    const response = await apiRequest(`/admin/testimonials?${params.toString()}`, {
      method: "GET",
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Create testimonial (with optional image upload)
 */
export const createTestimonial = async (data, avatarFile = null) => {
  try {
    const formData = new FormData();

    // Append text fields
    formData.append("name", data.name || "");
    formData.append("role", data.role || "");
    formData.append("text", data.text || "");
    formData.append("rating", (data.rating || 5).toString());
    formData.append("section", data.section || "home");
    formData.append("status", data.status || "published");
    formData.append("displayOrder", (data.displayOrder || 0).toString());

    // Append avatar file if provided
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const response = await apiRequest("/admin/testimonials", {
      method: "POST",
      body: formData,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Update testimonial (with optional image upload)
 */
export const updateTestimonial = async (id, data, avatarFile = null) => {
  try {
    const formData = new FormData();

    // Append text fields
    if (data.name !== undefined) formData.append("name", data.name || "");
    if (data.role !== undefined) formData.append("role", data.role || "");
    if (data.text !== undefined) formData.append("text", data.text || "");
    if (data.rating !== undefined) formData.append("rating", data.rating.toString());
    if (data.section !== undefined) formData.append("section", data.section);
    if (data.status !== undefined) formData.append("status", data.status);
    if (data.displayOrder !== undefined) formData.append("displayOrder", data.displayOrder.toString());
    if (data.avatar !== undefined) formData.append("avatar", data.avatar || "");

    // Append avatar file if provided (this will replace the existing avatar)
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const response = await apiRequest(`/admin/testimonials/${id}`, {
      method: "PUT",
      body: formData,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete testimonial
 */
export const deleteTestimonial = async (id) => {
  try {
    const response = await apiRequest(`/admin/testimonials/${id}`, {
      method: "DELETE",
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Toggle testimonial status
 */
export const toggleTestimonialStatus = async (id, status) => {
  try {
    const response = await apiRequest(`/admin/testimonials/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

