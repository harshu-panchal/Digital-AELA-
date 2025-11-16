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

export const uploadProfileImage = async (file) => {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api/v1";
  
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

const getStoredTokens = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("aela.auth.tokens");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export { fetchSocialLinks };

