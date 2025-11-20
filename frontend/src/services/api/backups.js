import { apiRequest } from "./baseClient";

/**
 * Create Backup
 * POST /api/v1/backups
 */
export const createBackup = async (payload) => {
  return apiRequest("/backups", {
    method: "POST",
    body: payload,
  });
};

/**
 * Get All Backups
 * GET /api/v1/backups
 */
export const getAllBackups = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);
  if (params.type) searchParams.set("type", params.type);
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return apiRequest(`/backups${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

/**
 * Get Backup Details
 * GET /api/v1/backups/:backupId
 */
export const getBackupDetails = async (backupId) => {
  return apiRequest(`/backups/${backupId}`, {
    method: "GET",
  });
};

/**
 * Download Backup
 * GET /api/v1/backups/:backupId/download
 */
export const downloadBackup = async (backupId) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/v1/backups/${backupId}/download`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to download backup");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-${backupId}.tar.gz`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Restore Backup
 * POST /api/v1/backups/:backupId/restore
 */
export const restoreBackup = async (backupId) => {
  return apiRequest(`/backups/${backupId}/restore`, {
    method: "POST",
    body: { confirm: "yes" },
  });
};

/**
 * Delete Backup
 * DELETE /api/v1/backups/:backupId
 */
export const deleteBackup = async (backupId) => {
  return apiRequest(`/backups/${backupId}`, {
    method: "DELETE",
  });
};

/**
 * Get Backup Statistics
 * GET /api/v1/backups/stats
 */
export const getBackupStats = async () => {
  return apiRequest("/backups/stats", {
    method: "GET",
  });
};

/**
 * Cleanup Expired Backups
 * POST /api/v1/backups/cleanup
 */
export const cleanupBackups = async () => {
  return apiRequest("/backups/cleanup", {
    method: "POST",
  });
};

