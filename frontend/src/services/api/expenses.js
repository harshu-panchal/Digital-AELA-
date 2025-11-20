import { apiRequest } from "./baseClient";

/**
 * Create Expense
 * POST /api/v1/expenses
 */
export const createExpense = async (payload) => {
  return apiRequest("/expenses", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get All Expenses
 * GET /api/v1/expenses
 */
export const getAllExpenses = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.category) searchParams.set("category", params.category);
  if (params.status) searchParams.set("status", params.status);
  if (params.month) searchParams.set("month", params.month);
  if (params.year) searchParams.set("year", params.year);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return apiRequest(`/expenses${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Expense Details
 * GET /api/v1/expenses/:expenseId
 */
export const getExpenseDetails = async (expenseId) => {
  return apiRequest(`/expenses/${expenseId}`, {
    method: "GET",
  });
};

/**
 * Update Expense
 * PUT /api/v1/expenses/:expenseId
 */
export const updateExpense = async (expenseId, payload) => {
  return apiRequest(`/expenses/${expenseId}`, {
    method: "PUT",
    body: payload,
  });
};

/**
 * Delete Expense
 * DELETE /api/v1/expenses/:expenseId
 */
export const deleteExpense = async (expenseId) => {
  return apiRequest(`/expenses/${expenseId}`, {
    method: "DELETE",
  });
};

/**
 * Get Financial Dashboard
 * GET /api/v1/expenses/dashboard
 */
export const getFinancialDashboard = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.month) searchParams.set("month", params.month);
  if (params.year) searchParams.set("year", params.year);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const query = searchParams.toString();
  return apiRequest(`/expenses/dashboard${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Expenses by Category
 * GET /api/v1/expenses/by-category
 */
export const getExpensesByCategory = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.month) searchParams.set("month", params.month);
  if (params.year) searchParams.set("year", params.year);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const query = searchParams.toString();
  return apiRequest(`/expenses/by-category${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Monthly Expenses
 * GET /api/v1/expenses/monthly
 */
export const getMonthlyExpenses = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.year) searchParams.set("year", params.year);

  const query = searchParams.toString();
  return apiRequest(`/expenses/monthly${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

