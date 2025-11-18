import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineArrowLeft,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineArrowTrendingUp,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { fetchJobApplicationAnalytics, fetchRecruiterJobs } from "../../src/services/api/recruiter.js";
import { Line, Bar } from "react-chartjs-2";

const JobApplicationAnalytics = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("30");
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);

  const loadJobs = useCallback(async () => {
    try {
      const result = await fetchRecruiterJobs();
      setJobs(result?.data || []);
      if (jobId) {
        const job = result?.data?.find((j) => j._id === jobId || j.id === jobId);
        setSelectedJob(job);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  }, [jobId]);

  const loadAnalytics = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const result = await fetchJobApplicationAnalytics(jobId, { period });
      setData(result);
    } catch (err) {
      toast.error("Failed to load job analytics");
    } finally {
      setLoading(false);
    }
  }, [jobId, period]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

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

  if (!data) {
    return (
      <div className="w-full text-white">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="text-center text-gray-400 py-12">No analytics data available</div>
      </div>
    );
  }

  const { job, metrics, statusBreakdown, applicationTrend } = data;

  const trendChartData = {
    labels: applicationTrend.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }),
    datasets: [
      {
        label: "Applications",
        data: applicationTrend.map((item) => item.applications),
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const statusChartData = {
    labels: Object.keys(statusBreakdown).map(
      (key) => key.charAt(0).toUpperCase() + key.slice(1)
    ),
    datasets: [
      {
        label: "Applications",
        data: Object.values(statusBreakdown),
        backgroundColor: "rgba(212, 175, 55, 0.8)",
        borderColor: "#D4AF37",
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
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
      },
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
      },
    },
  };

  return (
    <div className="w-full text-white space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl border border-white/10 bg-black/60 hover:border-white/20 transition"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Job Analytics</h1>
              <p className="text-gray-400">{job?.title || "Job Application Analytics"}</p>
            </div>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Job Title</div>
              <div className="text-white font-semibold">{job?.title}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Company</div>
              <div className="text-white font-semibold">{job?.company}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Views</div>
              <div className="text-white font-semibold">{job?.views || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="text-white font-semibold capitalize">{job?.status}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineUserGroup className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Total Applications</span>
            </div>
            <div className="text-3xl font-bold text-white">{metrics.totalApplications}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineArrowTrendingUp className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-gray-400">Conversion Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">{metrics.conversionRate}%</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineClock className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Avg Time in Stages</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {Object.values(metrics.avgTimeInStages || {}).reduce((a, b) => a + b, 0) / Object.keys(metrics.avgTimeInStages || {}).length || 0} days
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Period Applications</div>
            <div className="text-3xl font-bold text-white">{metrics.periodApplications}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Application Trend</h3>
            <div className="h-64">
              <Line data={trendChartData} options={chartOptions} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Status Breakdown</h3>
            <div className="h-64">
              <Bar data={statusChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {metrics.avgTimeInStages && Object.keys(metrics.avgTimeInStages).length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Average Time in Stages</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(metrics.avgTimeInStages).map(([stage, days]) => (
                <div key={stage} className="text-center p-4 rounded-xl border border-white/5 bg-black/40">
                  <div className="text-2xl font-bold text-white mb-1">{days}</div>
                  <div className="text-sm text-gray-400 capitalize">{stage}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
  );
};

export default JobApplicationAnalytics;

