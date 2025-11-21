import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from "react-icons/hi2";
import { getMyRedemptionRequests } from "../../../src/services/api/redemptionRequests.js";

const RedemptionHistory = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadRequests();
  }, [statusFilter, pagination.page]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      const response = await getMyRedemptionRequests(params);
      setRequests(response.requests || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error?.message || "Failed to load redemption history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: HiOutlineClock },
      approved: { bg: "bg-emerald-500/20", text: "text-emerald-400", icon: HiOutlineCheckCircle },
      rejected: { bg: "bg-red-500/20", text: "text-red-400", icon: HiOutlineXCircle },
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        <Icon className="h-3 w-3" />
        {status?.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="relative space-y-8 p-6 md:p-8 lg:p-10">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Redemption History</h1>
        <p className="text-sm text-slate-300/70">View all your redemption requests and their status</p>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            setStatusFilter("");
            setPagination({ ...pagination, page: 1 });
          }}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
            statusFilter === ""
              ? "bg-[#D4AF37] text-black"
              : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
          }`}>
          All
        </button>
        {["pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPagination({ ...pagination, page: 1 });
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              statusFilter === status
                ? "bg-[#D4AF37] text-black"
                : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
            }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading redemption history...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg mb-2">No redemption requests found</p>
          <p className="text-sm">Start redeeming your coins to see your history here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {request.reward?.icon && <span className="text-2xl">{request.reward.icon}</span>}
                    <div>
                      <h3 className="font-semibold text-white text-lg">{request.reward?.name || "Unknown Reward"}</h3>
                      <p className="text-xs text-slate-400">{request.reward?.category}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {request.reward?.description && (
                    <p className="text-sm text-slate-300 mb-4">{request.reward.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Coins</p>
                      <p className="text-[#D4AF37] font-semibold">{request.coinsRequested}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Requested</p>
                      <p className="text-white">{formatDate(request.createdAt)}</p>
                    </div>
                    {request.status === "approved" && request.approvedAt && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Approved</p>
                        <p className="text-white">{formatDate(request.approvedAt)}</p>
                      </div>
                    )}
                    {request.status === "rejected" && request.rejectedAt && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Rejected</p>
                        <p className="text-white">{formatDate(request.rejectedAt)}</p>
                      </div>
                    )}
                  </div>

                  {request.rejectionReason && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400 font-semibold mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-300">{request.rejectionReason}</p>
                    </div>
                  )}

                  {request.adminNotes && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-blue-400 font-semibold mb-1">Admin Notes</p>
                      <p className="text-sm text-blue-300">{request.adminNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50">
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RedemptionHistory;

