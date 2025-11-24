import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineArrowDown,
  HiOutlineArrowUp,
  HiOutlineGift,
  HiOutlineXCircle,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineFunnel,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getStoredTokens } from "../../src/services/api/baseClient";
import { fetchPointsHistory, fetchPointsStats } from "../../src/services/api/points";

const transactionTypeConfig = {
  earned: {
    label: "Earned",
    icon: HiOutlineArrowUp,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/40",
  },
  bonus: {
    label: "Bonus",
    icon: HiOutlineGift,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/40",
  },
  redeemed: {
    label: "Redeemed",
    icon: HiOutlineArrowDown,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/40",
  },
  penalty: {
    label: "Penalty",
    icon: HiOutlineXCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/40",
  },
  sent: {
    label: "Sent",
    icon: HiOutlineArrowRight,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/40",
  },
  received: {
    label: "Received",
    icon: HiOutlineArrowLeft,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/40",
  },
};

const PointsHistory = () => {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    type: "",
    source: "",
  });
  const loadingRef = useRef(false);

  const loadData = useCallback(async () => {
    // Prevent duplicate calls
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const [historyResult, statsResult] = await Promise.allSettled([
        fetchPointsHistory({
          page: pagination.page,
          pageSize: pagination.pageSize,
          ...(filters.type && { type: filters.type }),
          ...(filters.source && { source: filters.source }),
        }),
        fetchPointsStats(),
      ]);

      // Handle history result
      if (historyResult.status === "fulfilled") {
        setTransactions(historyResult.value.transactions || []);
        setPagination((prev) => historyResult.value.pagination || prev);
      } else {
        console.error("Failed to load points history:", historyResult.reason);
        toast.error(historyResult.reason?.message || "Failed to load points history");
        setTransactions([]);
      }

      // Handle stats result
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.stats || null);
      } else {
        // Only log non-critical errors (suppress "Invalid user ID" if data is loading from history)
        const errorMessage = statsResult.reason?.message || "";
        const isNonCriticalError = 
          errorMessage.includes("Invalid user ID") || 
          errorMessage.includes("VALIDATION_ERROR") ||
          statsResult.reason?.code === "VALIDATION_ERROR";
        
        // Only log if it's a critical error or if both requests failed
        if (!isNonCriticalError || historyResult.status !== "fulfilled") {
          // eslint-disable-next-line no-console
        console.error("Failed to load points stats:", statsResult.reason);
        }
        
        // Only show error toast if history also failed, to avoid duplicate toasts
        // And don't show toast for non-critical validation errors
        if (historyResult.status === "fulfilled" && !isNonCriticalError) {
          toast.error(statsResult.reason?.message || "Failed to load points statistics");
        }
        // Don't clear existing stats on error - keep them visible
      }
    } catch (error) {
      console.error("Unexpected error loading points data:", error);
      toast.error(error.message || "Failed to load points data");
      setTransactions([]);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [pagination.page, pagination.pageSize, filters.type, filters.source]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "student") {
      toast.info("Please log in as a student to view points history");
      return;
    }

    // Only load data if user has an ID and tokens are available (fully authenticated)
    const tokens = getStoredTokens();
    if (user?.id && tokens?.accessToken) {
      // Small delay to ensure auth is fully processed
      const timer = setTimeout(() => {
    loadData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, loadData]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const filteredStats = useMemo(() => {
    if (!stats) return null;

    const filteredByType = filters.type
      ? stats.transactionsByType[filters.type] || 0
      : null;

    const filteredBySource = filters.source
      ? stats.transactionsBySource[filters.source] || 0
      : null;

    return {
      ...stats,
      filteredByType,
      filteredBySource,
    };
  }, [stats, filters]);

  if (!isAuthenticated || user?.role !== "student") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Points History | Digital AELA"
        description="View your AELA coins transaction history and statistics"
        keywords="points history, coins history, transaction history, AELA coins"
        url="https://digitalaela.com/student/points/history"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(55,124,255,0.18),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20" style={{ paddingTop: "calc(6rem + 5vh)" }}>
        <section className="layout-container space-y-6">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">
                AELA Coins
              </p>
              <h1 className="text-3xl font-semibold md:text-4xl">Points History</h1>
              <p className="mt-2 text-sm text-slate-300/80">
                Track all your coin transactions and earnings
              </p>
            </div>
          </motion.header>

          {/* Stats Summary */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6 md:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-400">{stats.totalEarned}</p>
                <p className="text-xs text-slate-400">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-400">{stats.totalRedeemed}</p>
                <p className="text-xs text-slate-400">Total Redeemed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-sky-400">{stats.availableCoins}</p>
                <p className="text-xs text-slate-400">Available Coins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{stats.totalTransactions}</p>
                <p className="text-xs text-slate-400">Total Transactions</p>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-[#060A17]/90 p-4">
            <div className="flex items-center gap-2">
              <HiOutlineFunnel className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-300">Filters:</span>
            </div>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30">
              <option value="">All Types</option>
              <option value="earned">Earned</option>
              <option value="bonus">Bonus</option>
              <option value="redeemed">Redeemed</option>
              <option value="penalty">Penalty</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
            </select>

            <select
              value={filters.source}
              onChange={(e) => handleFilterChange("source", e.target.value)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30">
              <option value="">All Sources</option>
              {stats?.transactionsBySource &&
                Object.keys(stats.transactionsBySource).map((source) => (
                  <option key={source} value={source}>
                    {source.charAt(0).toUpperCase() + source.slice(1).replace(/_/g, " ")}
                  </option>
                ))}
            </select>

            {(filters.type || filters.source) && (
              <button
                onClick={() => {
                  setFilters({ type: "", source: "" });
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300/70 hover:bg-red-500/20">
                Clear Filters
              </button>
            )}
          </motion.div>

          {/* Transactions List */}
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-slate-300/80">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#060A17]/90 p-12 text-center">
              <HiOutlineGift className="mb-4 h-16 w-16 text-slate-400/50" />
              <h3 className="text-xl font-semibold text-white">No transactions found</h3>
              <p className="mt-2 text-sm text-slate-300/80">
                {filters.type || filters.source
                  ? "No transactions match your filters"
                  : "Start earning coins by completing quizzes and courses!"}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="space-y-3">
                {transactions.map((transaction, index) => {
                  const config = transactionTypeConfig[transaction.type] || transactionTypeConfig.earned;
                  const Icon = config.icon;
                  const isPositive = transaction.type === "earned" || transaction.type === "bonus" || transaction.type === "received";

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-4 transition hover:border-opacity-60`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full ${config.bgColor} ${config.borderColor} border`}>
                            <Icon className={`h-6 w-6 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{config.label}</p>
                              {transaction.source && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                                  {transaction.source.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                            {transaction.reason && (
                              <p className="mt-1 text-sm text-slate-300/80 line-clamp-1">
                                {transaction.reason}
                              </p>
                            )}
                            {transaction.createdAt && (
                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(transaction.createdAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xl font-bold ${
                              isPositive ? "text-green-400" : "text-red-400"
                            }`}>
                            {isPositive ? "+" : "-"}
                            {transaction.amount || 0}
                          </p>
                          <p className="text-xs text-slate-400">coins</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                    Previous
                  </button>
                  <span className="text-sm text-slate-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                    Next
                  </button>
                </motion.div>
              )}
            </>
          )}

          {/* Transaction Type Breakdown */}
          {stats?.transactionsByType && Object.keys(stats.transactionsByType).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Breakdown by Type</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(stats.transactionsByType).map(([type, amount]) => {
                  const config = transactionTypeConfig[type] || transactionTypeConfig.earned;
                  const Icon = config.icon;

                  return (
                    <div
                      key={type}
                      className={`flex items-center gap-3 rounded-2xl border ${config.borderColor} ${config.bgColor} p-4`}>
                      <Icon className={`h-6 w-6 ${config.color}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{config.label}</p>
                        <p className={`text-lg font-bold ${config.color}`}>{amount}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PointsHistory;

