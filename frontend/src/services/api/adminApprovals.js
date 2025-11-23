import { apiRequest } from "./baseClient";

/**
 * Get pending courses
 */
export const fetchPendingCourses = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/courses${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get pending ebooks
 */
export const fetchPendingEbooks = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/ebooks${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get pending jobs
 */
export const fetchPendingJobs = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/jobs${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get pending teachers
 */
export const fetchPendingTeachers = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/teachers${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get pending students
 */
export const fetchPendingStudents = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/students${queryString ? `?${queryString}` : ""}`);
};

/**
 * Approve/Reject course
 */
export const approveCourse = (courseId, action) =>
  apiRequest(`/admin/courses/${courseId}/approve`, {
    method: "PATCH",
    body: { action },
  });

/**
 * Approve/Reject ebook
 */
export const approveEbook = (ebookId, action) =>
  apiRequest(`/admin/ebooks/${ebookId}/approve`, {
    method: "PATCH",
    body: { action },
  });

/**
 * Approve/Reject job
 */
export const approveJob = (jobId, action) =>
  apiRequest(`/admin/jobs/${jobId}/approve`, {
    method: "PATCH",
    body: { action },
  });

/**
 * Approve/Reject teacher
 */
export const approveTeacher = (userId, action) =>
  apiRequest(`/admin/teachers/${userId}/approve`, {
    method: "PATCH",
    body: { action },
  });

/**
 * Approve/Reject student
 */
export const approveStudent = (userId, action) =>
  apiRequest(`/admin/students/${userId}/approve`, {
    method: "PATCH",
    body: { action },
  });

/**
 * Get pending blogs
 */
export const fetchPendingBlogs = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/blogs${queryString ? `?${queryString}` : ""}`);
};

/**
 * Approve/Reject blog
 */
export const approveBlog = (blogId, action, rejectionReason = null) =>
  apiRequest(`/admin/blogs/${blogId}/approve`, {
    method: "PATCH",
    body: { action, rejectionReason },
  });

/**
 * Get blog preview (full content)
 */
export const fetchBlogPreview = (blogId) =>
  apiRequest(`/admin/pending/blogs/${blogId}/preview`);

/**
 * Get course preview (full content with videos/modules list)
 */
export const fetchCoursePreview = (courseId) =>
  apiRequest(`/admin/pending/courses/${courseId}/preview`);

/**
 * Get ebook preview (full content)
 */
export const fetchEbookPreview = (ebookId) =>
  apiRequest(`/admin/pending/ebooks/${ebookId}/preview`);

/**
 * Get job post preview (full content)
 */
export const fetchJobPreview = (jobId) =>
  apiRequest(`/admin/pending/jobs/${jobId}/preview`);

/**
 * Get pending join-us applications
 */
export const fetchPendingJoinUsApplications = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  if (params.applicationType) queryParams.append("applicationType", params.applicationType);
  const queryString = queryParams.toString();
  return apiRequest(`/admin/pending/join-us-applications${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get join-us application by ID (full details)
 */
export const fetchJoinUsApplicationById = (applicationId) =>
  apiRequest(`/admin/pending/join-us-applications/${applicationId}`);

/**
 * Approve/Reject join-us application
 */
export const approveJoinUsApplication = (applicationId, action, rejectionReason = null) => {
  if (action === "reject") {
    return apiRequest(`/admin/join-us-applications/${applicationId}/reject`, {
      method: "PATCH",
      body: { rejectionReason },
    });
  } else {
    return apiRequest(`/admin/join-us-applications/${applicationId}/approve`, {
      method: "PATCH",
      body: {},
    });
  }
};

/**
 * Reject join-us application with reason
 */
export const rejectJoinUsApplication = (applicationId, rejectionReason) =>
  apiRequest(`/admin/join-us-applications/${applicationId}/reject`, {
    method: "PATCH",
    body: { rejectionReason },
  });

