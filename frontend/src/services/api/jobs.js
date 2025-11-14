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

