import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiArrowDownTray,
  HiOutlineCalendar,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { fetchPerformanceReport } from "../../../src/services/api/recruiter.js";

const PerformanceReports = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchPerformanceReport({ startDate, endDate, format: "json" });
      setData(result);
    } catch (err) {
      toast.error("Failed to load performance report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCSV = async () => {
    try {
      const result = await fetchPerformanceReport({ startDate, endDate, format: "csv" });
      const blob = new Blob([result], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recruiter-performance-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (err) {
      toast.error("Failed to export report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading report...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#010101] text-white p-6">
        <div className="text-center text-gray-400 py-12">No report data available</div>
      </div>
    );
  }

  const { summary, applications, performance } = data;

  return (
    <div className="w-full text-white space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Performance Reports</h1>
            <p className="text-gray-400">Comprehensive recruitment performance analysis</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/60 hover:border-white/20 transition"
          >
            <HiArrowDownTray className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Date Range */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <HiOutlineCalendar className="w-5 h-5 text-white" />
              <span className="text-gray-400">Date Range</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Total Jobs</div>
            <div className="text-3xl font-bold text-white">{summary.totalJobs}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Active Jobs</div>
            <div className="text-3xl font-bold text-white">{summary.activeJobs}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Total Applications</div>
            <div className="text-3xl font-bold text-white">{summary.totalApplications}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Total Views</div>
            <div className="text-3xl font-bold text-white">{summary.totalViews}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Total Saves</div>
            <div className="text-3xl font-bold text-white">{summary.totalSaves}</div>
          </div>
        </div>

        {/* Applications by Status */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Applications by Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(applications.byStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 rounded-xl border border-white/5 bg-black/40">
                <div className="text-2xl font-bold text-white mb-1">{count}</div>
                <div className="text-sm text-gray-400 capitalize">{status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineChartBar className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-xl font-semibold text-white">Performance Metrics</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Conversion Rate</div>
                <div className="text-3xl font-bold text-white">{performance.conversionRate}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Average Time to Hire</div>
                <div className="text-3xl font-bold text-white">{performance.avgTimeToHire} days</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Applications by Job</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {applications.byJob && applications.byJob.length > 0 ? (
                applications.byJob.map((job) => (
                  <div
                    key={job.jobId}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40"
                  >
                    <div>
                      <div className="text-white font-semibold">{job.jobTitle}</div>
                      <div className="text-sm text-gray-400">{job.company}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{job.applications}</div>
                      <div className="text-xs text-gray-400">{job.hired} hired</div>
                      <div className="text-xs text-[#D4AF37]">{job.conversionRate}% conversion</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">No job data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReports;

