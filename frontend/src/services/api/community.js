import { apiRequest } from "./baseClient";

/**
 * Get community data (students, teachers, recruiters)
 * Accessible to all authenticated users
 */
export const fetchCommunityData = () => apiRequest("/community");

