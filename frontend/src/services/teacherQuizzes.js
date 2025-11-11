const STORAGE_KEY = "aela.teacher.quizzes";

const loadQuizzes = () => {
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

const persistQuizzes = (quizzes) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
  } catch {
    // ignore persistence errors in mock layer
  }
};

const generateId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const getTeacherQuizzes = () => loadQuizzes();

export const getTeacherQuizById = (quizId) =>
  loadQuizzes().find((quiz) => quiz.id === quizId) ?? null;

export const createTeacherQuiz = async (payload) => {
  const timestamp = new Date().toISOString();
  const id = generateId("quiz");
  const quizzes = loadQuizzes();

  const entry = {
    id,
    status: payload.status ?? "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...payload,
  };

  quizzes.unshift(entry);
  persistQuizzes(quizzes);
  await new Promise((resolve) => setTimeout(resolve, 450));
  return entry;
};

export const updateTeacherQuiz = async (quizId, updates) => {
  const quizzes = loadQuizzes();
  const index = quizzes.findIndex((quiz) => quiz.id === quizId);
  if (index === -1) {
    throw new Error("Quiz not found");
  }

  const updated = {
    ...quizzes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  quizzes[index] = updated;
  persistQuizzes(quizzes);
  await new Promise((resolve) => setTimeout(resolve, 350));
  return updated;
};

export const deleteTeacherQuiz = async (quizId) => {
  const quizzes = loadQuizzes();
  const next = quizzes.filter((quiz) => quiz.id !== quizId);
  persistQuizzes(next);
  await new Promise((resolve) => setTimeout(resolve, 250));
};

