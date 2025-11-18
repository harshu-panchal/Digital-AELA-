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

export const fetchApplicantDetails = (jobId, applicationId) =>
  apiRequest(`/recruiter/jobs/${jobId}/applicants/${applicationId}`);

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

/**
 * Get recruiter analytics dashboard
 * GET /api/v1/recruiter/analytics/dashboard
 */
export const fetchRecruiterAnalyticsDashboard = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set("period", params.period);

  const query = searchParams.toString();
  return apiRequest(`/recruiter/analytics/dashboard${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get application analytics per job
 * GET /api/v1/recruiter/analytics/jobs/:jobId
 */
export const fetchJobApplicationAnalytics = async (jobId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set("period", params.period);

  const query = searchParams.toString();
  return apiRequest(`/recruiter/analytics/jobs/${jobId}${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get candidate pipeline metrics
 * GET /api/v1/recruiter/analytics/pipeline
 */
export const fetchCandidatePipelineMetrics = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.jobId) searchParams.set("jobId", params.jobId);

  const query = searchParams.toString();
  return apiRequest(`/recruiter/analytics/pipeline${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get hiring statistics
 * GET /api/v1/recruiter/analytics/hiring-stats
 */
export const fetchHiringStatistics = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set("period", params.period);

  const query = searchParams.toString();
  return apiRequest(`/recruiter/analytics/hiring-stats${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get performance report
 * GET /api/v1/recruiter/analytics/performance-report
 */
export const fetchPerformanceReport = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.format) searchParams.set("format", params.format);

  const query = searchParams.toString();
  return apiRequest(`/recruiter/analytics/performance-report${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Bulk applicant actions
 * POST /api/v1/recruiter/applicants/bulk-action
 */
export const performBulkApplicantAction = async (applicationIds, action, data = {}) => {
  return apiRequest("/recruiter/applicants/bulk-action", {
    method: "POST",
    body: { applicationIds, action, data },
  });
};

/**
 * Advanced candidate filtering
 * GET /api/v1/recruiter/applicants/search
 */
export const searchCandidates = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.jobId) searchParams.set("jobId", params.jobId);
  if (params.stage) searchParams.set("stage", params.stage);
  if (params.minDate) searchParams.set("minDate", params.minDate);
  if (params.maxDate) searchParams.set("maxDate", params.maxDate);
  if (params.searchQuery) searchParams.set("searchQuery", params.searchQuery);
  if (params.hasResume) searchParams.set("hasResume", params.hasResume);
  if (params.hasPortfolio) searchParams.set("hasPortfolio", params.hasPortfolio);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/recruiter/applicants/search${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Schedule interview
 * POST /api/v1/recruiter/applicants/:applicationId/schedule-interview
 */
export const scheduleInterview = async (applicationId, interviewData) => {
  return apiRequest(`/recruiter/applicants/${applicationId}/schedule-interview`, {
    method: "POST",
    body: interviewData,
  });
};

/**
 * Get interview schedule
 * GET /api/v1/recruiter/interviews
 */
export const fetchInterviewSchedule = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return apiRequest(`/recruiter/interviews${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Update interview status
 * PATCH /api/v1/recruiter/applicants/:applicationId/interview
 */
export const updateInterviewStatus = async (applicationId, statusData) => {
  return apiRequest(`/recruiter/applicants/${applicationId}/interview`, {
    method: "PATCH",
    body: statusData,
  });
};


