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
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", `digital-aela/profiles/student`);

  const payload = await apiRequest("/upload/single", {
    method: "POST",
    body: formData,
  });

  return payload.data?.url || payload.url;
};

export { fetchSocialLinks };

