import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineArrowUpTray,
  HiOutlineArrowDownTray,
  HiOutlineTag,
} from "react-icons/hi2";
import { bulkCourseOperations } from "../../src/services/teacherCourses";

const BulkCourseOperations = ({ courses, selectedCourses, onSelectionChange, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newStatus, setNewStatus] = useState("draft");
  const [newCategory, setNewCategory] = useState("");

  const handleBulkOperation = async (operation, additionalData = {}) => {
    if (selectedCourses.length === 0) {
      toast.warning("Please select at least one course");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await bulkCourseOperations({
        operation,
        courseIds: selectedCourses,
        ...additionalData,
      });

      toast.success(
        `${operation === "delete" ? "Deleted" : "Updated"} ${result.deleted || result.updated || 0} course(s)`
      );
      
      if (onSuccess) {
        onSuccess();
      }
      
      onSelectionChange([]);
      setShowStatusModal(false);
      setShowCategoryModal(false);
    } catch (error) {
      toast.error(error.message || `Failed to ${operation} courses`);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCount = selectedCourses.length;
  const canDelete = selectedCount > 0 && courses
    .filter((c) => selectedCourses.includes(c.id || c._id))
    .every((c) => c.status === "draft");

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-4 z-10 rounded-2xl border border-white/10 bg-[#060A17]/95 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              {selectedCount} course{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => onSelectionChange([])}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white transition hover:bg-white/10">
              Clear
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canDelete && (
              <button
                onClick={() => handleBulkOperation("delete")}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50">
                <HiOutlineTrash className="h-4 w-4" />
                Delete
              </button>
            )}

            <button
              onClick={() => handleBulkOperation("publish")}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200 transition hover:bg-green-500/20 disabled:opacity-50">
              <HiOutlineArrowUpTray className="h-4 w-4" />
              Publish
            </button>

            <button
              onClick={() => handleBulkOperation("unpublish")}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-500/20 disabled:opacity-50">
              <HiOutlineArrowDownTray className="h-4 w-4" />
              Unpublish
            </button>

            <button
              onClick={() => setShowStatusModal(true)}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-50">
              <HiOutlineTag className="h-4 w-4" />
              Change Status
            </button>

            <button
              onClick={() => setShowCategoryModal(true)}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20 disabled:opacity-50">
              <HiOutlineTag className="h-4 w-4" />
              Change Category
            </button>
          </div>
        </div>
      </motion.div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#060A17] p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Change Status</h3>
            <div className="space-y-4">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="published">Published</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBulkOperation("updateStatus", { status: newStatus })}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200 transition hover:bg-green-500/20 disabled:opacity-50">
                  <HiOutlineCheck className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setNewStatus("draft");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  <HiOutlineXMark className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Change Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#060A17] p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Change Category</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-slate-400 focus:border-sky-400/50 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleBulkOperation("updateCategory", { category: newCategory })}
                  disabled={isProcessing || !newCategory.trim()}
                  className="flex-1 rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200 transition hover:bg-green-500/20 disabled:opacity-50">
                  <HiOutlineCheck className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategory("");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  <HiOutlineXMark className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default BulkCourseOperations;

