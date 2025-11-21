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
 * Supports both FormData (with PDF file) and JSON payload
 */
export const createTeacherEbook = async (payload, pdfFile = null) => {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api/v1";
  const { getStoredTokens } = await import("./api/baseClient");
  const tokens = getStoredTokens();

  if (!tokens?.accessToken) {
    throw new Error("Authentication required");
  }

  let response;
  if (pdfFile) {
    console.log("📤 Preparing to upload PDF:", {
      filename: pdfFile.name,
      type: pdfFile.type,
      size: pdfFile.size,
    });
    // Use FormData for file upload
    const formData = new FormData();
    
    // Append PDF file
    formData.append("pdf", pdfFile);
    
    // Append other fields
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== null && payload[key] !== undefined) {
        if (Array.isArray(payload[key])) {
          formData.append(key, JSON.stringify(payload[key]));
        } else {
          formData.append(key, payload[key]);
        }
      }
    });

    const res = await fetch(`${API_BASE_URL}/teacher/ebooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        // Don't set Content-Type header - browser will set it with boundary for FormData
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Failed to create ebook");
    }
    response = data;
  } else {
    // Use regular JSON API request
    response = await apiRequest("/teacher/ebooks", {
      method: "POST",
      body: payload,
    });
  }

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

