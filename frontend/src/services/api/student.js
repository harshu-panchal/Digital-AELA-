import { apiRequest } from "./baseClient";
import { fetchSocialLinks } from "./socialVerification";

export const fetchStudentDashboard = () => apiRequest("/students/dashboard");

export const fetchStudentProfile = (userId) =>
  apiRequest(`/students/${userId}/profile`, {
    skipAuth: true, // Public endpoint
  });

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

export { fetchSocialLinks };

