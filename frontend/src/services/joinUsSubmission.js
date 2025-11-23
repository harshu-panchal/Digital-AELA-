import { API_BASE_URL } from "../config/api.js";

const STORAGE_KEY = "aela.form.submissions";

const storeSubmission = (formId, email) => {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const submissions = stored ? JSON.parse(stored) : {};
    submissions[`${formId}:${email.toLowerCase().trim()}`] = {
      submittedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Submit Join Us application with file uploads
 * @param {string} program - Application type: "teacher" or "influencer"
 * @param {Object} payload - Form data including file objects
 * @returns {Promise<Object>} - Submission response
 */
export const submitJoinUsLead = async (program, payload) => {
  if (!["teacher", "influencer"].includes(program)) {
    throw new Error("Invalid program type. Must be 'teacher' or 'influencer'");
  }

  // Create FormData for multipart/form-data submission
  const formData = new FormData();
  
  // Add application type
  formData.append("applicationType", program);

  // Add all form fields (excluding file fields)
  const fileFields = ["resume", "videoIntro", "profileImage"];
  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    
    // Skip file fields - they will be added separately
    if (fileFields.includes(key)) {
      return;
    }
    
    // Add non-file fields
    if (value !== null && value !== undefined && value !== "") {
      formData.append(key, value);
    }
  });

  // Add file attachments
  for (const fieldName of fileFields) {
    const file = payload[fieldName];
    if (file instanceof File) {
      formData.append(fieldName, file);
    }
  }

  // Submit to backend API
  const response = await fetch(`${API_BASE_URL}/join-us/submit`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result?.error?.message || "Failed to submit application";
    throw new Error(errorMessage);
  }

  // Store submission in localStorage
  if (payload.email) {
    storeSubmission(program, payload.email);
  }

  return result;
};

// Keep this for backward compatibility if needed elsewhere
export const getJoinUsSubmissions = () => {
  console.warn("getJoinUsSubmissions is deprecated. Applications are now stored in the database.");
  return [];
};

