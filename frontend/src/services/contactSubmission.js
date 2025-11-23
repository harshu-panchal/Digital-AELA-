import { createFormLead } from "./api/crm";

const STORAGE_KEY = "aela.contact.submissions";

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
    return { ...entry, leadId: response.lead?._id };
  } catch (error) {
    // If API call fails, still return the entry (stored in localStorage)
    // The error will be handled by the form component
    console.error("Failed to submit lead to backend:", error);
    throw error;
  }
};

export const getContactSubmissions = () => loadSubmissions();

