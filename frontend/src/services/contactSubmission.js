import { createFormLead } from "./api/crm";

const STORAGE_KEY = "aela.contact.submissions";
const FORM_SUBMISSIONS_KEY = "aela.form.submissions";

const loadSubmissions = () => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

const persistSubmissions = (entries) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore persistence errors
  }
};

const storeFormSubmission = (formId, email) => {
  if (typeof window === "undefined" || !email) return;
  try {
    const stored = window.localStorage.getItem(FORM_SUBMISSIONS_KEY);
    const submissions = stored ? JSON.parse(stored) : {};
    submissions[`${formId}:${email.toLowerCase().trim()}`] = {
      submittedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(FORM_SUBMISSIONS_KEY, JSON.stringify(submissions));
  } catch {
    // ignore storage errors
  }
};

export const submitContactLead = async (formId, payload) => {
  const timestamp = new Date().toISOString();
  const entry = {
    id: `${formId}-${timestamp}`,
    formId,
    submittedAt: timestamp,
    payload,
  };

  // Store in localStorage as backup
  const submissions = loadSubmissions();
  submissions.unshift(entry);
  persistSubmissions(submissions.slice(0, 200));

  // Submit to backend API to create lead
  try {
    const response = await createFormLead({
      formId,
      ...payload,
    });
    
    // Store form submission for tracking (same format as ContactForm uses)
    if (payload.email) {
      storeFormSubmission(formId, payload.email);
    }
    
    return { ...entry, leadId: response.lead?._id };
  } catch (error) {
    // Don't log duplicate submission errors (409) - they're expected and handled gracefully
    const isDuplicateError = 
      error?.status === 409 || 
      error?.code === "DUPLICATE_SUBMISSION" ||
      error?.message?.includes("already submitted");
    
    if (!isDuplicateError) {
      // Only log unexpected errors
      console.error("Failed to submit lead to backend:", error);
    }
    
    throw error;
  }
};

export const getContactSubmissions = () => loadSubmissions();

