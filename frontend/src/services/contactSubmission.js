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

  const submissions = loadSubmissions();
  submissions.unshift(entry);
  persistSubmissions(submissions.slice(0, 200));

  await new Promise((resolve) => setTimeout(resolve, 500));
  return entry;
};

export const getContactSubmissions = () => loadSubmissions();

