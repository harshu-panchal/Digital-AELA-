/**
 * Upload an image file to Cloudinary via the backend API
 * @param {File} file - The image file to upload
 * @param {string} folder - Optional Cloudinary folder path (default: "digital-aela")
 * @returns {Promise<string>} - The Cloudinary URL of the uploaded image
 */
export const uploadImageToCloudinary = async (file, folder = "digital-aela") => {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api/v1";

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

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("File size exceeds the limit of 5MB");
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

  // Return the Cloudinary URL
  return payload.data?.url || payload.url;
};

