import { apiRequest } from "./baseClient";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("pageSize", params.pageSize);
  if (params.status) query.append("status", params.status);
  if (params.search) query.append("search", params.search);
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const fetchAdminBranches = (params = {}) =>
  apiRequest(`/admin/branches${buildQuery(params)}`);

export const fetchAdminBranchSummary = () =>
  apiRequest("/admin/branches/summary");

export const fetchAdminBranchDetails = (branchId) =>
  apiRequest(`/admin/branches/${branchId}`);

export const approveBranch = (branchId) =>
  apiRequest(`/admin/branches/${branchId}/approve`, {
    method: "PATCH",
    body: {},
  });

export const rejectBranch = (branchId, rejectionReason) =>
  apiRequest(`/admin/branches/${branchId}/reject`, {
    method: "PATCH",
    body: { rejectionReason },
  });

export const suspendBranch = (branchId, reason) =>
  apiRequest(`/admin/branches/${branchId}/suspend`, {
    method: "PATCH",
    body: { reason },
  });

export const reactivateBranch = (branchId) =>
  apiRequest(`/admin/branches/${branchId}/reactivate`, {
    method: "PATCH",
    body: {},
  });
