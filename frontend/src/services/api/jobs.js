import { apiRequest } from "./baseClient";

export const fetchPublishedJobs = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/jobs${query ? `?${query}` : ""}`, {
    skipAuth: true, // Public endpoint, no auth required
  });
};

export const submitJobApplication = (jobId, payload) =>
  apiRequest(`/jobs/${jobId}/apply`, {
    method: "POST",
    body: payload,
  });

/**
 * Get user's job applications
 * GET /api/v1/jobs/applications
 * @param {Object} params - { page, pageSize, status }
 */
export const fetchMyApplications = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return apiRequest(`/jobs/applications${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get application statistics
 * GET /api/v1/jobs/applications/stats
 */
export const fetchApplicationStats = async () => {
  return apiRequest("/jobs/applications/stats", {
    method: "GET",
  });
};

