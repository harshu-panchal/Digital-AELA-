import { apiRequest } from "./baseClient";

export const submitQuizAttempt = (payload) =>
  apiRequest("/quizzes/attempts", {
    method: "POST",
    body: payload,
  });

export const fetchQuizHistory = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.category) searchParams.set("category", params.category);
  const query = searchParams.toString();
  return apiRequest(`/quizzes/attempts${query ? `?${query}` : ""}`);
};

