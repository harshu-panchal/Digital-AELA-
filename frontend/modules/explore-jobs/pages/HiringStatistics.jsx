import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { fetchHiringStatistics } from "../../../src/services/api/recruiter.js";
import { Bar } from "react-chartjs-2";

const HiringStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("90");

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchHiringStatistics({ period });
      setData(result);
    } catch (err) {
      toast.error("Failed to load hiring statistics");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading statistics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#010101] text-white p-6">
        <div className="text-center text-gray-400 py-12">No statistics available</div>
      </div>
    );
  }

  const { qualityMetrics, hiringByMonth, hiringByJob, timeToHireDistribution } = data;

  const monthChartData = {
    labels: Object.keys(hiringByMonth).sort().map((key) => {
      const [year, month] = key.split("-");
      return new Date(year, parseInt(month) - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }),
    datasets: [
      {
        label: "Hires",
        data: Object.keys(hiringByMonth).sort().map((key) => hiringByMonth[key]),
        backgroundColor: "rgba(212, 175, 55, 0.8)",
        borderColor: "#D4AF37",
        borderWidth: 2,
      },
    ],
  };

  const distributionChartData = {
    labels: Object.keys(timeToHireDistribution),
    datasets: [
      {
        label: "Hires",
        data: Object.values(timeToHireDistribution),
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(251, 191, 36, 1)",
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
    <div className="w-full mt-[100px] text-white space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Hiring Statistics</h1>
            <p className="text-gray-400">Track your hiring performance and quality metrics</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Quality Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineUserGroup className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Total Hired</span>
            </div>
            <div className="text-3xl font-bold text-white">{qualityMetrics.totalHired}</div>
            <div className="text-xs text-gray-500 mt-1">{qualityMetrics.periodHired} this period</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineClock className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-gray-400">Avg Time to Hire</span>
            </div>
            <div className="text-3xl font-bold text-white">{qualityMetrics.avgTimeToHire}</div>
            <div className="text-xs text-gray-500 mt-1">days</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineChartBar className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Median Time</span>
            </div>
            <div className="text-3xl font-bold text-white">{qualityMetrics.medianTimeToHire}</div>
            <div className="text-xs text-gray-500 mt-1">days</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Fastest Hire</div>
            <div className="text-3xl font-bold text-white">{qualityMetrics.fastestHire}</div>
            <div className="text-xs text-gray-500 mt-1">days</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Hiring by Month</h3>
            <div className="h-64">
              <Bar data={monthChartData} options={chartOptions} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Time to Hire Distribution</h3>
            <div className="h-64">
              <Bar data={distributionChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Hiring by Job */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Hiring by Job</h3>
          <div className="space-y-3">
            {hiringByJob.length > 0 ? (
              hiringByJob.map((job, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40"
                >
                  <div>
                    <div className="text-white font-semibold">{job.jobTitle}</div>
                    <div className="text-sm text-gray-400">{job.jobCompany}</div>
                  </div>
                  <div className="text-2xl font-bold text-[#D4AF37]">{job.count}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">No hiring data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiringStatistics;

