import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineCloudArrowDown,
  HiOutlineCloudArrowUp,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineServer,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getAllBackups,
  createBackup,
  deleteBackup,
  downloadBackup,
  restoreBackup,
  getBackupStats,
  cleanupBackups,
} from "../../src/services/api/backups";

const BackupManagement = () => {
  const { user } = useAuth();
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    type: "full",
    retentionDays: 30,
  });

  useEffect(() => {
    loadBackups();
    loadStats();
    // Refresh every 10 seconds to check backup status
    const interval = setInterval(() => {
      loadBackups();
      loadStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [filters.status, filters.type, filters.search, pagination.page]);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const response = await getAllBackups({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setBackups(response.backups || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load backups");
      setBackups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getBackupStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name) {
      toast.error("Please enter a backup name");
      return;
    }

    setIsCreating(true);
    try {
      await createBackup(createForm);
      toast.success("Backup creation started");
      setShowCreateModal(false);
      setCreateForm({ name: "", type: "full", retentionDays: 30 });
      loadBackups();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Failed to create backup");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (backupId) => {
    if (!window.confirm("Are you sure you want to delete this backup? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteBackup(backupId);
      toast.success("Backup deleted successfully");
      loadBackups();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Failed to delete backup");
    }
  };

  const handleDownload = async (backupId) => {
    try {
      await downloadBackup(backupId);
      toast.success("Backup download started");
    } catch (error) {
      toast.error(error.message || "Failed to download backup");
    }
  };

  const handleRestore = async (backupId) => {
    if (!window.confirm("Are you sure you want to restore this backup? This will replace all current data. This action cannot be undone.")) {
      return;
    }

    if (!window.confirm("This is your final warning. Restoring will overwrite all current database data. Type 'yes' to confirm.")) {
      return;
    }

    try {
      await restoreBackup(backupId);
      toast.success("Backup restore process started. This may take several minutes.");
    } catch (error) {
      toast.error(error.message || "Failed to restore backup");
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm("Are you sure you want to cleanup expired backups?")) {
      return;
    }

    try {
      const response = await cleanupBackups();
      toast.success(response.message || "Cleanup completed");
      loadBackups();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Failed to cleanup backups");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "in_progress":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "expired":
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "full":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "database":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "files":
        return "bg-green-500/20 text-green-300 border-green-500/40";
      case "custom":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Backup Management | Digital AELA" description="Manage system backups" />

      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Backup Management</h1>
            <p className="text-slate-400">Create, manage, and restore system backups</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCleanup}
              className="px-4 py-2 rounded-lg border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition flex items-center gap-2">
              <HiOutlineTrash className="h-5 w-5" />
              Cleanup Expired
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition flex items-center gap-2">
              <HiOutlineCloudArrowDown className="h-5 w-5" />
              Create Backup
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Total Backups</p>
              <p className="text-2xl font-semibold text-white">{stats.total || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Completed</p>
              <p className="text-2xl font-semibold text-emerald-400">{stats.completed || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Failed</p>
              <p className="text-2xl font-semibold text-red-400">{stats.failed || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Total Size</p>
              <p className="text-2xl font-semibold text-blue-400">{stats.totalSizeFormatted || "0 Bytes"}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Search backups..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <select
              value={filters.type}
              onChange={(e) => {
                setFilters({ ...filters, type: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Types</option>
              <option value="full">Full</option>
              <option value="database">Database</option>
              <option value="files">Files</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <HiOutlineServer className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">No backups found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition">
              Create Your First Backup
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {backups.map((backup) => (
              <motion.div
                key={backup._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-semibold text-white">{backup.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          backup.status
                        )}`}>
                        {backup.status}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(
                          backup.type
                        )}`}>
                        {backup.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3">
                      <div className="flex items-center gap-2">
                        <HiOutlineClock className="h-4 w-4" />
                        <span>
                          {backup.completedAt
                            ? `Completed: ${formatDate(backup.completedAt)}`
                            : `Started: ${formatDate(backup.startedAt)}`}
                        </span>
                      </div>
                      {backup.fileSize > 0 && (
                        <div className="flex items-center gap-2">
                          <span>Size: {formatBytes(backup.fileSize)}</span>
                        </div>
                      )}
                      {backup.createdBy && (
                        <div className="flex items-center gap-2">
                          <span>By: {backup.createdBy.fullName}</span>
                        </div>
                      )}
                      {backup.expiresAt && (
                        <div className="flex items-center gap-2">
                          <span>Expires: {formatDate(backup.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                    {backup.error && backup.error.message && (
                      <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-red-300">Error: {backup.error.message}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    {backup.status === "completed" && (
                      <>
                        <button
                          onClick={() => handleDownload(backup._id)}
                          className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-semibold hover:bg-blue-500/30 transition flex items-center gap-2">
                          <HiOutlineCloudArrowDown className="h-4 w-4" />
                          Download
                        </button>
                        <button
                          onClick={() => handleRestore(backup._id)}
                          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm font-semibold hover:bg-purple-500/30 transition flex items-center gap-2">
                          <HiOutlineCloudArrowUp className="h-4 w-4" />
                          Restore
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(backup._id)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition flex items-center gap-2">
                      <HiOutlineTrash className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/10 bg-[#0B0F1E] p-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-white mb-4">Create Backup</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Backup Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none"
                  placeholder="e.g., Daily Backup 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Backup Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                  <option value="full">Full Backup</option>
                  <option value="database">Database Only</option>
                  <option value="files">Files Only</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Retention (Days)</label>
                <input
                  type="number"
                  value={createForm.retentionDays}
                  onChange={(e) => setCreateForm({ ...createForm, retentionDays: parseInt(e.target.value) || 30 })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none"
                  min="1"
                  max="365"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !createForm.name}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isCreating ? "Creating..." : "Create Backup"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BackupManagement;

