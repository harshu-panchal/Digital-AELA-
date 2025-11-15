import { apiRequest } from "./baseClient";

/**
 * Get teacher dashboard data
 */
export const fetchTeacherDashboard = async () => {
  return apiRequest("/teacher/dashboard", {
    method: "GET",
  });
};

