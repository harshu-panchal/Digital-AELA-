import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineUserGroup,
  HiOutlineDevicePhoneMobile,
  HiOutlineComputerDesktop,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getActiveSessions,
  getAllSessions,
  terminateSession,
  getSessionStats,
} from "../../src/services/api/sessions";

const ActiveSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("active"); // "active" or "all"
  const [filters, setFilters] = useState({
    device: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadSessions();
    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadSessions();
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [viewMode, filters.device, filters.search, pagination.page]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = viewMode === "active"
        ? await getActiveSessions({
            ...filters,
            page: pagination.page,
            pageSize: pagination.pageSize,
          })
        : await getAllSessions({
            ...filters,
            isActive: true,
            page: pagination.page,
            pageSize: pagination.pageSize,
          });
      setSessions(response.sessions || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load sessions");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getSessionStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleTerminate = async (sessionId) => {
    if (!window.confirm("Are you sure you want to terminate this session?")) {
      return;
    }

    try {
      await terminateSession(sessionId);
      toast.success("Session terminated successfully");
      loadSessions();
      loadStats();
    } catch (error) {
      toast.error(error.message || "Failed to terminate session");
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "0m";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case "mobile":
        return <HiOutlineDevicePhoneMobile className="h-5 w-5" />;
      case "tablet":
        return <HiOutlineDevicePhoneMobile className="h-5 w-5" />;
      case "desktop":
        return <HiOutlineComputerDesktop className="h-5 w-5" />;
      default:
        return <HiOutlineComputerDesktop className="h-5 w-5" />;
    }
  };

  const getDeviceColor = (device) => {
    switch (device) {
      case "mobile":
        return "text-blue-400";
      case "tablet":
        return "text-purple-400";
      case "desktop":
        return "text-green-400";
      default:
        return "text-slate-400";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "student":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "teacher":
        return "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40";
      case "admin":
      case "super-admin":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Active Sessions | Digital AELA" description="Monitor active user sessions" />

      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Active Sessions</h1>
            <p className="text-slate-400">Monitor and manage user sessions in real-time</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode("active");
                setPagination({ ...pagination, page: 1 });
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                viewMode === "active"
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black"
                  : "border border-white/10 bg-[#111] text-white hover:bg-white/5"
              }`}>
              Active
            </button>
            <button
              onClick={() => {
                setViewMode("all");
                setPagination({ ...pagination, page: 1 });
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                viewMode === "all"
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black"
                  : "border border-white/10 bg-[#111] text-white hover:bg-white/5"
              }`}>
              All Sessions
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Active Now</p>
              <p className="text-2xl font-semibold text-emerald-400">{stats.active || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Today</p>
              <p className="text-2xl font-semibold text-white">{stats.today || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">This Week</p>
              <p className="text-2xl font-semibold text-blue-400">{stats.thisWeek || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">This Month</p>
              <p className="text-2xl font-semibold text-purple-400">{stats.thisMonth || 0}</p>
            </div>
          </div>
        )}

        {stats && (stats.deviceBreakdown || stats.roleBreakdown) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.deviceBreakdown && (
              <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">By Device</h3>
                <div className="space-y-2">
                  {Object.entries(stats.deviceBreakdown).map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 capitalize">{device}</span>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.roleBreakdown && (
              <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">By Role</h3>
                <div className="space-y-2">
                  {Object.entries(stats.roleBreakdown).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 capitalize">{role}</span>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full pl-10 rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <select
              value={filters.device}
              onChange={(e) => {
                setFilters({ ...filters, device: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <HiOutlineUserGroup className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No active sessions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {session.user?.profilePicture ? (
                        <img
                          src={session.user.profilePicture}
                          alt={session.user.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E5C158] flex items-center justify-center text-black font-semibold">
                          {session.user?.fullName?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{session.user?.fullName || "Unknown User"}</h3>
                        <p className="text-xs text-slate-400">{session.user?.email || "No email"}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(
                          session.user?.role
                        )}`}>
                        {session.user?.role || "unknown"}
                      </span>
                      <div className={`flex items-center gap-2 ${getDeviceColor(session.device)}`}>
                        {getDeviceIcon(session.device)}
                        <span className="text-xs capitalize">{session.device}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3">
                      <div className="flex items-center gap-2">
                        <HiOutlineClock className="h-4 w-4" />
                        <span>Active: {formatDate(session.lastActivity)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Duration: {formatDuration(session.currentDuration || session.duration)}</span>
                      </div>
                      {session.browser && (
                        <div className="flex items-center gap-2">
                          <span>{session.browser}</span>
                        </div>
                      )}
                      {session.os && (
                        <div className="flex items-center gap-2">
                          <span>{session.os}</span>
                        </div>
                      )}
                      {session.ipAddress && (
                        <div className="flex items-center gap-2">
                          <span>IP: {session.ipAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => handleTerminate(session._id)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition flex items-center gap-2">
                      <HiOutlineXCircle className="h-4 w-4" />
                      Terminate
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
    </div>
  );
};

export default ActiveSessions;

