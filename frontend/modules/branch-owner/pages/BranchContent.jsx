import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaCheck, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import {
  approveBranchBook,
  approveBranchCourse,
  fetchBranchBooks,
  fetchBranchCourses,
  rejectBranchBook,
  rejectBranchCourse,
} from "../../../src/services/api/branchOwner";

const statusClass = {
  approved: "bg-emerald-500/20 text-emerald-300",
  pending: "bg-amber-500/20 text-amber-300",
  rejected: "bg-red-500/20 text-red-300",
};

const BranchContent = ({ type = "courses" }) => {
  const isBooks = type === "books";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [search, setSearch] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");

  const copy = useMemo(
    () =>
      isBooks
        ? {
            title: "Books and Resources",
            subtitle: "Review branch-linked teacher resources and manage publishing.",
            empty: "No branch books found.",
          }
        : {
            title: "Courses",
            subtitle: "Review branch-linked teacher courses and manage publishing.",
            empty: "No branch courses found.",
          },
    [isBooks]
  );

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = isBooks
        ? await fetchBranchBooks({ search, approvalStatus: approvalStatus || undefined })
        : await fetchBranchCourses({ search, approvalStatus: approvalStatus || undefined });
      setItems(isBooks ? response.books || [] : response.courses || []);
    } catch (error) {
      toast.error(error.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [approvalStatus, isBooks, search]);

  useEffect(() => {
    const timer = setTimeout(loadItems, 250);
    return () => clearTimeout(timer);
  }, [loadItems]);

  const askReason = () => window.prompt("Reason for rejection")?.trim() || "";

  const handleAction = async (item, action) => {
    const itemId = item._id || item.id;
    setProcessing(`${action}-${itemId}`);
    try {
      if (action === "approve") {
        if (isBooks) await approveBranchBook(itemId);
        else await approveBranchCourse(itemId);
        toast.success(`${isBooks ? "Book" : "Course"} approved`);
      } else {
        const reason = askReason();
        if (!reason) return;
        if (isBooks) await rejectBranchBook(itemId, reason);
        else await rejectBranchCourse(itemId, reason);
        toast.success(`${isBooks ? "Book" : "Course"} rejected`);
      }
      loadItems();
    } catch (error) {
      toast.error(error.message || "Action failed");
    } finally {
      setProcessing("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F5D26A]">
          Content Management
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{copy.title}</h1>
        <p className="mt-2 text-sm text-gray-400">{copy.subtitle}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${isBooks ? "books" : "courses"}`}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-10 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none"
            />
          </div>
          <select
            value={approvalStatus}
            onChange={(event) => setApprovalStatus(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none">
            <option value="">All approvals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">{copy.empty}</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const itemId = item._id || item.id;
              const status = item.approvalStatus || (isBooks ? (item.isPublic ? "approved" : "pending") : item.status);
              return (
                <div
                  key={itemId}
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#111] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {isBooks
                        ? item.createdBy?.fullName || item.metadata?.author || "Branch resource"
                        : item.instructor?.fullName || "Branch course"}
                    </p>
                    <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass[status] || statusClass.pending}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleAction(item, "approve")}
                        disabled={processing === `approve-${itemId}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50">
                        <FaCheck className="h-4 w-4" />
                        Approve
                      </button>
                    )}
                    {status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleAction(item, "reject")}
                        disabled={processing === `reject-${itemId}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 disabled:opacity-50">
                        <FaTimes className="h-4 w-4" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchContent;
