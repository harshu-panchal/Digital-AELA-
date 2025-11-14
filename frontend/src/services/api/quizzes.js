import { apiRequest } from "./baseClient";

/**
 * Get all published quizzes
 */
export const fetchQuizzes = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append("category", params.category);
  if (params.difficulty) queryParams.append("difficulty", params.difficulty);
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);

  const queryString = queryParams.toString();
  return apiRequest(`/quizzes${queryString ? `?${queryString}` : ""}`, {
    skipAuth: true, // Public endpoint
  });
};

/**
 * Get a single quiz by ID
 */
export const fetchQuizById = (quizId) =>
  apiRequest(`/quizzes/${quizId}`, {
    skipAuth: true, // Public endpoint
  });

/**
 * Submit quiz attempt
 */
export const submitQuizAttempt = (payload) =>
  apiRequest("/quizzes/attempts", {
    method: "POST",
    body: payload,
  });

/**
 * Get student quiz history
 */
export const fetchQuizHistory = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append("category", params.category);
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);

  const queryString = queryParams.toString();
  return apiRequest(`/quizzes/attempts${queryString ? `?${queryString}` : ""}`);
};

