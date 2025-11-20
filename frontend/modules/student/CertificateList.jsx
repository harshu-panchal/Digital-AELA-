import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineShare,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getStudentCertificates, downloadCertificatePDF } from "../../src/services/api/certificates";

const CertificateList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadCertificates();
  }, [filters.status, pagination.page]);

  const loadCertificates = async () => {
    setIsLoading(true);
    try {
      const response = await getStudentCertificates({
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

  const handleDownload = async (certificateId) => {
    try {
      const response = await downloadCertificatePDF(certificateId);
      // In production, this would download the actual PDF
      // For now, we'll create a simple PDF-like download
      const certificate = certificates.find((c) => c._id === certificateId);
      if (certificate) {
        const certificateText = `
CERTIFICATE OF COMPLETION

This is to certify that
${certificate.studentName}

has successfully completed
${certificate.courseTitle || "the course"}

Date: ${new Date(certificate.completionDate).toLocaleDateString()}
Certificate Number: ${certificate.certificateNumber || "N/A"}
Verification Code: ${certificate.verificationCode}

This certificate can be verified using the verification code above.
        `;

        const blob = new Blob([certificateText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificate-${certificate.certificateNumber || certificate._id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Certificate downloaded");
      }
    } catch (error) {
      toast.error(error.message || "Failed to download certificate");
    }
  };

  const handleShare = (certificate) => {
    const verificationUrl = `${window.location.origin}/certificates/verify/${certificate.verificationCode}`;
    if (navigator.share) {
      navigator.share({
        title: "My Certificate",
        text: `Check out my certificate: ${certificate.courseTitle}`,
        url: verificationUrl,
      });
    } else {
      navigator.clipboard.writeText(verificationUrl);
      toast.success("Verification link copied to clipboard");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
      <SEO title="My Certificates | Digital AELA" description="View and download your certificates" />

      <div className="space-y-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2">
          <h1 className="text-3xl font-semibold">My Certificates</h1>
          <p className="text-slate-400">View and download your course completion certificates</p>
        </motion.header>

        <div className="mb-6 flex items-center gap-4">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
            <option value="">All Status</option>
            <option value="issued">Issued</option>
            <option value="generated">Generated</option>
            <option value="pending">Pending</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <HiOutlineDocumentText className="h-16 w-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400 mb-2">No certificates found</p>
            <p className="text-sm text-slate-500">Complete courses to earn certificates</p>
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
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-4">
                      <div>
                        <span className="text-slate-500">Issued: </span>
                        <span>{formatDate(certificate.issuedAt)}</span>
                      </div>
                      {certificate.certificateNumber && (
                        <div>
                          <span className="text-slate-500">Certificate #: </span>
                          <span className="text-white font-mono">
                            {certificate.certificateNumber}
                          </span>
                        </div>
                      )}
                      {certificate.verificationCode && (
                        <div>
                          <span className="text-slate-500">Verification: </span>
                          <span className="text-white font-mono text-xs">
                            {certificate.verificationCode.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                    </div>
                    {certificate.description && (
                      <p className="text-sm text-slate-400 mb-4">{certificate.description}</p>
                    )}
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    {(certificate.status === "issued" || certificate.status === "generated") && (
                      <>
                        <button
                          onClick={() => handleDownload(certificate._id)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold hover:from-sky-600 hover:to-sky-700 transition flex items-center gap-2">
                          <HiOutlineDownload className="h-4 w-4" />
                          Download PDF
                        </button>
                        <button
                          onClick={() => handleShare(certificate)}
                          className="px-4 py-2 rounded-lg border border-white/10 bg-[#111] text-white text-sm font-semibold hover:bg-white/5 transition flex items-center gap-2">
                          <HiOutlineShare className="h-4 w-4" />
                          Share
                        </button>
                      </>
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
      </div>
    </div>
  );
};

export default CertificateList;

