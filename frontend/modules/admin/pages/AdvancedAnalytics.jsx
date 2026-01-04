import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaSpinner,
  FaDownload,
  FaChartLine,
  FaUsers,
  FaGraduationCap,
  FaDollarSign,
  FaBriefcase,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  fetchOverviewAnalytics,
  fetchUserAnalytics,
  fetchCourseAnalytics,
  fetchRevenueAnalytics,
  fetchJobAnalytics,
} from "../../../src/services/api/superAdmin";
import {
  LazyLine,
  LazyBar,
  LazyPie,
  LazyDoughnut,
} from "../../../src/components/LazyChart";
import { formatCurrency } from "../../../src/utils/currencyUtils";

const AdvancedAnalytics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [groupBy, setGroupBy] = useState("day");
  const [analyticsData, setAnalyticsData] = useState({
    overview: null,
    users: null,
    courses: null,
    revenue: null,
    jobs: null,
  });

  useEffect(() => {
    loadAnalytics();
  }, [activeTab, dateRange, groupBy]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy: activeTab !== "overview" ? groupBy : undefined,
      };

      const [overview, users, courses, revenue, jobs] = await Promise.all([
        fetchOverviewAnalytics(params),
        fetchUserAnalytics(params),
        fetchCourseAnalytics(params),
        fetchRevenueAnalytics(params),
        fetchJobAnalytics(params),
      ]);

      setAnalyticsData({
        overview,
        users,
        courses,
        revenue,
        jobs,
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format = "json") => {
    try {
      const data = analyticsData[activeTab];
      if (!data) {
        toast.error("No data to export");
        return;
      }

      if (format === "json") {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${activeTab}-${dateRange.startDate}-${dateRange.endDate}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Data exported as JSON");
      } else if (format === "csv") {
        // Convert to CSV (simplified - you might want a more robust CSV converter)
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${activeTab}-${dateRange.startDate}-${dateRange.endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Data exported as CSV");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    }
  };

  const convertToCSV = (data) => {
    // Simple CSV conversion - you might want to use a library for complex data
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {}).join(",");
      const rows = data.map((row) => Object.values(row).join(","));
      return [headers, ...rows].join("\n");
    }
    return JSON.stringify(data);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FaChartLine },
    { id: "users", label: "Users", icon: FaUsers },
    { id: "courses", label: "Courses", icon: FaGraduationCap },
    { id: "revenue", label: "Revenue", icon: FaDollarSign },
    { id: "jobs", label: "Jobs", icon: FaBriefcase },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#040404] to-black p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-display">
                Advanced Analytics
              </h1>
              <p className="mt-2 text-gray-400">
                Comprehensive platform insights and metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportData("json")}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                <FaDownload className="h-4 w-4" />
                Export JSON
              </button>
              <button
                onClick={() => exportData("csv")}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                <FaDownload className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Date Range & Group By Controls */}
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-300">
                Start Date:
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-300">
                End Date:
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            {activeTab !== "overview" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-300">
                  Group By:
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none">
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            )}
            <button
              onClick={loadAnalytics}
              className="ml-auto flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#F5D26A]">
              <FaSpinner
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-[#D4AF37] text-[#D4AF37]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FaSpinner className="mx-auto h-8 w-8 animate-spin text-[#D4AF37]" />
              <p className="mt-4 text-gray-400">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "overview" && (
              <OverviewTab data={analyticsData.overview} />
            )}
            {activeTab === "users" && <UsersTab data={analyticsData.users} />}
            {activeTab === "courses" && (
              <CoursesTab data={analyticsData.courses} />
            )}
            {activeTab === "revenue" && (
              <RevenueTab data={analyticsData.revenue} />
            )}
            {activeTab === "jobs" && <JobsTab data={analyticsData.jobs} />}
          </div>
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data }) => {
  if (!data) return <div className="text-gray-400">No data available</div>;

  const overviewCards = [
    {
      label: "Total Users",
      value: data.overview?.totalUsers || 0,
      icon: FaUsers,
    },
    {
      label: "Total Courses",
      value: data.overview?.totalCourses || 0,
      icon: FaGraduationCap,
    },
    {
      label: "Total Jobs",
      value: data.overview?.totalJobs || 0,
      icon: FaBriefcase,
    },
    {
      label: "Total Enrollments",
      value: data.overview?.totalEnrollments || 0,
      icon: FaChartLine,
    },
    {
      label: "Active Users",
      value: data.overview?.activeUsers || 0,
      icon: FaUsers,
    },
    {
      label: "Total Applications",
      value: data.overview?.totalApplications || 0,
      icon: FaBriefcase,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-[#D4AF37]/20 p-3">
                  <Icon className="h-6 w-6 text-[#D4AF37]" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Growth Metrics */}
      {data.growth && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Growth Metrics
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-400">Users Growth</p>
              <p
                className={`mt-1 text-xl font-bold ${
                  data.growth.users >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                {data.growth.users >= 0 ? "+" : ""}
                {data.growth.users.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Courses Growth</p>
              <p
                className={`mt-1 text-xl font-bold ${
                  data.growth.courses >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                {data.growth.courses >= 0 ? "+" : ""}
                {data.growth.courses.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Enrollments Growth</p>
              <p
                className={`mt-1 text-xl font-bold ${
                  data.growth.enrollments >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}>
                {data.growth.enrollments >= 0 ? "+" : ""}
                {data.growth.enrollments.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Roles Breakdown */}
      {data.breakdown?.userRoles && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            User Roles Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(data.breakdown.userRoles).map(([role, count]) => (
              <div key={role} className="text-center">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="mt-1 text-sm text-gray-400 capitalize">{role}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ data }) => {
  if (!data) return <div className="text-gray-400">No data available</div>;

  const userGrowthData = {
    labels: data.growth?.map((item) => item.date) || [],
    datasets: [
      {
        label: "New Users",
        data: data.growth?.map((item) => item.count) || [],
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const rolesData = {
    labels: data.roles?.map((item) => item.role) || [],
    datasets: [
      {
        data: data.roles?.map((item) => item.count) || [],
        backgroundColor: [
          "rgba(212, 175, 55, 0.8)",
          "rgba(212, 175, 55, 0.6)",
          "rgba(212, 175, 55, 0.4)",
          "rgba(212, 175, 55, 0.2)",
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Active Users</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.status?.active || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Inactive Users</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.status?.inactive || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Engaged Users</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.engagement?.engaged || 0}
          </p>
        </div>
      </div>

      {/* User Growth Chart */}
      {data.growth && data.growth.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">User Growth</h3>
          <div className="h-64">
            <LazyLine
              data={userGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, labels: { color: "#fff" } },
                },
                scales: {
                  x: {
                    ticks: { color: "#9ca3af" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                  y: {
                    ticks: { color: "#9ca3af" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Roles Breakdown */}
      {data.roles && data.roles.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            User Roles Distribution
          </h3>
          <div className="h-64">
            <LazyDoughnut
              data={rolesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: "right",
                    labels: { color: "#fff" },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Top Active Users */}
      {data.topActive && data.topActive.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Top Active Users
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topActive.map((user) => (
                  <tr key={user.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white">{user.name}</td>
                    <td className="px-4 py-3 text-gray-400">{user.email}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize">
                      {user.role}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Courses Tab Component
const CoursesTab = ({ data }) => {
  if (!data) return <div className="text-gray-400">No data available</div>;

  const courseGrowthData = {
    labels: data.growth?.map((item) => item.date) || [],
    datasets: [
      {
        label: "Courses Created",
        data: data.growth?.map((item) => item.count) || [],
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const enrollmentStatusData = {
    labels: ["Active", "Completed", "Paused"],
    datasets: [
      {
        data: [
          data.enrollments?.active || 0,
          data.enrollments?.completed || 0,
          data.enrollments?.paused || 0,
        ],
        backgroundColor: [
          "rgba(212, 175, 55, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(156, 163, 175, 0.8)",
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Total Enrollments</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.enrollments?.total || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Active Enrollments</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.enrollments?.active || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.enrollments?.completed || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Completion Rate</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.completion?.rate?.toFixed(1) || 0}%
          </p>
        </div>
      </div>

      {/* Course Growth Chart */}
      {data.growth && data.growth.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Course Creation Growth
          </h3>
          <div className="h-64">
            <LazyLine
              data={courseGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, labels: { color: "#fff" } },
                },
                scales: {
                  x: {
                    ticks: { color: "#9ca3af" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                  y: {
                    ticks: { color: "#9ca3af" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Enrollment Status */}
      {data.enrollments && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Enrollment Status
          </h3>
          <div className="h-64">
            <LazyDoughnut
              data={enrollmentStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: "right",
                    labels: { color: "#fff" },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Top Courses */}
      {data.topCourses && data.topCourses.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Top Courses by Enrollment
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Enrollments
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topCourses.map((course) => (
                  <tr key={course.courseId} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">
                          {course.title}
                        </p>
                        <p className="text-sm text-gray-400">
                          {course.description?.substring(0, 50)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">
                      {course.enrollmentCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          course.status === "published"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                        {course.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews Statistics */}
      {data.reviews && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Course Reviews
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-400">Total Reviews</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {data.reviews.total}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Average Rating</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {data.reviews.averageRating?.toFixed(1) || 0} / 5
              </p>
            </div>
          </div>
          {data.reviews.distribution && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-gray-300">
                Rating Distribution
              </p>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="mb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{rating} stars</span>
                    <span className="text-white">
                      {data.reviews.distribution[rating] || 0}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="h-full bg-[#D4AF37]"
                      style={{
                        width: `${
                          ((data.reviews.distribution[rating] || 0) /
                            data.reviews.total) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Revenue Tab Component
const RevenueTab = ({ data }) => {
  if (!data) return <div className="text-gray-400">No data available</div>;

  const revenueTrendData = {
    labels: data.trend?.map((item) => item.date) || [],
    datasets: [
      {
        label: "Revenue",
        data: data.trend?.map((item) => item.amount) || [],
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatCurrency(data.total || 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Growth</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              data.growth >= 0 ? "text-green-400" : "text-red-400"
            }`}>
            {data.growth >= 0 ? "+" : ""}
            {data.growth?.toFixed(1) || 0}%
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Period</p>
          <p className="mt-2 text-sm text-white">
            {data.period?.start
              ? new Date(data.period.start).toLocaleDateString()
              : ""}{" "}
            -{" "}
            {data.period?.end
              ? new Date(data.period.end).toLocaleDateString()
              : ""}
          </p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      {data.trend && data.trend.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Revenue Trend
          </h3>
          <div className="h-64">
            <LazyLine
              data={revenueTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, labels: { color: "#fff" } },
                },
                scales: {
                  x: {
                    ticks: { color: "#9ca3af" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                  y: {
                    ticks: {
                      color: "#9ca3af",
                      callback: function (value) {
                        return formatCurrency(value);
                      },
                    },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Revenue by Currency */}
      {data.byCurrency && Object.keys(data.byCurrency).length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Revenue by Currency
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(data.byCurrency).map(([currency, amount]) => (
              <div key={currency} className="text-center">
                <p className="text-2xl font-bold text-white">{currency}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Revenue Courses */}
      {data.topCourses && data.topCourses.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Top Revenue Courses
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Enrollments
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topCourses.map((course) => (
                  <tr key={course.courseId} className="border-b border-white/5">
                    <td className="px-4 py-3 font-semibold text-white">
                      {course.title}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {formatCurrency(course.revenue)}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {course.enrollments}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Jobs Tab Component
const JobsTab = ({ data }) => {
  if (!data) return <div className="text-gray-400">No data available</div>;

  const jobGrowthData = {
    labels: data.growth?.map((item) => item.date) || [],
    datasets: [
      {
        label: "Jobs Posted",
        data: data.growth?.map((item) => item.count) || [],
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const applicationStageData = {
    labels: data.applications?.map((item) => item.stage) || [],
    datasets: [
      {
        label: "Applications",
        data: data.applications?.map((item) => item.count) || [],
        backgroundColor: "rgba(212, 175, 55, 0.8)",
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Total Jobs</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.status?.reduce((sum, item) => sum + item.count, 0) || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Total Applications</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.conversion?.totalApplications || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-gray-400">Conversion Rate</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {data.conversion?.rate?.toFixed(1) || 0}%
          </p>
        </div>
      </div>

      {/* Job Growth Chart */}
      {data.growth && data.growth.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Job Posting Growth
          </h3>
          <div className="h-64">
            <LazyLine
              data={jobGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, labels: { color: "#fff" } },
                },
                scales: {
                  x: {
                    ticks: { color: "#9ca3af" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                  y: {
                    ticks: { color: "#9ca3af" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Application Stages */}
      {data.applications && data.applications.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Applications by Stage
          </h3>
          <div className="h-64">
            <LazyBar
              data={applicationStageData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: {
                    ticks: { color: "#9ca3af" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                  y: {
                    ticks: { color: "#9ca3af" },
                    grid: { color: "rgba(255,255,255,0.1)" },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Employment Types */}
      {data.employmentTypes && data.employmentTypes.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Employment Type Distribution
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {data.employmentTypes.map((type) => (
              <div key={type.type} className="text-center">
                <p className="text-2xl font-bold text-white">{type.count}</p>
                <p className="mt-1 text-sm text-gray-400 capitalize">
                  {type.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Jobs */}
      {data.topJobs && data.topJobs.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Top Jobs by Applications
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Job Title
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Applications
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topJobs.map((job) => (
                  <tr key={job.jobId} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">{job.title}</p>
                        <p className="text-sm text-gray-400">{job.location}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">{job.company}</td>
                    <td className="px-4 py-3 text-white">
                      {job.applicationCount}
                    </td>
                    <td className="px-4 py-3 text-gray-400 capitalize">
                      {job.employmentType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
