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

/**
 * Advanced job search with filters
 * GET /api/v1/jobs/search
 */
export const searchJobs = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.location) searchParams.set("location", params.location);
  if (params.employmentType) {
    const types = Array.isArray(params.employmentType)
      ? params.employmentType.join(",")
      : params.employmentType;
    searchParams.set("employmentType", types);
  }
  if (params.isRemote !== undefined && params.isRemote !== null) {
    searchParams.set("isRemote", params.isRemote);
  }
  if (params.minSalary) searchParams.set("minSalary", params.minSalary);
  if (params.maxSalary) searchParams.set("maxSalary", params.maxSalary);
  if (params.experience) searchParams.set("experience", params.experience);
  if (params.company) searchParams.set("company", params.company);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  
  const query = searchParams.toString();
  return apiRequest(`/jobs/search${query ? `?${query}` : ""}`, {
    skipAuth: true,
  });
};

export const submitJobApplication = (jobId, payload) =>
  apiRequest(`/jobs/${jobId}/apply`, {
    method: "POST",
    body: payload,
  });

export const fetchMyApplications = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);
  const query = searchParams.toString();
  return apiRequest(`/jobs/applications${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

export const fetchApplicationStats = () =>
  apiRequest("/jobs/applications/stats", {
    method: "GET",
  });
