import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaSpinner, FaSync } from "react-icons/fa";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { fetchDashboardData } from "../../src/services/api/superAdmin";

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Ensure cards are always visible
const cardVariantsSimple = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    approvals: [],
    activities: [],
    quickActions: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch dashboard data
  const loadDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchDashboardData();
      if (response) {
        // eslint-disable-next-line no-console
        console.log("Dashboard data loaded:", response);
        setDashboardData({
          stats: response.stats || [],
          approvals: response.approvals || [],
          activities: response.activities || [],
          quickActions: response.quickActions || [],
        });
        setLastRefresh(new Date());
      } else {
        throw new Error("No data received from server");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load dashboard data:", error);
      const errorMessage = error?.details?.error?.message || error?.message || "Unknown error";
      toast.error(`Failed to load dashboard data: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const { headlineStats, approvals, activityFeed, quickActions } =
    useMemo(() => {
      // Use backend data if available, otherwise show loading placeholders
      const stats = dashboardData.stats.length > 0
        ? dashboardData.stats
        : [
            {
              id: "learners",
              label: "Active Learners",
              value: loading ? "..." : "0",
              delta: "Loading...",
            },
            {
              id: "teachers",
              label: "Verified Teachers",
              value: loading ? "..." : "0",
              delta: "Loading...",
            },
            {
              id: "revenue",
              label: "Monthly Revenue",
              value: loading ? "..." : "AED 0",
              delta: "Loading...",
            },
            {
              id: "jobs",
              label: "Open Jobs",
              value: loading ? "..." : "0",
              delta: "Loading...",
            },
          ];

      // Use backend data if available
      const approvalQueues = dashboardData.approvals.length > 0
        ? dashboardData.approvals
        : [
            {
              id: "courses",
              title: "Courses Pending Approval",
              items: loading ? [] : [{ title: "No pending courses", owner: "", submitted: "" }],
              cta: "Review courses",
            },
            {
              id: "ebooks",
              title: "Books & E-Books",
              items: loading ? [] : [{ title: "No pending ebooks", owner: "", submitted: "" }],
              cta: "Moderate library",
            },
            {
              id: "jobs",
              title: "Job Posts",
              items: loading ? [] : [{ title: "No pending jobs", owner: "", submitted: "" }],
              cta: "Moderate job board",
            },
          ];

      // Use backend data if available
      const activity = dashboardData.activities.length > 0
        ? dashboardData.activities
        : loading
          ? []
          : [
              {
                icon: "ℹ️",
                title: "No recent activity",
                description: "Activity will appear here as users interact with the platform",
                time: "",
              },
            ];

      // Use backend data if available, otherwise show loading placeholders
      const actions = dashboardData.quickActions.length > 0
        ? dashboardData.quickActions
        : loading
          ? [
              {
                label: "Approve teachers",
                description: "Loading...",
                href: "/super-admin/approvals/teachers",
              },
              {
                label: "Moderate course catalog",
                description: "Loading...",
                href: "/super-admin/approvals/courses",
              },
              {
                label: "Review franchise leads",
                description: "Loading...",
                href: "/super-admin/franchise",
              },
              {
                label: "System health dashboard",
                description: "Loading...",
                href: "/super-admin/system-health",
              },
            ]
          : [
        {
          label: "Approve teachers",
                description: "0 awaiting verification",
                href: "/super-admin/approvals/teachers",
        },
        {
          label: "Moderate course catalog",
                description: "0 new submissions",
                href: "/super-admin/approvals/courses",
        },
        {
          label: "Review franchise leads",
                description: "No franchise leads",
          href: "/super-admin/franchise",
        },
        {
          label: "System health dashboard",
                description: "Uptime 0% · Service status unknown",
          href: "/super-admin/system-health",
        },
      ];

      // eslint-disable-next-line no-console
      console.log("Computed headlineStats:", stats);
      // eslint-disable-next-line no-console
      console.log("headlineStats.length:", stats.length);

      return {
        headlineStats: stats,
        approvals: approvalQueues,
        activityFeed: activity,
        quickActions: actions,
      };
    }, [dashboardData, loading]);

  return (
    <div className="relative">
      <SEO
        title="Super Admin Dashboard | Digital AELA"
        description="Monitor platform health, approve content, and manage global operations from the Digital AELA super admin console."
        keywords="super admin dashboard, Digital AELA admin, LMS admin, job board admin"
        url="https://digitalaela.com/super-admin"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.14),transparent_70%)] z-0" />

      <div className="relative z-10">
        <section className="space-y-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]">
              Super Admin Console
            </span>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold md:text-4xl">
                  Welcome back, {user?.fullName?.split(" ")[0] ?? "Admin"}
                </h1>
                <p className="mt-2 text-sm text-slate-300/80">
                  Oversight across learners, mentors, recruiters, and revenue —
                  stay ahead of approvals and platform health.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => loadDashboardData(true)}
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 relative z-20">
            {loading && dashboardData.stats.length === 0 ? (
              <div className="col-span-4 flex items-center justify-center py-12">
                <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
              </div>
            ) : headlineStats && headlineStats.length > 0 ? (
              headlineStats.map((stat) => (
              <div
                key={stat.id || stat.label}
                style={{ opacity: 1, visibility: "visible" }}
                className="rounded-3xl border-2 border-[#F5D26A]/40 bg-[#0B0F1E] p-6 shadow-xl shadow-black/50">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]">
                  {stat.label || "N/A"}
                </p>
                <p className="mt-4 text-3xl font-bold text-white">
                  {stat.value || "0"}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-200">{stat.delta || ""}</p>
              </div>
              ))
            ) : (
              <div className="col-span-4 rounded-3xl border-2 border-red-500 bg-red-500/20 p-8 text-center">
                <p className="text-sm text-red-300">Debug: headlineStats is empty or undefined</p>
                <p className="text-xs text-red-400 mt-2">Stats count: {headlineStats?.length || 0}</p>
              </div>
            )}
          </div>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Approval queue
                  </h2>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#F5D26A]/70">
                    Latest submissions
                  </p>
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-3">
                {loading && dashboardData.approvals.length === 0 ? (
                  <div className="col-span-3 flex items-center justify-center py-12">
                    <FaSpinner className="h-6 w-6 animate-spin text-[#F5D26A]" />
                  </div>
                ) : (
                  approvals.map((column) => (
                  <div
                    key={column.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <h3 className="text-sm font-semibold text-white">
                      {column.title}
                    </h3>
                    <ul className="mt-3 space-y-3 text-xs text-slate-300/85">
                      {column.items.map((item) => (
                        <li
                          key={item.title}
                          className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                          <p className="font-semibold text-white/90">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.owner}
                          </p>
                          <p className="text-[11px] text-[#F5D26A]/80">
                            {item.submitted}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="mt-3 text-[11px] font-semibold text-[#F5D26A] hover:text-[#FFE28A]">
                      {column.cta} →
                    </button>
                  </div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Recent activity
                </h2>
                <span className="text-xs text-slate-400">Live feed</span>
              </header>
              <div className="space-y-3">
                {loading && dashboardData.activities.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <FaSpinner className="h-6 w-6 animate-spin text-[#F5D26A]" />
                  </div>
                ) : activityFeed.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-center text-sm text-gray-400">
                    No recent activity
                  </div>
                ) : (
                  activityFeed.map((item, index) => (
                  <motion.div
                    key={`${item.title}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-300/80">
                          {item.description}
                        </p>
                        <p className="text-[11px] text-[#F5D26A]/80">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Quick actions
                </h2>
                <p className="text-xs text-slate-300/70">
                  Jump into the most visited admin workspaces
                </p>
              </div>
            </header>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                  <p className="text-base font-semibold text-white">
                    {action.label}
                  </p>
                  <p className="text-xs text-slate-400/80">
                    {action.description}
                  </p>
                  <Link
                    to={action.href}
                    className="mt-2 w-fit rounded-full border border-[#F5D26A]/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:border-[#F5D26A]/70 hover:text-[#FFE28A] transition-colors">
                    Open workspace →
                  </Link>
                </div>
              ))}
            </div>
          </motion.section>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
