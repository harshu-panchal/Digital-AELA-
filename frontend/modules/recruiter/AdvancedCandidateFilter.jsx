import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineDocumentText,
  HiOutlineGlobeAlt,
  HiOutlineCalendar,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  searchCandidates,
  fetchRecruiterJobs,
} from "../../../src/services/api/recruiter";

const AdvancedCandidateFilter = () => {
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    jobId: "",
    stage: "",
    minDate: "",
    maxDate: "",
    searchQuery: "",
    hasResume: false,
    hasPortfolio: false,
    sortBy: "submittedAt",
    sortOrder: "desc",
    page: 1,
    pageSize: 20,
  });

  const loadJobs = useCallback(async () => {
    try {
      const result = await fetchRecruiterJobs();
      console.log("Jobs data received:", result);
      const jobsData = result?.data || result;
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setJobs([]);
    }
  }, []);

  const loadApplicants = useCallback(async () => {
    try {
      setLoading(true);
      const result = await searchCandidates(filters);
      console.log("Candidates data received:", result);
      const candidatesData = result?.data || result;
      setApplicants(candidatesData?.applicants || []);
      setPagination(candidatesData?.pagination || null);
    } catch (err) {
      console.error("Error loading candidates:", err);
      toast.error(err.message || "Failed to load candidates");
      setApplicants([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const stageOptions = [
    { value: "", label: "All Stages" },
    { value: "screening", label: "Screening" },
    { value: "assessment", label: "Assessment" },
    { value: "interview", label: "Interview" },
    { value: "offer", label: "Offer" },
    { value: "hired", label: "Hired" },
    { value: "rejected", label: "Rejected" },
  ];

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setFilters({
      jobId: "",
      stage: "",
      minDate: "",
      maxDate: "",
      searchQuery: "",
      hasResume: false,
      hasPortfolio: false,
      sortBy: "submittedAt",
      sortOrder: "desc",
      page: 1,
      pageSize: 20,
    });
  };

  return (
    <div className="w-full text-white space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Advanced Candidate Search</h1>
          <p className="text-gray-400">Find candidates with advanced filters</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiOutlineFunnel className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Filters</h3>
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Job</label>
              <select
                value={filters.jobId}
                onChange={(e) => handleFilterChange("jobId", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              >
                <option value="">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job._id || job.id} value={job._id || job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Stage</label>
              <select
                value={filters.stage}
                onChange={(e) => handleFilterChange("stage", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              >
                {stageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Search</label>
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
                  placeholder="Name or headline..."
                  className="w-full pl-10 rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              >
                <option value="submittedAt">Submitted Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="candidateName">Name</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">From Date</label>
              <input
                type="date"
                value={filters.minDate}
                onChange={(e) => handleFilterChange("minDate", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">To Date</label>
              <input
                type="date"
                value={filters.maxDate}
                onChange={(e) => handleFilterChange("maxDate", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasResume}
                  onChange={(e) => handleFilterChange("hasResume", e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/60 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <HiOutlineDocumentText className="w-4 h-4" />
                  Has Resume
                </span>
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasPortfolio}
                  onChange={(e) => handleFilterChange("hasPortfolio", e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/60 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <HiOutlineGlobeAlt className="w-4 h-4" />
                  Has Portfolio
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Results {pagination && `(${pagination.total})`}
            </h3>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : applicants.length > 0 ? (
            <>
              <div className="space-y-3">
                {applicants.map((app) => (
                  <Link
                    key={app.applicationId}
                    to={`/recruiter/jobs/${app.job?.id || app.job?._id}/applicants/${app.applicationId}`}
                    className="block p-4 rounded-xl border border-white/5 bg-black/40 hover:border-white/10 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-semibold">{app.candidateName}</div>
                        <div className="text-sm text-gray-400 mt-1">{app.candidateHeadline}</div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-xs text-gray-500">{app.job?.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {app.resumeUrl && (
                          <HiOutlineDocumentText className="w-5 h-5 text-blue-400" title="Has Resume" />
                        )}
                        {app.portfolioUrl && (
                          <HiOutlineGlobeAlt className="w-5 h-5 text-emerald-400" title="Has Portfolio" />
                        )}
                        <div className="px-3 py-1 rounded-lg bg-white/5 text-white text-sm capitalize">
                          {app.currentStage}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-black/60 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/20"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-black/60 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/20"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 py-12">No candidates found</div>
          )}
        </div>
      </div>
  );
};

export default AdvancedCandidateFilter;

