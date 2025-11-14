import { apiRequest } from "./baseClient";

export const fetchDashboardData = () => apiRequest("/learn-earn/dashboard");

