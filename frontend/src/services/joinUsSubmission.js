import { API_BASE_URL } from "../config/api.js";
import { checkFormSubmission } from "./api/crm";
import { getStoredTokens, apiRequest } from "./api/baseClient";

// Email-based localStorage checks removed - now using userId only

/**
 * Submit Join Us application with file uploads
 * @param {string} program - Application type: "teacher" or "influencer"
 * @param {Object} payload - Form data including file objects
 * @param {string} userId - Required user ID (must be authenticated)
 * @returns {Promise<Object>} - Submission response
 */
export const submitJoinUsLead = async (program, payload, userId = null) => {
  if (!userId) {
    throw new Error("Authentication required to submit this application");
  }
  if (!["teacher", "influencer"].includes(program)) {
    throw new Error("Invalid program type. Must be 'teacher' or 'influencer'");
  }

  // Check for duplicate submission before proceeding (by userId only)
  if (userId) {
    try {
      const checkResult = await checkFormSubmission(program, userId);
      if (checkResult?.submitted) {
        throw new Error(
          "You have already submitted this application. Our team will review it and get in touch soon."
        );
      }
    } catch (error) {
      // If it's our duplicate error, rethrow it
      if (error.message.includes("already submitted")) {
        throw error;
      }
      // Otherwise, continue with submission (backend will catch duplicates)
      console.warn("Failed to check submission status:", error);
    }
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

  // Submit to backend API via apiRequest for consistent timeout and CSRF handling
  const response = await apiRequest("/join-us/submit", {
    method: "POST",
    body: formData,
  });

  return response;
};

// Keep this for backward compatibility if needed elsewhere
export const getJoinUsSubmissions = () => {
  console.warn(
    "getJoinUsSubmissions is deprecated. Applications are now stored in the database."
  );
  return [];
};
