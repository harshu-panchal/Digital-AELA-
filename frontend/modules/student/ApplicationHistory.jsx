import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HiOutlineBriefcase,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineFunnel,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { fetchMyApplications, fetchApplicationStats } from "../../src/services/api/jobs";

const stageConfig = {
  screening: {
    label: "Screening",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/40",
    icon: HiOutlineDocumentText,
  },
  assessment: {
    label: "Assessment",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/40",
    icon: HiOutlineDocumentText,
  },
  interview: {
    label: "Interview",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/40",
    icon: HiOutlineClock,
  },
  offer: {
    label: "Offer",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/40",
    icon: HiOutlineCheckCircle,
  },
  hired: {
    label: "Hired",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/40",
    icon: HiOutlineCheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/40",
    icon: HiOutlineXCircle,
  },
};

const ApplicationHistory = () => {
  const { user, isAuthenticated } = useAuth();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filter, setFilter] = useState("all"); // 'all' or stage name

  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast.info("Please log in to view your job applications");
      return;
    }

    loadData();
  }, [isAuthenticated, user, pagination.page, filter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [applicationsResult, statsResult] = await Promise.all([
        fetchMyApplications({
          page: pagination.page,
          pageSize: pagination.pageSize,
          ...(filter !== "all" && { status: filter }),
        }),
        fetchApplicationStats(),
      ]);

      setApplications(applicationsResult.applications || []);
      setPagination(applicationsResult.pagination || pagination);
      setStats(statsResult.stats || null);
    } catch (error) {
      toast.error(error.message || "Failed to load applications");
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="My Applications | Digital AELA"
        description="Track your job applications and their status on Digital AELA"
        keywords="job applications, application tracking, job status, applications history"
        url="https://digitalaela.com/student/applications"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(55,124,255,0.18),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20" style={{ paddingTop: "calc(6rem + 5vh)" }}>
        <section className="layout-container space-y-6">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">
                Job Applications
              </p>
              <h1 className="text-3xl font-semibold md:text-4xl">Application History</h1>
              <p className="mt-2 text-sm text-slate-300/80">
                Track all your job applications and their current status
              </p>
            </div>
          </motion.header>

          {/* Stats Summary */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6 md:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total Applications</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-400">{stats.byStage.hired || 0}</p>
                <p className="text-xs text-slate-400">Hired</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-yellow-400">{stats.byStage.interview || 0}</p>
                <p className="text-xs text-slate-400">In Interview</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-sky-400">{stats.recent}</p>
                <p className="text-xs text-slate-400">Last 30 Days</p>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-[#060A17]/90 p-4">
            <div className="flex items-center gap-2">
              <HiOutlineFunnel className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-300">Filter:</span>
            </div>

            <button
              onClick={() => handleFilterChange("all")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter === "all"
                  ? "border-sky-400/50 bg-sky-500/20 text-sky-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-400/30"
              }`}>
              All
            </button>

            {Object.entries(stageConfig).map(([stage, config]) => (
              <button
                key={stage}
                onClick={() => handleFilterChange(stage)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  filter === stage
                    ? `${config.borderColor} ${config.bgColor} ${config.color}`
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}>
                {config.label}
              </button>
            ))}
          </motion.div>

          {/* Applications List */}
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-slate-300/80">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#060A17]/90 p-12 text-center">
              <HiOutlineBriefcase className="mb-4 h-16 w-16 text-slate-400/50" />
              <h3 className="text-xl font-semibold text-white">No applications found</h3>
              <p className="mt-2 text-sm text-slate-300/80">
                {filter !== "all"
                  ? `No applications in "${stageConfig[filter]?.label || filter}" stage`
                  : "Start applying to jobs to see them here!"}
              </p>
              <Link
                to="/explore-jobs"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-6 py-3 text-sm font-semibold text-sky-200 transition hover:border-sky-300/70 hover:bg-sky-500/20">
                Explore Jobs
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="space-y-3">
                {applications.map((application, index) => {
                  const stageInfo = stageConfig[application.currentStage] || stageConfig.screening;
                  const Icon = stageInfo.icon;
                  const job = application.job || {};

                  return (
                    <motion.div
                      key={application._id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`rounded-2xl border ${stageInfo.borderColor} ${stageInfo.bgColor} p-6 transition hover:border-opacity-60`}>
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${stageInfo.bgColor} ${stageInfo.borderColor} border`}>
                              <Icon className={`h-6 w-6 ${stageInfo.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold text-white">{job.title || "Job Title"}</h3>
                                <span
                                  className={`rounded-full border ${stageInfo.borderColor} ${stageInfo.bgColor} px-3 py-1 text-xs font-semibold ${stageInfo.color}`}>
                                  {stageInfo.label}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                                {job.company && (
                                  <div className="flex items-center gap-1.5">
                                    <HiOutlineBuildingOffice2 className="h-4 w-4" />
                                    <span>{job.company}</span>
                                  </div>
                                )}
                                {job.location && (
                                  <div className="flex items-center gap-1.5">
                                    <HiOutlineMapPin className="h-4 w-4" />
                                    <span>{job.location}</span>
                                  </div>
                                )}
                                {application.submittedAt && (
                                  <div className="flex items-center gap-1.5">
                                    <HiOutlineClock className="h-4 w-4" />
                                    <span>Applied {formatDate(application.submittedAt)}</span>
                                  </div>
                                )}
                              </div>
                              {application.candidateHeadline && (
                                <p className="mt-2 text-sm text-slate-400">{application.candidateHeadline}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:flex-col md:items-end">
                          {job._id && (
                            <Link
                              to={`/explore-jobs/${job._id}`}
                              className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-300/70 hover:bg-sky-500/20">
                              View Job
                              <HiOutlineArrowRight className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                    Previous
                  </button>
                  <span className="text-sm text-slate-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                    Next
                  </button>
                </motion.div>
              )}
            </>
          )}

          {/* Stage Breakdown */}
          {stats?.byStage && Object.values(stats.byStage).some((count) => count > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Applications by Stage</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(stageConfig).map(([stage, config]) => {
                  const count = stats.byStage[stage] || 0;
                  if (count === 0) return null;
                  const Icon = config.icon;

                  return (
                    <div
                      key={stage}
                      className={`flex items-center gap-3 rounded-2xl border ${config.borderColor} ${config.bgColor} p-4`}>
                      <Icon className={`h-6 w-6 ${config.color}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{config.label}</p>
                        <p className={`text-lg font-bold ${config.color}`}>{count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ApplicationHistory;

