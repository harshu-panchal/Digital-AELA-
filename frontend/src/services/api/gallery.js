import { apiRequest } from "./baseClient";

/**
 * Get all active gallery images (public)
 */
export const getGalleryImages = async () => {
  try {
    const response = await apiRequest("/gallery", {
      method: "GET",
      skipAuth: true,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all gallery images for admin (with pagination)
 */
export const getAdminGalleryImages = async (page = 1, pageSize = 50) => {
  try {
    const response = await apiRequest(`/admin/gallery?page=${page}&pageSize=${pageSize}`, {
      method: "GET",
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload gallery image
 */
export const uploadGalleryImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await apiRequest("/admin/gallery", {
      method: "POST",
      body: formData,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete gallery image
 */
export const deleteGalleryImage = async (id) => {
  try {
    const response = await apiRequest(`/admin/gallery/${id}`, {
      method: "DELETE",
    });
    return response;
  } catch (error) {
    throw error;
  }
};

