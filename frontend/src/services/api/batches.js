import { apiRequest } from "./baseClient";

/**
 * Get My Batch (Student)
 * GET /api/v1/batches/my-batch
 */
export const getMyBatch = async () => {
  return apiRequest("/batches/my-batch", {
    method: "GET",
  });
};

/**
 * Get Batch Details
 * GET /api/v1/batches/:batchId
 */
export const getBatchDetails = async (batchId) => {
  return apiRequest(`/batches/${batchId}`, {
    method: "GET",
  });
};

/**
 * Get All Batches (Admin/Teacher)
 * GET /api/v1/batches
 */
export const getAllBatches = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.courseId) searchParams.set("courseId", params.courseId);
  if (params.instructorId) searchParams.set("instructorId", params.instructorId);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return apiRequest(`/batches${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Create Batch (Admin)
 * POST /api/v1/batches
 */
export const createBatch = async (payload) => {
  return apiRequest("/batches", {
    method: "POST",
    body: payload,
  });
};

/**
 * Update Batch (Admin)
 * PUT /api/v1/batches/:batchId
 */
export const updateBatch = async (batchId, payload) => {
  return apiRequest(`/batches/${batchId}`, {
    method: "PUT",
    body: payload,
  });
};

/**
 * Add Student to Batch (Admin)
 * POST /api/v1/batches/:batchId/students/:studentId
 */
export const addStudentToBatch = async (batchId, studentId) => {
  return apiRequest(`/batches/${batchId}/students/${studentId}`, {
    method: "POST",
  });
};

/**
 * Remove Student from Batch (Admin)
 * DELETE /api/v1/batches/:batchId/students/:studentId
 */
export const removeStudentFromBatch = async (batchId, studentId) => {
  return apiRequest(`/batches/${batchId}/students/${studentId}`, {
    method: "DELETE",
  });
};

/**
 * Get Batch Statistics (Admin)
 * GET /api/v1/batches/stats
 */
export const getBatchStats = async () => {
  return apiRequest("/batches/stats", {
    method: "GET",
  });
};

