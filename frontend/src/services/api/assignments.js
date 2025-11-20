import { apiRequest } from "./baseClient";

/**
 * Teacher: Create Assignment
 * POST /api/v1/teacher/assignments
 */
export const createAssignment = async (payload) => {
  return apiRequest("/teacher/assignments", {
    method: "POST",
    body: payload,
  });
};

/**
 * Teacher: Get All Assignments
 * GET /api/v1/teacher/assignments
 */
export const getTeacherAssignments = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.courseId) searchParams.set("courseId", params.courseId);
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/teacher/assignments${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Teacher: Get Assignment Details with Submissions
 * GET /api/v1/teacher/assignments/:assignmentId
 */
export const getAssignmentDetails = async (assignmentId, includeSubmissions = true) => {
  const searchParams = new URLSearchParams();
  searchParams.set("includeSubmissions", includeSubmissions.toString());

  return apiRequest(`/teacher/assignments/${assignmentId}?${searchParams.toString()}`, {
    method: "GET",
  });
};

/**
 * Teacher: Grade Submission
 * PUT /api/v1/teacher/assignments/:assignmentId/submissions/:submissionId/grade
 */
export const gradeSubmission = async (assignmentId, submissionId, payload) => {
  return apiRequest(
    `/teacher/assignments/${assignmentId}/submissions/${submissionId}/grade`,
    {
      method: "PUT",
      body: payload,
    }
  );
};

/**
 * Student: Get Assignments for Enrolled Courses
 * GET /api/v1/student/assignments
 */
export const getStudentAssignments = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.courseId) searchParams.set("courseId", params.courseId);
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);

  const query = searchParams.toString();
  return apiRequest(`/student/assignments${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Student: Get Assignment Details
 * GET /api/v1/student/assignments/:assignmentId
 */
export const getStudentAssignmentDetails = async (assignmentId) => {
  return apiRequest(`/student/assignments/${assignmentId}`, {
    method: "GET",
  });
};

/**
 * Student: Submit Assignment
 * POST /api/v1/student/assignments/:assignmentId/submit
 */
export const submitAssignment = async (assignmentId, payload) => {
  return apiRequest(`/student/assignments/${assignmentId}/submit`, {
    method: "POST",
    body: payload,
  });
};

