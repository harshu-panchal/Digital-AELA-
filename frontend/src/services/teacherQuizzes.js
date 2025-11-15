import { apiRequest } from "./api/baseClient";

const STORAGE_KEY = "aela.teacher.quizzes";

// Fallback to localStorage for backward compatibility
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

/**
 * Create a quiz via backend API
 * Maps frontend format to backend format
 */
export const createTeacherQuiz = async (payload) => {
  try {
    // Map frontend format to backend format
    const backendQuestions = (payload.questions || []).map((q) => ({
      question: q.prompt || q.question || "",
      options: q.options || [],
      correctAnswer: q.correctIndex !== undefined ? q.correctIndex : q.correctAnswer,
      explanation: q.explanation || "",
    }));

    // Determine category - default to "quiz" if not provided
    let category = payload.category || "quiz";
    
    // If category is not one of the valid values, default to "quiz"
    if (!["quiz", "vocabulary", "speaking"].includes(category)) {
      category = "quiz";
    }

    // Map difficulty
    const difficulty = payload.difficulty || "intermediate";

    // Map duration from timeLimitMinutes
    const duration = payload.timeLimitMinutes ? Number(payload.timeLimitMinutes) : 0;

    const backendPayload = {
      title: payload.title || "",
      description: payload.description || "",
      category: category,
      difficulty: difficulty,
      rewardCoins: payload.rewardCoins ? Number(payload.rewardCoins) : 0,
      duration: duration,
      questions: backendQuestions,
      status: payload.status || "published", // Default to published so it appears on activities page
    };

    // Call backend API
    const response = await apiRequest("/quizzes", {
      method: "POST",
      body: backendPayload,
    });

    if (response?.quiz) {
      // Transform backend response to frontend format for compatibility
      return {
        id: response.quiz._id || response.quiz.id,
        _id: response.quiz._id,
        title: response.quiz.title,
        description: response.quiz.description,
        category: response.quiz.category,
        difficulty: response.quiz.difficulty,
        rewardCoins: response.quiz.rewardCoins,
        duration: response.quiz.duration,
        status: response.quiz.status,
        questions: response.quiz.questions || [],
        createdAt: response.quiz.createdAt,
        updatedAt: response.quiz.updatedAt,
      };
    }

    throw new Error("Invalid response from server");
  } catch (error) {
    console.error("Failed to create quiz via API:", error);
    throw error;
  }
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

