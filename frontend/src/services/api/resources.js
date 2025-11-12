import { apiRequest } from "./baseClient";

export const fetchEbooks = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/resources/ebooks${query ? `?${query}` : ""}`, {
    skipAuth: true,
  });
};

export const fetchEbookById = (ebookId) =>
  apiRequest(`/resources/ebooks/${ebookId}`, {
    skipAuth: true,
  });

