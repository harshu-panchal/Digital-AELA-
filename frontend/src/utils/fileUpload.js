/**
 * Upload a file to the backend registration endpoint
 * @param {File} file - The file to upload
 * @param {Object} registrationData - The registration data (email, password, fullName, role, profile)
 * @returns {Promise<Object>} - The registration response
 */
import { apiRequest, persistTokens } from "../services/api/baseClient";

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
  if (registrationData.branchJoinType) {
    formData.append("branchJoinType", registrationData.branchJoinType);
  }
  if (registrationData.branchId) {
    formData.append("branchId", registrationData.branchId);
  }
  
  // Add profile data as JSON string if provided
  if (registrationData.profile) {
    formData.append("profile", JSON.stringify(registrationData.profile));
  }

  if (registrationData.branch) {
    formData.append("branch", JSON.stringify(registrationData.branch));
  }

  const payload = await apiRequest("/auth/register", {
    method: "POST",
    body: formData,
  });

  // Store tokens if provided
  if (payload.accessToken && payload.refreshToken) {
    persistTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
  }

  return payload;
};

