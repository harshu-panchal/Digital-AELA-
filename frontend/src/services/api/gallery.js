import { apiRequest } from "./baseClient";

/**
 * Get all active gallery media sections (public)
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
 * Get all gallery media sections for admin (with pagination)
 */
export const getAdminGalleryImages = async (page = 1, pageSize = 50) => {
  try {
    const response = await apiRequest(
      `/admin/gallery?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload one or more gallery media files.
 */
export const uploadGalleryImage = async (
  file,
  onProgress,
  metadata = {}
) => {
  try {
    const formData = new FormData();
    const files = Array.isArray(file) ? file : file ? [file] : [];

    files.forEach((mediaFile) => {
      formData.append("media", mediaFile);
    });

    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    const response = await apiRequest("/admin/gallery", {
      method: "POST",
      body: formData,
      onUploadProgress: onProgress,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const uploadGalleryMedia = async (
  files = [],
  onProgress,
  metadata = {}
) => {
  return uploadGalleryImage(files, onProgress, metadata);
};

export const createGalleryLink = async (payload) => {
  try {
    const formData = new FormData();

    Object.entries({ ...payload, sourceType: "link" }).forEach(
      ([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
          return;
        }
        formData.append(key, value);
      }
    );

    return await apiRequest("/admin/gallery", {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw error;
  }
};

export const createGalleryLinks = async (payload) => {
  return createGalleryLink(payload);
};

/**
 * Delete gallery media section
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
