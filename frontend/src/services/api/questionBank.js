import { apiRequest } from "./baseClient";

/**
 * Get questions from question bank
 * GET /api/v1/question-bank
 */
export const getQuestions = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.difficulty) searchParams.set("difficulty", params.difficulty);
  if (params.tags) searchParams.set("tags", Array.isArray(params.tags) ? params.tags.join(",") : params.tags);
  if (params.isPublic !== undefined) searchParams.set("isPublic", params.isPublic);
  if (params.search) searchParams.set("search", params.search);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.createdBy) searchParams.set("createdBy", params.createdBy);

  const query = searchParams.toString();
  return apiRequest(`/question-bank${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get a single question by ID
 * GET /api/v1/question-bank/:questionId
 */
export const getQuestionById = async (questionId) => {
  return apiRequest(`/question-bank/${questionId}`, {
    method: "GET",
  });
};

/**
 * Create a question in question bank
 * POST /api/v1/question-bank
 */
export const createQuestion = async (payload) => {
  return apiRequest("/question-bank", {
    method: "POST",
    body: payload,
  });
};

/**
 * Update a question in question bank
 * PATCH /api/v1/question-bank/:questionId
 */
export const updateQuestion = async (questionId, payload) => {
  return apiRequest(`/question-bank/${questionId}`, {
    method: "PATCH",
    body: payload,
  });
};

/**
 * Delete a question from question bank
 * DELETE /api/v1/question-bank/:questionId
 */
export const deleteQuestion = async (questionId) => {
  return apiRequest(`/question-bank/${questionId}`, {
    method: "DELETE",
  });
};

/**
 * Get question bank statistics
 * GET /api/v1/question-bank/stats
 */
export const getQuestionBankStats = async () => {
  return apiRequest("/question-bank/stats", {
    method: "GET",
  });
};

