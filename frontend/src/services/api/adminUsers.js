import { apiRequest } from "./baseClient";

/**
 * Get users by role
 */
export const fetchUsersByRole = (role, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);
  if (params.search) queryParams.append("search", params.search);

  const queryString = queryParams.toString();
  return apiRequest(`/admin/users/${role}${queryString ? `?${queryString}` : ""}`);
};

/**
 * Get single user by ID
 */
export const fetchUserById = (userId) => apiRequest(`/admin/users/id/${userId}`);

/**
 * Get user details for admin panel (includes activity like enrollments + purchases)
 */
export const fetchUserDetailsById = (userId) =>
  apiRequest(`/admin/users/id/${userId}/details`);

/**
 * Create a new user
 */
export const createUser = (payload) =>
  apiRequest("/admin/users", {
    method: "POST",
    body: payload,
  });

/**
 * Update user
 */
export const updateUser = (userId, payload) =>
  apiRequest(`/admin/users/${userId}`, {
    method: "PATCH",
    body: payload,
  });

/**
 * Delete user
 */
export const deleteUser = (userId) =>
  apiRequest(`/admin/users/${userId}`, {
    method: "DELETE",
  });

