import { apiRequest } from "./baseClient";

// Direct API to update student points (for manual coin adjustments if needed)
export const updateStudentPoints = (payload) =>
  apiRequest("/students/points", {
    method: "PATCH",
    body: payload,
  });

// Get student points directly
export const fetchStudentPoints = () => apiRequest("/students/points");

