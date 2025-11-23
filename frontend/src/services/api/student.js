import { apiRequest } from "./baseClient";
import { fetchSocialLinks } from "./socialVerification";
import { API_BASE_URL } from "../../config/api.js";
import { getStoredTokens } from "./baseClient";

export const fetchStudentDashboard = () => apiRequest("/students/dashboard");

export const fetchDashboardWidgets = () => apiRequest("/students/dashboard/widgets");

export const fetchStudentProfile = (userId) =>
  apiRequest(`/students/${userId}/profile`);

export const fetchEnhancedProfile = (userId) =>
  apiRequest(`/students/${userId}/profile/enhanced`);

export const updateStudentProfile = (payload) =>
  apiRequest("/students/profile", {
    method: "PATCH",
    body: payload,
  });

export const createStudentProfile = (payload) =>
  apiRequest("/students/profile", {
    method: "POST",
    body: payload,
  });

export const uploadProfileImage = async (file) => {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    throw new Error("Authentication required");
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", `digital-aela/profiles/student`);

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

  return payload.data?.url || payload.url;
};

export { fetchSocialLinks };

