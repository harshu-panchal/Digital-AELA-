import { apiRequest } from "./api/baseClient";

/**
 * Get all ebooks created by the teacher
 */
export const getTeacherEbooks = async () => {
  const response = await apiRequest("/teacher/ebooks", {
    method: "GET",
  });
  // Transform backend response to match frontend expectations
  return (response.ebooks || []).map((ebook) => ({
    id: ebook._id,
    ...ebook,
  }));
};

/**
 * Get a specific ebook by ID
 */
export const getTeacherEbookById = async (ebookId) => {
  try {
    const response = await apiRequest(`/teacher/ebooks/${ebookId}`, {
      method: "GET",
    });
    // Transform backend response to match frontend expectations
    return {
      id: response.ebook._id,
      ...response.ebook,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Create a new ebook (teacher only - creates with isPublic: false)
 */
export const createTeacherEbook = async (payload) => {
  const response = await apiRequest("/teacher/ebooks", {
    method: "POST",
    body: payload,
  });
  // Transform backend response to match frontend expectations
  return {
    id: response.ebook._id,
    ...response.ebook,
  };
};

/**
 * Update an ebook (only if not yet approved)
 */
export const updateTeacherEbook = async (ebookId, updates) => {
  const response = await apiRequest(`/teacher/ebooks/${ebookId}`, {
    method: "PUT",
    body: updates,
  });
  // Transform backend response to match frontend expectations
  return {
    id: response.ebook._id,
    ...response.ebook,
  };
};

