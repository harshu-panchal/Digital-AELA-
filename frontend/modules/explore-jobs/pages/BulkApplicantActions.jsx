import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineTrash,
  HiOutlinePencilSquare,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import {
  performBulkApplicantAction,
  searchCandidates,
  fetchRecruiterJobs,
} from "../../../src/services/api/recruiter";

const BulkApplicantActions = () => {
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [action, setAction] = useState("");
  const [actionData, setActionData] = useState({});
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    jobId: "",
    stage: "",
    searchQuery: "",
  });

  const loadJobs = useCallback(async () => {
    try {
      const result = await fetchRecruiterJobs();
      setJobs(result?.data || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load jobs:", err);
    }
  }, []);

  const loadApplicants = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: 1,
        pageSize: 100,
      };
      const result = await searchCandidates(params);
      setApplicants(result?.applicants || []);
    } catch (err) {
      toast.error("Failed to load applicants");
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

  const handleSelectAll = () => {
    if (selectedIds.length === applicants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applicants.map((app) => app.applicationId));
    }
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one applicant");
      return;
    }

    if (!action) {
      toast.error("Please select an action");
      return;
    }

    try {
      setLoading(true);
      await performBulkApplicantAction(selectedIds, action, actionData);
      toast.success(`Successfully performed ${action} on ${selectedIds.length} applicant(s)`);
      setSelectedIds([]);
      setAction("");
      setActionData({});
      loadApplicants();
    } catch (err) {
      toast.error(err.message || "Failed to perform bulk action");
    } finally {
      setLoading(false);
    }
  };

  const actionOptions = [
    { value: "updateStage", label: "Update Stage", icon: HiOutlineArrowPath },
    { value: "addNote", label: "Add Note", icon: HiOutlinePencilSquare },
    { value: "reject", label: "Reject", icon: HiOutlineXCircle },
    { value: "moveToScreening", label: "Move to Screening", icon: HiOutlineCheckCircle },
    { value: "delete", label: "Delete", icon: HiOutlineTrash },
  ];

  const stageOptions = [
    { value: "screening", label: "Screening" },
    { value: "assessment", label: "Assessment" },
    { value: "interview", label: "Interview" },
    { value: "offer", label: "Offer" },
    { value: "hired", label: "Hired" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-[#010101] text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bulk Applicant Actions</h1>
          <p className="text-gray-400">Manage multiple applicants at once</p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Job</label>
              <select
                value={filters.jobId}
                onChange={(e) => setFilters({ ...filters, jobId: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              >
                <option value="">All Stages</option>
                {stageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Search</label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                placeholder="Search by name..."
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bulk Action Panel */}
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-white font-semibold">
                  {selectedIds.length} applicant(s) selected
                </div>
                <div className="text-sm text-gray-400">Choose an action to perform</div>
              </div>
              <button
                onClick={() => setSelectedIds([])}
                className="text-gray-400 hover:text-white"
              >
                Clear Selection
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Action</label>
                <select
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value);
                    setActionData({});
                  }}
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                >
                  <option value="">Select action...</option>
                  {actionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {action === "updateStage" && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">New Stage</label>
                  <select
                    value={actionData.stage || ""}
                    onChange={(e) => setActionData({ stage: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  >
                    <option value="">Select stage...</option>
                    {stageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {action === "addNote" && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Note</label>
                  <input
                    type="text"
                    value={actionData.note || ""}
                    onChange={(e) => setActionData({ note: e.target.value })}
                    placeholder="Enter note..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleBulkAction}
              disabled={loading || !action || (action === "updateStage" && !actionData.stage) || (action === "addNote" && !actionData.note)}
              className="mt-4 w-full px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#D4AF37]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Processing..." : `Apply ${actionOptions.find((a) => a.value === action)?.label || "Action"}`}
            </button>
          </motion.div>
        )}

        {/* Applicants List */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Applicants</h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-gray-400 hover:text-white"
            >
              {selectedIds.length === applicants.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : applicants.length > 0 ? (
            <div className="space-y-2">
              {applicants.map((app) => (
                <div
                  key={app.applicationId}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    selectedIds.includes(app.applicationId)
                      ? "border-[#D4AF37] bg-[#D4AF37]/10"
                      : "border-white/5 bg-black/40"
                  } hover:border-white/10 transition cursor-pointer`}
                  onClick={() => handleSelect(app.applicationId)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(app.applicationId)}
                    onChange={() => handleSelect(app.applicationId)}
                    className="w-5 h-5 rounded border-white/20 bg-black/60 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <div className="flex-1">
                    <div className="text-white font-semibold">{app.candidateName}</div>
                    <div className="text-sm text-gray-400">{app.candidateHeadline}</div>
                    <div className="text-xs text-gray-500 mt-1">{app.job?.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="px-3 py-1 rounded-lg bg-white/5 text-white text-sm capitalize">
                      {app.currentStage}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">No applicants found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkApplicantActions;

