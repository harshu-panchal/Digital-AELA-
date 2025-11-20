import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineAcademicCap,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getAllCertificates,
  generateCertificate,
  revokeCertificate,
  downloadCertificatePDF,
} from "../../src/services/api/certificates";
import { getTeacherCourses } from "../../src/services/teacherCourses";

const CertificateManagement = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualIssueModal, setShowManualIssueModal] = useState(false);
  const [manualIssueData, setManualIssueData] = useState({
    studentId: "",
    courseId: "",
    studentName: "",
    courseTitle: "",
  });
  const [filters, setFilters] = useState({
    status: "",
    studentId: "",
    courseId: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadCertificates();
  }, [filters.status, filters.studentId, filters.courseId, pagination.page]);

  const loadCertificates = async () => {
    setIsLoading(true);
    try {
      const response = await getAllCertificates({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setCertificates(response.certificates || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load certificates");
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualIssue = async () => {
    if (!manualIssueData.studentId || !manualIssueData.studentName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await generateCertificate({
        studentId: manualIssueData.studentId,
        courseId: manualIssueData.courseId || undefined,
        studentName: manualIssueData.studentName,
        courseTitle: manualIssueData.courseTitle || undefined,
        issuedType: "manual",
      });
      toast.success("Certificate issued successfully");
      setShowManualIssueModal(false);
      setManualIssueData({
        studentId: "",
        courseId: "",
        studentName: "",
        courseTitle: "",
      });
      loadCertificates();
    } catch (error) {
      toast.error(error.message || "Failed to issue certificate");
    }
  };

  const handleRevoke = async (certificateId) => {
    if (!window.confirm("Are you sure you want to revoke this certificate?")) {
      return;
    }

    try {
      await revokeCertificate(certificateId);
      toast.success("Certificate revoked successfully");
      loadCertificates();
    } catch (error) {
      toast.error(error.message || "Failed to revoke certificate");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "issued":
      case "generated":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "revoked":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "issued":
      case "generated":
        return <HiOutlineCheckCircle className="h-5 w-5" />;
      case "pending":
        return <HiOutlineClock className="h-5 w-5" />;
      case "revoked":
        return <HiOutlineXCircle className="h-5 w-5" />;
      default:
        return <HiOutlineClock className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Certificate Management | Digital AELA" description="Manage all certificates" />

      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Certificate Management</h1>
            <p className="text-slate-400">View and manage all platform certificates</p>
          </div>
          <button
            onClick={() => setShowManualIssueModal(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition flex items-center gap-2">
            <HiOutlinePlus className="h-5 w-5" />
            Issue Certificate
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Status</option>
              <option value="issued">Issued</option>
              <option value="generated">Generated</option>
              <option value="pending">Pending</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Student ID</label>
            <input
              type="text"
              value={filters.studentId}
              onChange={(e) => {
                setFilters({ ...filters, studentId: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              placeholder="Filter by student ID"
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Course ID</label>
            <input
              type="text"
              value={filters.courseId}
              onChange={(e) => {
                setFilters({ ...filters, courseId: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              placeholder="Filter by course ID"
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <p className="text-slate-400">No certificates found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((certificate) => (
              <motion.div
                key={certificate._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {certificate.courseTitle || "Certificate of Completion"}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(
                          certificate.status
                        )}`}>
                        {getStatusIcon(certificate.status)}
                        {certificate.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <HiOutlineUser className="h-4 w-4" />
                        <span>
                          {certificate.student?.fullName || certificate.studentName || "N/A"}
                        </span>
                      </div>
                      {certificate.course && (
                        <div className="flex items-center gap-2">
                          <HiOutlineAcademicCap className="h-4 w-4" />
                          <span>{certificate.course?.title || certificate.courseTitle}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Issued: </span>
                        <span>{formatDate(certificate.issuedAt)}</span>
                      </div>
                      {certificate.certificateNumber && (
                        <div>
                          <span className="text-slate-500">Cert #: </span>
                          <span className="text-white font-mono">
                            {certificate.certificateNumber}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      Type: {certificate.issuedType} | Issued by:{" "}
                      {certificate.issuedBy?.fullName || "System"}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    {(certificate.status === "issued" || certificate.status === "generated") && (
                      <button
                        onClick={() => downloadCertificatePDF(certificate._id)}
                        className="px-3 py-2 rounded-lg border border-white/10 bg-[#111] text-white text-sm hover:bg-white/5 transition">
                        <HiOutlineDownload className="h-4 w-4" />
                      </button>
                    )}
                    {certificate.status !== "revoked" && (
                      <button
                        onClick={() => handleRevoke(certificate._id)}
                        className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition">
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        )}

        {/* Manual Issue Modal */}
        {showManualIssueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F1E] p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Issue Certificate Manually</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    value={manualIssueData.studentId}
                    onChange={(e) =>
                      setManualIssueData({ ...manualIssueData, studentId: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter student ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={manualIssueData.studentName}
                    onChange={(e) =>
                      setManualIssueData({ ...manualIssueData, studentName: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter student name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Course ID</label>
                  <input
                    type="text"
                    value={manualIssueData.courseId}
                    onChange={(e) =>
                      setManualIssueData({ ...manualIssueData, courseId: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Optional: Enter course ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Course Title</label>
                  <input
                    type="text"
                    value={manualIssueData.courseTitle}
                    onChange={(e) =>
                      setManualIssueData({ ...manualIssueData, courseTitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Optional: Enter course title"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowManualIssueModal(false);
                      setManualIssueData({
                        studentId: "",
                        courseId: "",
                        studentName: "",
                        courseTitle: "",
                      });
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleManualIssue}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold transition hover:brightness-110">
                    Issue Certificate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateManagement;

