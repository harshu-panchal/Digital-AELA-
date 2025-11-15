import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaDatabase, FaServer, FaUsers, FaMemory, FaSync, FaArrowLeft } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import { fetchSystemHealth } from "../../../src/services/api/superAdmin";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const SystemHealth = () => {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadHealthData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchSystemHealth();
      if (data) {
        setHealthData(data);
        setLastRefresh(new Date());
      } else {
        throw new Error("No data received from server");
      }
    } catch (error) {
      console.error("Failed to load system health:", error);
      const errorMessage = error?.details?.error?.message || error?.message || "Unknown error";
      toast.error(`Failed to load system health: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadHealthData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    if (status === "healthy" || status === "connected" || status === "operational") {
      return "text-green-400";
    }
    if (status === "unhealthy" || status === "disconnected" || status === "degraded") {
      return "text-red-400";
    }
    return "text-yellow-400";
  };

  const getStatusBg = (status) => {
    if (status === "healthy" || status === "connected" || status === "operational") {
      return "bg-green-500/20 border-green-500/40";
    }
    if (status === "unhealthy" || status === "disconnected" || status === "degraded") {
      return "bg-red-500/20 border-red-500/40";
    }
    return "bg-yellow-500/20 border-yellow-500/40";
  };

  const getStatusIcon = (status) => {
    if (status === "healthy" || status === "connected" || status === "operational") {
      return <FaCheckCircle className="w-5 h-5 text-green-400" />;
    }
    if (status === "unhealthy" || status === "disconnected" || status === "degraded") {
      return <FaTimesCircle className="w-5 h-5 text-red-400" />;
    }
    return <FaSpinner className="w-5 h-5 text-yellow-400 animate-spin" />;
  };

  if (loading && !healthData) {
    return (
      <div className="min-h-screen bg-[#05060D] flex items-center justify-center">
        <FaSpinner className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05060D]">
      <SEO
        title="System Health Dashboard | Digital AELA"
        description="Monitor system health, database status, and server metrics"
        keywords="system health, monitoring, Digital AELA admin"
        url="https://digitalaela.com/super-admin/system-health"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.14),transparent_70%)] z-0" />

      <div className="relative z-10">
        <div className="layout-container py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8">
            <button
              onClick={() => navigate("/super-admin")}
              className="mb-4 flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors">
              <FaArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-white md:text-4xl">
                  System Health Dashboard
                </h1>
                <p className="mt-2 text-sm text-slate-300/80">
                  Monitor database status, API health, and server metrics in real-time
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => loadHealthData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10 disabled:opacity-50">
                  <FaSync className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Last updated{" "}
                  <span className="font-semibold text-[#F5D26A]">
                    {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Auto-refresh{" "}
                  <span className="font-semibold text-[#F5D26A]">30s</span>
                </div>
              </div>
            </div>
          </motion.div>

          {healthData && (
            <>
              {/* Overall Status */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="show"
                className="mb-6 rounded-3xl border-2 border-[#F5D26A]/40 bg-[#0B0F1E] p-6 shadow-xl shadow-black/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(healthData.overall.status)}
                    <div>
                      <h2 className="text-xl font-semibold text-white">Overall System Status</h2>
                      <p className="text-sm text-slate-400">
                        {healthData.overall.status === "healthy" ? "All systems operational" : "System issues detected"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#F5D26A]">
                      {healthData.overall.uptimePercentage}
                    </p>
                    <p className="text-xs text-slate-400">Uptime</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Server Uptime</p>
                    <p className="mt-1 text-lg font-semibold text-white">{healthData.overall.uptime}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Last Checked</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {new Date(healthData.overall.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Status</p>
                    <p className={`mt-1 text-lg font-semibold ${getStatusColor(healthData.overall.status)}`}>
                      {healthData.overall.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Database Status */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  className={`rounded-3xl border-2 ${getStatusBg(healthData.database.status)} bg-[#0B0F1E]/80 p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <FaDatabase className="w-6 h-6 text-[#F5D26A]" />
                    <h2 className="text-xl font-semibold text-white">Database Status</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Connection</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(healthData.database.connected ? "connected" : "disconnected")}
                        <span className={`text-sm font-semibold ${getStatusColor(healthData.database.status)}`}>
                          {healthData.database.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Collections</span>
                      <span className="text-sm font-semibold text-white">{healthData.database.collections}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Total Documents</span>
                      <span className="text-sm font-semibold text-white">
                        {healthData.database.totalDocuments.toLocaleString()}
                      </span>
                    </div>
                    {healthData.database.stats && (
                      <>
                        <div className="h-px bg-white/10 my-2" />
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Data Size</span>
                            <span className="text-sm font-semibold text-white">
                              {healthData.database.stats.dataSize} MB
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Storage Size</span>
                            <span className="text-sm font-semibold text-white">
                              {healthData.database.stats.storageSize} MB
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Indexes</span>
                            <span className="text-sm font-semibold text-white">
                              {healthData.database.stats.indexes}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>

                {/* API Health */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  className={`rounded-3xl border-2 ${getStatusBg(healthData.api.status)} bg-[#0B0F1E]/80 p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <FaServer className="w-6 h-6 text-[#F5D26A]" />
                    <h2 className="text-xl font-semibold text-white">API Health</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Status</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(healthData.api.status)}
                        <span className={`text-sm font-semibold ${getStatusColor(healthData.api.status)}`}>
                          {healthData.api.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Response Time</span>
                      <span className="text-sm font-semibold text-white">{healthData.api.responseTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Last Checked</span>
                      <span className="text-sm font-semibold text-white">
                        {new Date(healthData.api.lastChecked).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* User Statistics */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  className="rounded-3xl border-2 border-white/10 bg-[#0B0F1E]/80 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaUsers className="w-6 h-6 text-[#F5D26A]" />
                    <h2 className="text-xl font-semibold text-white">User Statistics</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Total Active Users</span>
                      <span className="text-lg font-bold text-[#F5D26A]">
                        {healthData.users.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="space-y-2">
                      {Object.entries(healthData.users.byRole).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-sm text-slate-300 capitalize">{role}</span>
                          <span className="text-sm font-semibold text-white">{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Server Metrics */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  className="rounded-3xl border-2 border-white/10 bg-[#0B0F1E]/80 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaMemory className="w-6 h-6 text-[#F5D26A]" />
                    <h2 className="text-xl font-semibold text-white">Server Metrics</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Node Version</span>
                      <span className="text-sm font-semibold text-white">{healthData.server.nodeVersion}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Platform</span>
                      <span className="text-sm font-semibold text-white capitalize">{healthData.server.platform}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Uptime</span>
                      <span className="text-sm font-semibold text-white">{healthData.server.uptime}</span>
                    </div>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Memory Usage</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">RSS</span>
                        <span className="text-sm font-semibold text-white">
                          {healthData.server.memory.rss} MB
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Heap Total</span>
                        <span className="text-sm font-semibold text-white">
                          {healthData.server.memory.heapTotal} MB
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Heap Used</span>
                        <span className="text-sm font-semibold text-white">
                          {healthData.server.memory.heapUsed} MB
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">External</span>
                        <span className="text-sm font-semibold text-white">
                          {healthData.server.memory.external} MB
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Collection Details */}
              {healthData.database.collectionCounts && Object.keys(healthData.database.collectionCounts).length > 0 && (
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  className="mt-6 rounded-3xl border-2 border-white/10 bg-[#0B0F1E]/80 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Collection Details</h2>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(healthData.database.collectionCounts).map(([collection, count]) => (
                      <div
                        key={collection}
                        className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-slate-400 mb-1">{collection}</p>
                        <p className="text-lg font-semibold text-white">{count.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;

