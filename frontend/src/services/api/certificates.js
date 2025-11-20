import { apiRequest } from "./baseClient";

/**
 * Generate Certificate
 * POST /api/v1/certificates/generate
 */
export const generateCertificate = async (payload) => {
  return apiRequest("/certificates/generate", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get Student Certificates
 * GET /api/v1/certificates/student
 */
export const getStudentCertificates = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return apiRequest(`/certificates/student${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Certificate Details
 * GET /api/v1/certificates/:certificateId
 */
export const getCertificateDetails = async (certificateId) => {
  return apiRequest(`/certificates/${certificateId}`, {
    method: "GET",
  });
};

/**
 * Download Certificate PDF
 * GET /api/v1/certificates/:certificateId/pdf
 */
export const downloadCertificatePDF = async (certificateId) => {
  return apiRequest(`/certificates/${certificateId}/pdf`, {
    method: "GET",
  });
};

/**
 * Verify Certificate (Public)
 * GET /api/v1/certificates/verify/:verificationCode
 */
export const verifyCertificate = async (verificationCode) => {
  return apiRequest(`/certificates/verify/${verificationCode}`, {
    method: "GET",
  });
};

/**
 * Get All Certificates (Admin)
 * GET /api/v1/certificates
 */
export const getAllCertificates = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);
  if (params.studentId) searchParams.set("studentId", params.studentId);
  if (params.courseId) searchParams.set("courseId", params.courseId);

  const query = searchParams.toString();
  return apiRequest(`/certificates${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Revoke Certificate (Admin)
 * DELETE /api/v1/certificates/:certificateId
 */
export const revokeCertificate = async (certificateId) => {
  return apiRequest(`/certificates/${certificateId}`, {
    method: "DELETE",
  });
};

/**
 * Get Certificate Templates (Admin)
 * GET /api/v1/certificates/templates
 */
export const getCertificateTemplates = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.templateType) searchParams.set("templateType", params.templateType);
  if (params.isActive !== undefined) searchParams.set("isActive", params.isActive);

  const query = searchParams.toString();
  return apiRequest(`/certificates/templates${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Create Certificate Template (Admin)
 * POST /api/v1/certificates/templates
 */
export const createCertificateTemplate = async (payload) => {
  return apiRequest("/certificates/templates", {
    method: "POST",
    body: payload,
  });
};

/**
 * Update Certificate Template (Admin)
 * PUT /api/v1/certificates/templates/:templateId
 */
export const updateCertificateTemplate = async (templateId, payload) => {
  return apiRequest(`/certificates/templates/${templateId}`, {
    method: "PUT",
    body: payload,
  });
};

/**
 * Delete Certificate Template (Admin)
 * DELETE /api/v1/certificates/templates/:templateId
 */
export const deleteCertificateTemplate = async (templateId) => {
  return apiRequest(`/certificates/templates/${templateId}`, {
    method: "DELETE",
  });
};

