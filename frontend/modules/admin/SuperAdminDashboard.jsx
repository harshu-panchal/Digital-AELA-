import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaSpinner, FaSync } from "react-icons/fa";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { fetchDashboardData } from "../../src/services/api/superAdmin";
import { getAllLeads } from "../../src/services/api/crm";
import { getFinancialDashboard } from "../../src/services/api/expenses";
import { getAnnouncementStats } from "../../src/services/api/announcements";
import { getSessionStats } from "../../src/services/api/sessions";
import { getBackupStats } from "../../src/services/api/backups";
import { getTeacherAssignments } from "../../src/services/api/assignments";
import { fetchTeacherStudents } from "../../src/services/api/teacher";
import { getDoubtTicketStats } from "../../src/services/api/doubtTickets";
import { HiOutlineUserGroup, HiOutlineClock, HiOutlineCheckCircle, HiOutlineCurrencyDollar, HiOutlineChartBar, HiOutlineMegaphone, HiOutlineComputerDesktop, HiOutlineServer, HiOutlineDocumentText, HiOutlineAcademicCap, HiOutlineQuestionMarkCircle } from "react-icons/hi2";

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
  const [crmStats, setCrmStats] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [announcementStats, setAnnouncementStats] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [backupStats, setBackupStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentStats, setAssignmentStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentStats, setStudentStats] = useState(null);
  const [doubtTicketStats, setDoubtTicketStats] = useState(null);
  const [loadingDoubtTickets, setLoadingDoubtTickets] = useState(false);
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
      const errorMessage =
        error?.details?.error?.message || error?.message || "Unknown error";
      toast.error(`Failed to load dashboard data: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load CRM stats
  const loadCrmStats = async () => {
    try {
      const response = await getAllLeads({ page: 1, pageSize: 1 });
      setCrmStats(response.stats || null);
    } catch (error) {
      console.error("Failed to load CRM stats:", error);
    }
  };

  // Load Financial Dashboard
  const loadFinancialData = async () => {
    try {
      const response = await getFinancialDashboard();
      setFinancialData(response);
    } catch (error) {
      console.error("Failed to load financial data:", error);
    }
  };

  // Load Announcement Stats
  const loadAnnouncementStats = async () => {
    try {
      const response = await getAnnouncementStats();
      setAnnouncementStats(response.stats);
    } catch (error) {
      console.error("Failed to load announcement stats:", error);
    }
  };

  // Load Session Stats
  const loadSessionStats = async () => {
    try {
      const response = await getSessionStats();
      setSessionStats(response.stats);
    } catch (error) {
      console.error("Failed to load session stats:", error);
    }
  };

  // Load Backup Stats
  const loadBackupStats = async () => {
    try {
      const response = await getBackupStats();
      setBackupStats(response.stats);
    } catch (error) {
      console.error("Failed to load backup stats:", error);
    }
  };

  // Load Assignments
  const loadAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const response = await getTeacherAssignments({ page: 1, pageSize: 5 });
      setAssignments(response.assignments || []);
      
      // Calculate stats
      const total = response.pagination?.total || 0;
      const pendingCount = response.assignments?.reduce((sum, a) => {
        return sum + (a.submissionStats?.pending || 0);
      }, 0) || 0;
      const gradedCount = response.assignments?.reduce((sum, a) => {
        return sum + (a.submissionStats?.graded || 0);
      }, 0) || 0;
      
      setAssignmentStats({
        total,
        pendingToGrade: pendingCount,
        graded: gradedCount,
      });
    } catch (error) {
      console.error("Failed to load assignments:", error);
      setAssignments([]);
      setAssignmentStats(null);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Load Students
  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await fetchTeacherStudents({ page: 1, pageSize: 5 });
      setStudents(response.students || []);
      
      // Calculate stats
      const total = response.pagination?.total || 0;
      const activeCount = response.students?.reduce((sum, s) => {
        return sum + (s.activeEnrollments || 0);
      }, 0) || 0;
      const completedCount = response.students?.reduce((sum, s) => {
        return sum + (s.completedEnrollments || 0);
      }, 0) || 0;
      
      setStudentStats({
        total,
        active: activeCount,
        completed: completedCount,
      });
    } catch (error) {
      console.error("Failed to load students:", error);
      setStudents([]);
      setStudentStats(null);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load Doubt Ticket Stats
  const loadDoubtTicketStats = async () => {
    setLoadingDoubtTickets(true);
    try {
      const response = await getDoubtTicketStats();
      setDoubtTicketStats(response.stats || null);
    } catch (error) {
      console.error("Failed to load doubt ticket stats:", error);
      setDoubtTicketStats(null);
    } finally {
      setLoadingDoubtTickets(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
    loadCrmStats();
    loadFinancialData();
    loadAnnouncementStats();
    loadSessionStats();
    loadBackupStats();
    loadAssignments();
    loadStudents();
    loadDoubtTicketStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      loadSessionStats();
      loadBackupStats();
    }, 30000);
    return () => clearInterval(interval);
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
      const stats =
        dashboardData.stats.length > 0
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
      const approvalQueues =
        dashboardData.approvals.length > 0
          ? dashboardData.approvals
          : [
              {
                id: "courses",
                title: "Courses Pending Approval",
                items: loading
                  ? []
                  : [{ title: "No pending courses", owner: "", submitted: "" }],
                cta: "Review courses",
              },
              {
                id: "ebooks",
                title: "Books & E-Books",
                items: loading
                  ? []
                  : [{ title: "No pending ebooks", owner: "", submitted: "" }],
                cta: "Moderate library",
              },
              {
                id: "jobs",
                title: "Job Posts",
                items: loading
                  ? []
                  : [{ title: "No pending jobs", owner: "", submitted: "" }],
                cta: "Moderate job board",
              },
            ];

      // Use backend data if available
      const activity =
        dashboardData.activities.length > 0
          ? dashboardData.activities
          : loading
          ? []
          : [
              {
                icon: "ℹ️",
                title: "No recent activity",
                description:
                  "Activity will appear here as users interact with the platform",
                time: "",
              },
            ];

      // Use backend data if available, otherwise show loading placeholders
      const actions =
        dashboardData.quickActions.length > 0
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

      <div className="relative z-10 p-6 md:p-8 lg:p-10">
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
                  <FaSync
                    className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Last updated{" "}
                  <span className="font-semibold text-[#F5D26A]">
                    {lastRefresh.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
                  <p className="mt-2 text-sm font-medium text-slate-200">
                    {stat.delta || ""}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-4 rounded-3xl border-2 border-red-500 bg-red-500/20 p-8 text-center">
                <p className="text-sm text-red-300">
                  Debug: headlineStats is empty or undefined
                </p>
                <p className="text-xs text-red-400 mt-2">
                  Stats count: {headlineStats?.length || 0}
                </p>
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
                      <Link
                        to={column.href || `/super-admin/approvals/${column.id}`}
                        className="mt-3 inline-block text-[11px] font-semibold text-[#F5D26A] hover:text-[#FFE28A] transition-colors">
                        {column.cta} →
                      </Link>
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
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HiOutlineUserGroup className="h-5 w-5" />
                  CRM / Lead Management
                </h2>
                <p className="text-xs text-slate-300/70">
                  Manage leads, track conversions, and assign to team
                </p>
              </div>
              <Link
                to="/super-admin/crm/leads"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            {crmStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Total Leads</p>
                  <p className="text-2xl font-semibold text-white">{crmStats.total || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">New</p>
                  <p className="text-2xl font-semibold text-blue-400">{crmStats.new || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Qualified</p>
                  <p className="text-2xl font-semibold text-purple-400">{crmStats.qualified || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Converted</p>
                  <p className="text-2xl font-semibold text-emerald-400">{crmStats.converted || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                Loading CRM stats...
              </div>
            )}
            <Link
              to="/super-admin/crm/leads"
              className="block w-full rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-center text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
              Manage Leads
            </Link>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HiOutlineChartBar className="h-5 w-5" />
                  Financial Overview
                </h2>
                <p className="text-xs text-slate-300/70">
                  Income, expenses, and financial health
                </p>
              </div>
              <Link
                to="/super-admin/financial-dashboard"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            {financialData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Income</p>
                  <p className="text-xl font-semibold text-emerald-400">
                    {financialData.summary?.currency || "AED"}{" "}
                    {financialData.summary?.totalIncome?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Expenses</p>
                  <p className="text-xl font-semibold text-red-400">
                    {financialData.summary?.currency || "AED"}{" "}
                    {financialData.summary?.totalExpenses?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Net Profit</p>
                  <p
                    className={`text-xl font-semibold ${
                      financialData.summary?.netProfit >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                    {financialData.summary?.currency || "AED"}{" "}
                    {financialData.summary?.netProfit?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Available Fund</p>
                  <p className="text-xl font-semibold text-blue-400">
                    {financialData.summary?.currency || "AED"}{" "}
                    {(
                      (financialData.summary?.totalIncome || 0) -
                      (financialData.summary?.totalExpenses || 0) -
                      (financialData.summary?.totalPayouts || 0)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                Loading financial data...
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/super-admin/expenses"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 transition">
                Manage Expenses
              </Link>
              <Link
                to="/super-admin/financial-dashboard"
                className="block rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-center text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
                View Dashboard
              </Link>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HiOutlineMegaphone className="h-5 w-5" />
                  Announcements
                </h2>
                <p className="text-xs text-slate-300/70">
                  Create and manage platform announcements
                </p>
              </div>
              <Link
                to="/super-admin/announcements"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            {announcementStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-xl font-semibold text-white">{announcementStats.total || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Published</p>
                  <p className="text-xl font-semibold text-emerald-400">{announcementStats.published || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Draft</p>
                  <p className="text-xl font-semibold text-slate-400">{announcementStats.draft || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Scheduled</p>
                  <p className="text-xl font-semibold text-blue-400">{announcementStats.scheduled || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                Loading announcement stats...
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/super-admin/announcements"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 transition">
                Manage All
              </Link>
              <Link
                to="/super-admin/announcements/create"
                className="block rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-center text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
                Create New
              </Link>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HiOutlineComputerDesktop className="h-5 w-5" />
                  Active Sessions
                </h2>
                <p className="text-xs text-slate-300/70">
                  Monitor users currently online
                </p>
              </div>
              <Link
                to="/super-admin/active-sessions"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            {sessionStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Active Now</p>
                  <p className="text-xl font-semibold text-emerald-400">{sessionStats.active || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Today</p>
                  <p className="text-xl font-semibold text-white">{sessionStats.today || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">This Week</p>
                  <p className="text-xl font-semibold text-blue-400">{sessionStats.thisWeek || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">This Month</p>
                  <p className="text-xl font-semibold text-purple-400">{sessionStats.thisMonth || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                Loading session stats...
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/super-admin/active-sessions"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 transition">
                View All
              </Link>
              <Link
                to="/super-admin/active-sessions"
                className="block rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-center text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
                Monitor
              </Link>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HiOutlineServer className="h-5 w-5" />
                  Backup System
                </h2>
                <p className="text-xs text-slate-300/70">
                  Create and manage system backups
                </p>
              </div>
              <Link
                to="/super-admin/backups"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            {backupStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-xl font-semibold text-white">{backupStats.total || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Completed</p>
                  <p className="text-xl font-semibold text-emerald-400">{backupStats.completed || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Failed</p>
                  <p className="text-xl font-semibold text-red-400">{backupStats.failed || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Total Size</p>
                  <p className="text-xl font-semibold text-blue-400">{backupStats.totalSizeFormatted || "0 Bytes"}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                Loading backup stats...
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/super-admin/backups"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 transition">
                Manage All
              </Link>
              <Link
                to="/super-admin/backups"
                className="block rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-center text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
                Create Backup
              </Link>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HiOutlineDocumentText className="h-5 w-5" />
                  Assignments
                </h2>
                <p className="text-xs text-slate-300/70">
                  Manage and grade assignments across all courses
                </p>
              </div>
              <Link
                to="/super-admin/assignments"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            {loadingAssignments ? (
              <div className="text-center py-8 text-sm text-slate-400">
                Loading assignment stats...
              </div>
            ) : assignmentStats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-xl font-semibold text-white">{assignmentStats.total || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Pending to Grade</p>
                  <p className="text-xl font-semibold text-yellow-400">{assignmentStats.pendingToGrade || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Graded</p>
                  <p className="text-xl font-semibold text-emerald-400">{assignmentStats.graded || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                No assignment data available
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/super-admin/assignments"
                className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 transition">
                View All
              </Link>
              <Link
                to="/super-admin/assignments/create"
                className="block rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-center text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
                Create New
              </Link>
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HiOutlineAcademicCap className="h-5 w-5" />
                  Student Management
                </h2>
                <p className="text-xs text-slate-300/70">
                  View and manage all students across the platform
                </p>
              </div>
              <Link
                to="/super-admin/students"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            {loadingStudents ? (
              <div className="text-center py-8 text-sm text-slate-400">
                Loading student stats...
              </div>
            ) : studentStats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Total Students</p>
                  <p className="text-xl font-semibold text-white">{studentStats.total || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Active Enrollments</p>
                  <p className="text-xl font-semibold text-blue-400">{studentStats.active || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Completed</p>
                  <p className="text-xl font-semibold text-emerald-400">{studentStats.completed || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                No student data available
              </div>
            )}
            <Link
              to="/super-admin/students"
              className="block w-full rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-center text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
              Manage Students
            </Link>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HiOutlineQuestionMarkCircle className="h-5 w-5" />
                  Doubt Tickets
                </h2>
                <p className="text-xs text-slate-300/70">
                  Manage and respond to student doubt tickets
                </p>
              </div>
              <Link
                to="/super-admin/doubt-tickets"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View all →
              </Link>
            </header>
            {loadingDoubtTickets ? (
              <div className="text-center py-8 text-sm text-slate-400">
                Loading doubt ticket stats...
              </div>
            ) : doubtTicketStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Open</p>
                  <p className="text-xl font-semibold text-blue-400">{doubtTicketStats.open || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">In Progress</p>
                  <p className="text-xl font-semibold text-yellow-400">{doubtTicketStats.inProgress || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Resolved</p>
                  <p className="text-xl font-semibold text-emerald-400">{doubtTicketStats.resolved || 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">Total</p>
                  <p className="text-xl font-semibold text-white">{doubtTicketStats.total || 0}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-400">
                No doubt tickets found
              </div>
            )}
            <Link
              to="/super-admin/doubt-tickets"
              className="block w-full rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-center text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
              Manage Doubt Tickets
            </Link>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HiOutlineServer className="h-5 w-5" />
                  System Health
                </h2>
                <p className="text-xs text-slate-300/70">
                  Monitor system performance and service status
                </p>
              </div>
              <Link
                to="/super-admin/system-health"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:text-[#FFE28A]">
                View Dashboard →
              </Link>
            </header>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center">
              <p className="text-sm text-slate-300 mb-4">
                Monitor system uptime, service status, and performance metrics
              </p>
              <Link
                to="/super-admin/system-health"
                className="inline-block rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-6 py-3 text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
                Open System Health Dashboard →
              </Link>
            </div>
          </motion.section>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
