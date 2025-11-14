import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaCheck, FaTimes, FaSpinner, FaBook, FaGraduationCap, FaBriefcase, FaChalkboardTeacher } from "react-icons/fa";
import {
  fetchPendingCourses,
  fetchPendingEbooks,
  fetchPendingJobs,
  fetchPendingTeachers,
  approveCourse,
  approveEbook,
  approveJob,
  approveTeacher,
} from "../../../src/services/api/adminApprovals";

const ApprovalPage = () => {
  const { type } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(new Set());

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
    },
  };

  const config = configs[type];

  const loadItems = async () => {
    if (!config) return;
    try {
      setLoading(true);
      const response = await config.fetchFn();
      if (response) {
        setItems(response[type === "books" ? "ebooks" : type] || []);
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

    setProcessing((prev) => new Set(prev).add(itemId));

    try {
      await config.approveFn(itemId, action);
      toast.success(`${config.label.slice(0, -1)} ${action === "approve" ? "approved" : "rejected"} successfully`);
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
                      <p className="mt-1 text-sm text-gray-400">By: {config.getOwner(item)}</p>
                      {item.description && (
                        <p className="mt-2 text-sm text-gray-300 line-clamp-2">{item.description}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        Submitted: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex gap-2">
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalPage;

