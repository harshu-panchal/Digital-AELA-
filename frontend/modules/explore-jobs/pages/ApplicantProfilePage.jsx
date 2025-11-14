import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineGlobeAlt,
  HiOutlineMail,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineBriefcase,
  HiOutlinePencilSquare,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { fetchApplicantDetails, updateJobApplicantStage } from "../../../src/services/api/recruiter";

const ApplicantProfilePage = () => {
  const { jobId, applicationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [updatingStage, setUpdatingStage] = useState(false);

  const stageOptions = [
    { value: "screening", label: "Screening" },
    { value: "assessment", label: "Assessment" },
    { value: "interview", label: "Interview" },
    { value: "offer", label: "Offer" },
    { value: "hired", label: "Hired" },
    { value: "rejected", label: "Rejected" },
  ];

  useEffect(() => {
    const loadApplicant = async () => {
      if (!jobId || !applicationId) {
        setError("Missing job or application ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchApplicantDetails(jobId, applicationId);
        setData(result);
      } catch (err) {
        setError(err.message || "Failed to load applicant details");
        toast.error(err.message || "Failed to load applicant details");
      } finally {
        setLoading(false);
      }
    };

    loadApplicant();
  }, [jobId, applicationId]);

  const handleStageChange = async (newStage) => {
    if (!jobId || !applicationId) return;

    setUpdatingStage(true);
    try {
      await updateJobApplicantStage(jobId, applicationId, {
        currentStage: newStage,
      });
      setData((prev) => ({
        ...prev,
        application: {
          ...prev.application,
          currentStage: newStage,
        },
      }));
      toast.success("Application stage updated");
    } catch (err) {
      toast.error(err.message || "Failed to update stage");
    } finally {
      setUpdatingStage(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      screening: "bg-blue-500/20 text-blue-200 border-blue-500/30",
      assessment: "bg-purple-500/20 text-purple-200 border-purple-500/30",
      interview: "bg-amber-500/20 text-amber-200 border-amber-500/30",
      offer: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
      hired: "bg-green-500/20 text-green-200 border-green-500/30",
      rejected: "bg-red-500/20 text-red-200 border-red-500/30",
    };
    return colors[stage] || colors.screening;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03040B] text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto" />
          <p className="text-sm text-slate-300">Loading applicant profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03040B] text-white">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-red-200">{error || "Applicant not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
            <HiOutlineArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { application, job, user } = data;

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <div className="layout-container py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-full border-4 border-[#D4AF37]/50 bg-gradient-to-br from-sky-500/20 to-purple-500/20 flex items-center justify-center text-3xl font-semibold text-white">
                    {application.candidateName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                      {application.candidateName || "Applicant"}
                    </h1>
                    {application.candidateHeadline && (
                      <p className="mt-2 text-sm text-slate-300">{application.candidateHeadline}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    {user?.email && (
                      <div className="flex items-center gap-2">
                        <HiOutlineMail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {application.submittedAt && (
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="h-4 w-4" />
                        <span>Applied {formatDate(application.submittedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${getStageColor(
                      application.currentStage
                    )}`}>
                    {application.currentStage?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Screening"}
                  </span>
                </div>
              </div>
            </motion.section>

            {/* Job Application Info */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <HiOutlineBriefcase className="h-5 w-5 text-sky-300" />
                <h2 className="text-lg font-semibold text-white">Application Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Position</p>
                  <p className="mt-1 text-base font-semibold text-white">{job?.title || "N/A"}</p>
                  <p className="mt-1 text-sm text-slate-300">{job?.company || ""}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Application Status</p>
                    <select
                      value={application.currentStage}
                      onChange={(e) => handleStageChange(e.target.value)}
                      disabled={updatingStage}
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-black/70 px-4 py-2 text-sm font-medium text-slate-200 outline-none transition focus:border-sky-400/60 disabled:opacity-50 disabled:cursor-not-allowed">
                      {stageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Submitted</p>
                    <p className="mt-2 text-sm text-slate-200">{formatDate(application.submittedAt)}</p>
                  </div>
                </div>
                {application.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Notes</p>
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-4 text-sm text-slate-200">
                      {application.notes}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Links & Resources */}
            {(application.resumeUrl || application.portfolioUrl || application.profileUrl) && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <HiOutlineGlobeAlt className="h-5 w-5 text-sky-300" />
                  <h2 className="text-lg font-semibold text-white">Resources & Links</h2>
                </div>
                <div className="space-y-3">
                  {application.resumeUrl && (
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 p-4 transition hover:border-sky-400/50 hover:bg-black/70">
                      <div className="flex items-center gap-3">
                        <HiOutlineDocumentText className="h-5 w-5 text-sky-300" />
                        <div>
                          <p className="text-sm font-semibold text-white">Resume</p>
                          <p className="text-xs text-slate-400">View or download resume</p>
                        </div>
                      </div>
                      <span className="text-xs text-sky-300">Open →</span>
                    </a>
                  )}
                  {application.portfolioUrl && (
                    <a
                      href={application.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 p-4 transition hover:border-sky-400/50 hover:bg-black/70">
                      <div className="flex items-center gap-3">
                        <HiOutlineGlobeAlt className="h-5 w-5 text-sky-300" />
                        <div>
                          <p className="text-sm font-semibold text-white">Portfolio</p>
                          <p className="text-xs text-slate-400">View portfolio website</p>
                        </div>
                      </div>
                      <span className="text-xs text-sky-300">Open →</span>
                    </a>
                  )}
                  {application.profileUrl && (
                    <Link
                      to={application.profileUrl}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 p-4 transition hover:border-sky-400/50 hover:bg-black/70">
                      <div className="flex items-center gap-3">
                        <HiOutlineUser className="h-5 w-5 text-sky-300" />
                        <div>
                          <p className="text-sm font-semibold text-white">Profile</p>
                          <p className="text-xs text-slate-400">View full profile</p>
                        </div>
                      </div>
                      <span className="text-xs text-sky-300">Open →</span>
                    </Link>
                  )}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const email = user?.email || application.candidateName?.toLowerCase().replace(/\s+/g, ".") + "@email.com";
                    window.location.href = `mailto:${email}`;
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-black/70">
                  <HiOutlineMail className="mr-2 inline h-4 w-4" />
                  Send Email
                </button>
                <Link
                  to={`/explore-jobs/recruiter-dashboard`}
                  className="block w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-black/70">
                  <HiOutlineBriefcase className="mr-2 inline h-4 w-4" />
                  View All Applicants
                </Link>
              </div>
            </motion.section>

            {/* User Info */}
            {user && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Account Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Role</p>
                    <p className="mt-1 text-slate-200 capitalize">{user.role || "Student"}</p>
                  </div>
                  {user.createdAt && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Member Since</p>
                      <p className="mt-1 text-slate-200">{formatDate(user.createdAt)}</p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfilePage;

