/**
 * Upload an image file via the backend API
 * @param {File} file - The image file to upload
 * @param {string} folder - Optional folder path (default: "digital-aela")
 * @returns {Promise<string>} - The URL of the uploaded image
 */
import { API_BASE_URL } from "../config/api.js";

export const uploadImageToCloudinary = async (file, folder = "digital-aela") => {

  // Get stored tokens
  const { getStoredTokens } = await import("../services/api/baseClient");
  const tokens = getStoredTokens();

  if (!tokens?.accessToken) {
    throw new Error("Authentication required");
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Only image files are allowed.");
  }

  // Create FormData
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);

  // Upload to backend
  const response = await fetch(`${API_BASE_URL}/upload/single`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message ?? `Upload failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }

  // Return the image URL
  return payload.data?.url || payload.url;
};

