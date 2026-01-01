/**
 * Upload an image file via the backend API
 * @param {File} file - The image file to upload
 * @param {string} folder - Optional folder path (default: "digital-aela")
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<string>} - The URL of the uploaded image
 */
import { apiRequest } from "../services/api/baseClient";

export const uploadImageToCloudinary = async (file, folder = "digital-aela", onProgress) => {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Only image files are allowed.");
  }

  // Create FormData
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);

  // Upload to backend via apiRequest for consistent timeout and CSRF handling
  const payload = await apiRequest("/upload/single", {
    method: "POST",
    body: formData,
    onUploadProgress: onProgress,
  });

  // Return the image URL
  return payload.data?.url || payload.url;
};
