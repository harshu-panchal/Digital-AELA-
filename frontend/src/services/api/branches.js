import { apiRequest } from "./baseClient";

export const fetchPublicBranches = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.city) query.append("city", params.city);
  if (params.state) query.append("state", params.state);
  if (params.country) query.append("country", params.country);
  if (params.includeAll) query.append("includeAll", "1");

  const queryString = query.toString();
  return apiRequest(`/branches/public${queryString ? `?${queryString}` : ""}`, {
    skipAuth: true,
  });
};

export const fetchPublicBranchDetails = (identifier) =>
  apiRequest(`/branches/public/${identifier}`, {
    skipAuth: true,
  });
