/**
 * Upload a file to the backend registration endpoint
 * @param {File} file - The file to upload
 * @param {Object} registrationData - The registration data (email, password, fullName, role, profile)
 * @returns {Promise<Object>} - The registration response
 */
import { API_BASE_URL } from "../config/api.js";

export const registerWithFile = async (file, registrationData) => {

  // Create FormData
  const formData = new FormData();
  
  // Add file if provided
  if (file) {
    formData.append("profileImage", file);
  }
  
  // Add registration fields
  formData.append("email", registrationData.email);
  formData.append("password", registrationData.password);
  formData.append("fullName", registrationData.fullName);
  formData.append("role", registrationData.role || "student");
  
  // Add profile data as JSON string if provided
  if (registrationData.profile) {
    formData.append("profile", JSON.stringify(registrationData.profile));
  }

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
  });

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.message ?? `Registration failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code;
    error.details = payload;
    throw error;
  }

  // Store tokens if provided
  if (payload.accessToken && payload.refreshToken) {
    const { persistTokens } = await import("../services/api/baseClient");
    persistTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
  }

  return payload;
};

