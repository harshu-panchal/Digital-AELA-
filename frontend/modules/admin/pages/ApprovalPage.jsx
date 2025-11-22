import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaCheck, FaTimes, FaSpinner, FaBook, FaGraduationCap, FaBriefcase, FaChalkboardTeacher, FaEdit, FaEye } from "react-icons/fa";
import {
  fetchPendingCourses,
  fetchPendingEbooks,
  fetchPendingJobs,
  fetchPendingTeachers,
  fetchPendingBlogs,
  approveCourse,
  approveEbook,
  approveJob,
  approveTeacher,
  approveBlog,
  fetchBlogPreview,
  fetchCoursePreview,
  fetchEbookPreview,
  fetchJobPreview,
} from "../../../src/services/api/adminApprovals";
import PreviewModal from "../components/PreviewModal";
import BlogPreview from "../components/previews/BlogPreview";
import CoursePreview from "../components/previews/CoursePreview";
import BookPreview from "../components/previews/BookPreview";
import JobPreview from "../components/previews/JobPreview";

const ApprovalPage = () => {
  const { type } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(new Set());
  const [rejectionReason, setRejectionReason] = useState({});
  const [showRejectModal, setShowRejectModal] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const configs = {
    courses: {
      label: "Courses",
      icon: FaGraduationCap,
      fetchFn: fetchPendingCourses,
      approveFn: approveCourse,
      getTitle: (item) => item.title,
      getOwner: (item) => item.instructor?.fullName || "Unknown",
    },
    books: {
      label: "Books",
      icon: FaBook,
      fetchFn: fetchPendingEbooks,
      approveFn: approveEbook,
      getTitle: (item) => item.title,
      getOwner: () => "System",
    },
    jobs: {
      label: "Jobs",
      icon: FaBriefcase,
      fetchFn: fetchPendingJobs,
      approveFn: approveJob,
      getTitle: (item) => `${item.title} · ${item.location || "Remote"}`,
      getOwner: (item) => item.owner?.fullName || item.company || "Unknown",
    },
    teachers: {
      label: "Teacher Applications",
      icon: FaChalkboardTeacher,
      fetchFn: fetchPendingTeachers,
      approveFn: approveTeacher,
      getTitle: (item) => item.fullName,
      getOwner: (item) => item.email,
      getDetails: (item) => {
        const meta = item.metadata || {};
        const details = [];
        if (meta.expertise) details.push(`Expertise: ${meta.expertise}`);
        if (meta.experienceYears !== undefined) details.push(`${meta.experienceYears} years experience`);
        if (meta.phone) details.push(`Phone: ${meta.phone}`);
        if (meta.primarySubjects && meta.primarySubjects.length > 0) {
          details.push(`Subjects: ${meta.primarySubjects.join(", ")}`);
        }
        if (meta.certifications && meta.certifications.length > 0) {
          details.push(`Certifications: ${meta.certifications.join(", ")}`);
        }
        return details;
      },
    },
    blogs: {
      label: "Blogs",
      icon: FaEdit,
      fetchFn: fetchPendingBlogs,
      approveFn: approveBlog,
      getTitle: (item) => item.title,
      getOwner: (item) => item.author?.fullName || item.author?.email || "Unknown",
      getDetails: (item) => {
        const details = [];
        if (item.excerpt) details.push(`Excerpt: ${item.excerpt.substring(0, 100)}...`);
        if (item.tags && item.tags.length > 0) {
          details.push(`Tags: ${item.tags.join(", ")}`);
        }
        return details;
      },
    },
  };

  const config = configs[type];

  const loadItems = async () => {
    if (!config) return;
    try {
      setLoading(true);
      const response = await config.fetchFn();
      if (response) {
        const responseKey = type === "books" ? "ebooks" : type;
        setItems(response[responseKey] || response.blogs || []);
      }
    } catch (error) {
      toast.error(`Failed to load ${config.label}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (type) {
      loadItems();
    }
  }, [type]);

  const handleApprove = async (item, action) => {
    const itemId = item._id || item.id;
    if (processing.has(itemId)) return;

    // For blogs, show rejection reason modal if rejecting
    if (type === "blogs" && action === "reject") {
      setShowRejectModal((prev) => ({ ...prev, [itemId]: true }));
      return;
    }

    setProcessing((prev) => new Set(prev).add(itemId));

    try {
      const rejectionReasonValue = type === "blogs" && action === "reject" 
        ? rejectionReason[itemId] || "" 
        : null;
      await config.approveFn(itemId, action, rejectionReasonValue);
      toast.success(`${config.label.slice(0, -1)} ${action === "approve" ? "approved" : "rejected"} successfully`);
      setShowRejectModal((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      setRejectionReason((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      loadItems();
    } catch (error) {
      toast.error(`Failed to ${action} ${config.label.toLowerCase()}: ${error.message}`);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRejectWithReason = async (item) => {
    const itemId = item._id || item.id;
    await handleApprove(item, "reject");
  };

  const handlePreview = async (item) => {
    const itemId = item._id || item.id;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);
    setShowPreviewModal(true);

    try {
      let data;
      switch (type) {
        case "blogs":
          data = await fetchBlogPreview(itemId);
          setPreviewData(data.blog);
          break;
        case "courses":
          data = await fetchCoursePreview(itemId);
          setPreviewData(data.course);
          break;
        case "books":
          data = await fetchEbookPreview(itemId);
          setPreviewData(data.ebook);
          break;
        case "jobs":
          data = await fetchJobPreview(itemId);
          setPreviewData(data.job);
          break;
        default:
          throw new Error("Preview not available for this type");
      }
    } catch (error) {
      setPreviewError(error.message || "Failed to load preview");
      toast.error(`Failed to load preview: ${error.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const renderPreviewContent = () => {
    if (!previewData) return null;

    switch (type) {
      case "blogs":
        return <BlogPreview blog={previewData} />;
      case "courses":
        return <CoursePreview course={previewData} />;
      case "books":
        return <BookPreview ebook={previewData} />;
      case "jobs":
        return <JobPreview job={previewData} />;
      default:
        return null;
    }
  };

  if (!config) {
    return <div className="text-white">Invalid approval type</div>;
  }

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8 text-[#D4AF37]" />
        <div>
          <h1 className="text-3xl font-semibold text-white">Pending {config.label}</h1>
          <p className="mt-1 text-sm text-gray-400">Review and approve {config.label.toLowerCase()}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No pending {config.label.toLowerCase()}</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const itemId = item._id || item.id;
              const isProcessing = processing.has(itemId);
              return (
                <motion.div
                  key={itemId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-white/10 bg-[#111] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{config.getTitle(item)}</h3>
                      <p className="mt-1 text-sm text-gray-400">Email: {config.getOwner(item)}</p>
                      {config.getDetails && config.getDetails(item).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {config.getDetails(item).map((detail, idx) => (
                            <p key={idx} className="text-xs text-gray-300">{detail}</p>
                          ))}
                        </div>
                      )}
                      {item.metadata?.bio && (
                        <p className="mt-2 text-sm text-gray-300 line-clamp-2">{item.metadata.bio}</p>
                      )}
                      {item.metadata?.about && !item.metadata?.bio && (
                        <p className="mt-2 text-sm text-gray-300 line-clamp-2">{item.metadata.about}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        Applied: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handlePreview(item)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37]/20 px-4 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/30 disabled:opacity-50">
                        <FaEye className="h-4 w-4" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(item, "approve")}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50">
                        {isProcessing ? (
                          <FaSpinner className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <FaCheck className="h-4 w-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(item, "reject")}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-50">
                        <FaTimes className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                  {showRejectModal[itemId] && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F1E] p-6">
                        <h3 className="mb-4 text-lg font-semibold text-white">Reject Blog</h3>
                        <p className="mb-2 text-sm text-gray-400">Please provide a reason for rejection:</p>
                        <textarea
                          value={rejectionReason[itemId] || ""}
                          onChange={(e) =>
                            setRejectionReason((prev) => ({
                              ...prev,
                              [itemId]: e.target.value,
                            }))
                          }
                          placeholder="Enter rejection reason..."
                          className="mb-4 w-full rounded-lg border border-white/10 bg-[#111] p-3 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                          rows={4}
                        />
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowRejectModal((prev) => {
                                const next = { ...prev };
                                delete next[itemId];
                                return next;
                              });
                              setRejectionReason((prev) => {
                                const next = { ...prev };
                                delete next[itemId];
                                return next;
                              });
                            }}
                            className="flex-1 rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5">
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectWithReason(item)}
                            disabled={processing.has(itemId)}
                            className="flex-1 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-50">
                            {processing.has(itemId) ? (
                              <FaSpinner className="mx-auto h-4 w-4 animate-spin" />
                            ) : (
                              "Confirm Reject"
                            )}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewData(null);
          setPreviewError(null);
        }}
        loading={previewLoading}
        error={previewError}>
        {renderPreviewContent()}
      </PreviewModal>
    </div>
  );
};

export default ApprovalPage;

