import { apiRequest } from "./baseClient";

export const fetchRecruiterProfile = () => apiRequest("/recruiter/profile");

export const updateRecruiterProfile = (payload) =>
  apiRequest("/recruiter/profile", {
    method: "PATCH",
    body: payload,
  });

export const fetchRecruiterJobs = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/recruiter/jobs${query ? `?${query}` : ""}`);
};

export const createRecruiterJob = (payload) =>
  apiRequest("/recruiter/jobs", {
    method: "POST",
    body: payload,
  });

export const updateRecruiterJob = (jobId, payload) =>
  apiRequest(`/recruiter/jobs/${jobId}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteRecruiterJob = (jobId) =>
  apiRequest(`/recruiter/jobs/${jobId}`, {
    method: "DELETE",
  });

export const fetchJobApplicants = (jobId) =>
  apiRequest(`/recruiter/jobs/${jobId}/applicants`);

export const updateJobApplicantStage = (jobId, applicationId, payload) =>
  apiRequest(`/recruiter/jobs/${jobId}/applicants/${applicationId}`, {
    method: "PATCH",
    body: payload,
  });

export const fetchRecruiterBlogs = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/recruiter/blogs${query ? `?${query}` : ""}`);
};

export const createRecruiterBlog = (payload) =>
  apiRequest("/recruiter/blogs", {
    method: "POST",
    body: payload,
  });

export const updateRecruiterBlog = (blogId, payload) =>
  apiRequest(`/recruiter/blogs/${blogId}`, {
    method: "PATCH",
    body: payload,
  });

export const publishRecruiterBlog = (blogId) =>
  apiRequest(`/recruiter/blogs/${blogId}/publish`, {
    method: "POST",
  });

