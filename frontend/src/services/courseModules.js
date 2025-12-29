import { apiRequest } from "./api/baseClient";

/**
 * Create a new module for a course
 * @param {string} courseId - Course ID
 * @param {Object} moduleData - Module data (title, description)
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<Object>} Created module
 */
export const createModule = async (courseId, moduleData, files = []) => {
  const formData = new FormData();
  
  // Add module data
  formData.append("title", moduleData.title || "");
  if (moduleData.description) {
    formData.append("description", moduleData.description);
  }
  
  // Add files
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }
  
  const response = await apiRequest(`/courses/${courseId}/modules`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
  });
  
  return response.module;
};

/**
 * Get all modules for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Modules list
 */
export const getCourseModules = async (courseId) => {
  const response = await apiRequest(`/courses/${courseId}/modules`, {
    method: "GET",
  });
  
  return {
    modules: response.modules || [],
    hasAccess: response.hasAccess || false,
  };
};

/**
 * Get a single module by ID
 * @param {string} moduleId - Module ID
 * @returns {Promise<Object>} Module data
 */
export const getModule = async (moduleId) => {
  const response = await apiRequest(`/modules/${moduleId}`, {
    method: "GET",
  });
  
  return response.module;
};

/**
 * Update module metadata (title, description)
 * @param {string} moduleId - Module ID
 * @param {Object} updates - Updates object (title, description)
 * @returns {Promise<Object>} Updated module
 */
export const updateModule = async (moduleId, updates) => {
  const response = await apiRequest(`/modules/${moduleId}`, {
    method: "PUT",
    body: updates,
  });
  
  return response.module;
};

/**
 * Delete a module
 * @param {string} moduleId - Module ID
 * @returns {Promise<void>}
 */
export const deleteModule = async (moduleId) => {
  await apiRequest(`/modules/${moduleId}`, {
    method: "DELETE",
  });
};

/**
 * Add files to an existing module
 * @param {string} moduleId - Module ID
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<Object>} Updated module
 */
export const addFilesToModule = async (moduleId, files) => {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }
  
  const formData = new FormData();
  
  // Add files
  files.forEach((file) => {
    formData.append("files", file);
  });
  
  const response = await apiRequest(`/modules/${moduleId}/files`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
  });
  
  return response.module;
};

/**
 * Remove a file from a module
 * @param {string} moduleId - Module ID
 * @param {number} fileIndex - Index of file to remove
 * @returns {Promise<Object>} Updated module
 */
export const removeFileFromModule = async (moduleId, fileIndex) => {
  const response = await apiRequest(`/modules/${moduleId}/files/${fileIndex}`, {
    method: "DELETE",
  });
  
  return response.module;
};

