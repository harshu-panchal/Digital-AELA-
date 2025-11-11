const STORAGE_KEY = "aela.teacher.ebooks";

const loadEbooks = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistEbooks = (ebooks) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ebooks));
  } catch {
    // ignore persistence errors for mock layer
  }
};

const generateId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const getTeacherEbooks = () => loadEbooks();

export const getTeacherEbookById = (ebookId) =>
  loadEbooks().find((ebook) => ebook.id === ebookId) ?? null;

export const createTeacherEbook = async (payload) => {
  const timestamp = new Date().toISOString();
  const id = generateId("ebook");
  const ebooks = loadEbooks();

  const entry = {
    id,
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...payload,
  };

  ebooks.unshift(entry);
  persistEbooks(ebooks);

  await new Promise((resolve) => setTimeout(resolve, 500));
  return entry;
};

export const updateTeacherEbook = async (ebookId, updates) => {
  const ebooks = loadEbooks();
  const index = ebooks.findIndex((ebook) => ebook.id === ebookId);
  if (index === -1) {
    throw new Error("E-book not found");
  }
  const updated = {
    ...ebooks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  ebooks[index] = updated;
  persistEbooks(ebooks);
  await new Promise((resolve) => setTimeout(resolve, 350));
  return updated;
};

