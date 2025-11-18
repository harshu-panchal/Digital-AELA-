import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineChartBar,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineEye,
  HiOutlineBookmark,
  HiOutlineArrowTrendingUp,
  HiOutlineClock,
  HiOutlineDocumentDownload,
  HiOutlineCalendar,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import {
  fetchRecruiterAnalyticsDashboard,
} from "../../../src/services/api/recruiter";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const RecruiterAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("30");
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchRecruiterAnalyticsDashboard({ period });
      // eslint-disable-next-line no-console
      console.log("Analytics data received:", result);
      
      // Handle if result is wrapped in data property
      const analyticsData = result?.data || result;
      
      if (!analyticsData) {
        throw new Error("No data received from server");
      }
      
      setData(analyticsData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading analytics:", err);
      const errorMessage = err.message || "Failed to load analytics dashboard";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="w-full text-white flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Loading analytics...</div>
          <div className="text-gray-400 text-sm">Please wait</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full text-white">
        <div>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-300">{error || "No data available"}</p>
            <button
              onClick={() => loadAnalytics()}
              className="mt-4 px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#D4AF37]/90 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { overview = {}, statusBreakdown = {}, applicationTrend = [], topPerformingJobs = [] } = data;

  // Show empty state if no jobs
  if (overview.totalJobs === 0 && !loading) {
    return (
      <div className="w-full text-white">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400 mb-6">Track your recruitment performance</p>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-12 text-center">
            <HiOutlineChartBar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Analytics Data Yet</h2>
            <p className="text-gray-400 mb-6">
              Start by posting job openings to see analytics and metrics here.
            </p>
            <Link
              to="/explore-jobs/recruiter-dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#D4AF37]/90 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Chart data for application trend
  const trendChartData = {
    labels: (applicationTrend || []).length > 0
      ? applicationTrend.map((item) => {
          const date = new Date(item.date);
          return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        })
      : ["No data"],
    datasets: [
      {
        label: "Applications",
        data: (applicationTrend || []).length > 0
          ? applicationTrend.map((item) => item.applications || item.count || 0)
          : [0],
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // Chart data for status breakdown
  const statusChartData = {
    labels: Object.keys(statusBreakdown).map(
      (key) => key.charAt(0).toUpperCase() + key.slice(1)
    ),
    datasets: [
      {
        data: Object.values(statusBreakdown),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#9ca3af",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
      },
      x: {
        ticks: {
          color: "#9ca3af",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
      },
    },
  };

  return (
    <div className="w-full text-white space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Track your recruitment performance</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                <HiOutlineBriefcase className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{overview.totalJobs || 0}</div>
            <div className="text-sm text-gray-400">Total Jobs</div>
            <div className="text-xs text-gray-500 mt-2">{overview.activeJobs || 0} active</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                <HiOutlineUserGroup className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{overview.totalApplications || 0}</div>
            <div className="text-sm text-gray-400">Total Applications</div>
            <div className="text-xs text-gray-500 mt-2">{overview.periodApplications || 0} this period</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
                <HiOutlineArrowTrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{overview.conversionRate || 0}%</div>
            <div className="text-sm text-gray-400">Conversion Rate</div>
            <div className="text-xs text-gray-500 mt-2">{statusBreakdown.hired || 0} hired</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                <HiOutlineClock className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{overview.avgTimeToHire || 0}</div>
            <div className="text-sm text-gray-400">Avg Days to Hire</div>
            <div className="text-xs text-gray-500 mt-2">Time to fill</div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Application Trend</h3>
            <div className="h-64">
              <Line data={trendChartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Status Breakdown</h3>
            <div className="h-64">
              <Doughnut data={statusChartData} options={chartOptions} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(statusBreakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 capitalize">{key}</span>
                  <span className="text-white font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Performing Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Top Performing Jobs</h3>
          <div className="space-y-3">
            {topPerformingJobs.length > 0 ? (
              topPerformingJobs.map((job, index) => (
                <Link
                  key={job.jobId}
                  to={`/explore-jobs/recruiter/analytics/jobs/${job.jobId}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40 hover:border-white/10 transition cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{job.title}</div>
                        <div className="text-sm text-gray-400">{job.company}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-white font-semibold">{job.applications}</div>
                        <div className="text-xs text-gray-400">Applications</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{job.conversionRate}%</div>
                        <div className="text-xs text-gray-400">Conversion</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{job.hired}</div>
                        <div className="text-xs text-gray-400">Hired</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">No jobs data available</div>
            )}
          </div>
        </motion.div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineEye className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Total Views</span>
            </div>
            <div className="text-2xl font-bold text-white">{overview.totalViews || 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineBookmark className="w-5 h-5 text-emerald-400" />
              <span className="text-gray-400">Total Saves</span>
            </div>
            <div className="text-2xl font-bold text-white">{overview.totalSaves || 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineArrowTrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Interview to Offer</span>
            </div>
            <div className="text-2xl font-bold text-white">{overview.interviewToOfferRate || 0}%</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/explore-jobs/recruiter/pipeline"
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6 hover:border-white/20 transition"
          >
            <div className="text-white font-semibold mb-2">Candidate Pipeline</div>
            <div className="text-sm text-gray-400">View pipeline metrics</div>
          </Link>
          <Link
            to="/explore-jobs/recruiter/hiring-stats"
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6 hover:border-white/20 transition"
          >
            <div className="text-white font-semibold mb-2">Hiring Statistics</div>
            <div className="text-sm text-gray-400">Track hiring performance</div>
          </Link>
          <Link
            to="/explore-jobs/recruiter/performance-reports"
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6 hover:border-white/20 transition"
          >
            <div className="text-white font-semibold mb-2">Performance Reports</div>
            <div className="text-sm text-gray-400">Export detailed reports</div>
          </Link>
          <Link
            to="/explore-jobs/recruiter/interviews"
            className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6 hover:border-white/20 transition"
          >
            <div className="text-white font-semibold mb-2">Interview Schedule</div>
            <div className="text-sm text-gray-400">Manage interviews</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecruiterAnalyticsDashboard;

