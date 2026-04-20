import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaCheck, FaPause, FaPlay, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import {
  approveBranch,
  fetchAdminBranches,
  reactivateBranch,
  rejectBranch,
  suspendBranch,
} from "../../../src/services/api/adminBranches";

const statusClass = {
  approved: "bg-emerald-500/20 text-emerald-300",
  pending: "bg-amber-500/20 text-amber-300",
  rejected: "bg-red-500/20 text-red-300",
  suspended: "bg-gray-500/20 text-gray-300",
};

const BranchManagement = ({ approvalMode = false }) => {
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(approvalMode ? "pending" : "");

  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminBranches({
        search,
        status: approvalMode ? "pending" : status || undefined,
      });
      setBranches(response.branches || []);
      setStats(response.stats || {});
    } catch (error) {
      toast.error(error.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [approvalMode, search, status]);

  useEffect(() => {
    const timer = setTimeout(loadBranches, 250);
    return () => clearTimeout(timer);
  }, [loadBranches]);

  const askReason = (label) => window.prompt(label)?.trim() || "";

  const handleAction = async (branch, action) => {
    setProcessing(`${action}-${branch._id}`);
    try {
      if (action === "approve") {
        await approveBranch(branch._id);
        toast.success("Branch approved");
      } else if (action === "reject") {
        const reason = askReason("Reason for rejection");
        if (!reason) return;
        await rejectBranch(branch._id, reason);
        toast.success("Branch rejected");
      } else if (action === "suspend") {
        const reason = askReason("Reason for suspension");
        await suspendBranch(branch._id, reason);
        toast.success("Branch suspended");
      } else if (action === "reactivate") {
        await reactivateBranch(branch._id);
        toast.success("Branch reactivated");
      }
      loadBranches();
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
          {approvalMode ? "Approvals" : "Global Branch Control"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {approvalMode ? "Pending Branch Approvals" : "Branch Management"}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {approvalMode
            ? "Review new institute and branch owner applications before they go live."
            : "Approve, reject, suspend, and reactivate institute branches."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total", stats.total],
          ["Pending", stats.pending],
          ["Approved", stats.approved],
          ["Suspended", stats.suspended],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-5">
            <p className="text-sm text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{value || 0}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        <div className={`mb-5 grid gap-3 ${approvalMode ? "" : "md:grid-cols-[1fr_220px]"}`}>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search institute, owner, or city"
              className="w-full rounded-xl border border-white/10 bg-[#111] px-10 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none"
            />
          </div>
          {!approvalMode && (
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#F5D26A]/60 focus:outline-none">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
          </div>
        ) : branches.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            {approvalMode ? "No pending branch approvals found." : "No branches found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-4">Branch</th>
                  <th className="pb-3 pr-4">Owner</th>
                  <th className="pb-3 pr-4">Location</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => {
                  const busy = processing.endsWith(branch._id);
                  return (
                    <tr key={branch._id} className="border-b border-white/5 text-sm">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-white">{branch.instituteName}</p>
                        <p className="mt-1 text-xs text-gray-400">{branch.branchName}</p>
                      </td>
                      <td className="py-4 pr-4 text-gray-300">
                        <p>{branch.ownerId?.fullName || "Unknown"}</p>
                        <p className="mt-1 text-xs text-gray-500">{branch.ownerId?.email}</p>
                      </td>
                      <td className="py-4 pr-4 text-gray-400">
                        {[branch.city, branch.state, branch.country].filter(Boolean).join(", ") || "Not set"}
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[branch.status] || statusClass.pending}`}>
                          {branch.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {branch.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => handleAction(branch, "approve")}
                              disabled={busy}
                              className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50">
                              <FaCheck className="h-4 w-4" />
                            </button>
                          )}
                          {branch.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => handleAction(branch, "reject")}
                              disabled={busy}
                              className="rounded-lg bg-red-500/20 p-2 text-red-300 hover:bg-red-500/30 disabled:opacity-50">
                              <FaTimes className="h-4 w-4" />
                            </button>
                          )}
                          {branch.status === "approved" && (
                            <button
                              type="button"
                              onClick={() => handleAction(branch, "suspend")}
                              disabled={busy}
                              className="rounded-lg bg-white/10 p-2 text-gray-300 hover:bg-white/15 disabled:opacity-50">
                              <FaPause className="h-4 w-4" />
                            </button>
                          )}
                          {branch.status === "suspended" && (
                            <button
                              type="button"
                              onClick={() => handleAction(branch, "reactivate")}
                              disabled={busy}
                              className="rounded-lg bg-[#F5D26A]/20 p-2 text-[#F5D26A] hover:bg-[#F5D26A]/30 disabled:opacity-50">
                              <FaPlay className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchManagement;
