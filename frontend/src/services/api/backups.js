import { apiRequest } from "./baseClient";
import { API_BASE_URL } from "../../config/api.js";
import { getStoredTokens } from "./baseClient";

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
  // Get access token
  const tokens = getStoredTokens();
  const accessToken = tokens?.accessToken;

  if (!accessToken) {
    throw new Error("Authentication required. Please log in first.");
  }

  // Use fetch directly for file download (can't use apiRequest as it expects JSON)
  const response = await fetch(`${API_BASE_URL}/backups/${backupId}/download`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to download backup";
    try {
      const error = await response.json();
      errorMessage = error.error?.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `backup-${backupId}.tar.gz`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  // Create blob and download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
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

