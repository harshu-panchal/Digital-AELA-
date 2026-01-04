import { apiRequest } from "./baseClient";

/**
 * Fetch all home page data in one request
 * GET /api/v1/home/data
 */
export const fetchHomeData = () => {
  return apiRequest("/home/data", {
    skipAuth: true,
  });
};
