import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineEye, HiOutlineX, HiOutlineFilter } from "react-icons/hi2";
import SEO from "../../../src/components/SEO";
import {
  getAllRedemptionRequests,
  getRedemptionRequest,
  approveRedemptionRequest,
  rejectRedemptionRequest,
} from "../../../src/services/api/redemptionRequests.js";

const statusOptions = ["pending", "approved", "rejected"];
const categories = ["Cash", "Discounts", "Services", "Certificates", "Gifts", "Other"];

const RedemptionRequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadRequests();
  }, [filters, pagination.page]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      const response = await getAllRedemptionRequests(params);
      setRequests(response.requests || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error?.message || "Failed to load redemption requests");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (requestId) => {
    try {
      const response = await getRedemptionRequest(requestId);
      setSelectedRequest(response.request);
      setShowDetailModal(true);
    } catch (error) {
      toast.error(error?.message || "Failed to load request details");
    }
  };

  const handleOpenActionModal = (type, request) => {
    setActionType(type);
    setSelectedRequest(request);
    setActionNotes("");
    setShowActionModal(true);
  };

  const handleApprove = async () => {
    try {
      await approveRedemptionRequest(selectedRequest._id, actionNotes);
      toast.success("Redemption request approved successfully");
      setShowActionModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      toast.error(error?.message || "Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!actionNotes.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      await rejectRedemptionRequest(selectedRequest._id, actionNotes, actionNotes);
      toast.success("Redemption request rejected successfully");
      setShowActionModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      toast.error(error?.message || "Failed to reject request");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-emerald-500/20 text-emerald-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || ""}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="relative p-6 md:p-8 lg:p-10">
      <SEO
        title="Redemption Requests Management | Super Admin"
        description="Manage and approve redemption requests"
      />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white mb-2">Redemption Requests</h1>
        <p className="text-sm text-slate-300/70">Review and manage user redemption requests</p>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineFilter className="h-5 w-5 text-[#F5D26A]" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none">
              <option value="">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none">
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No redemption requests found</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {request.reward?.icon && <span className="text-2xl">{request.reward.icon}</span>}
                    <div>
                      <h3 className="font-semibold text-white">{request.reward?.name || "Unknown Reward"}</h3>
                      <p className="text-xs text-slate-400">{request.reward?.category}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">User</p>
                      <p className="text-white font-semibold">{request.user?.fullName || "N/A"}</p>
                      <p className="text-xs text-slate-400">{request.user?.email || ""}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Coins</p>
                      <p className="text-[#F5D26A] font-semibold">{request.coinsRequested}</p>
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
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(request._id)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition">
                    <HiOutlineEye className="h-4 w-4 inline mr-1" />
                    View
                  </button>
                  {request.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleOpenActionModal("approve", request)}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition">
                        <HiOutlineCheckCircle className="h-4 w-4 inline mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleOpenActionModal("reject", request)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition">
                        <HiOutlineXCircle className="h-4 w-4 inline mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
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

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Request Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition">
                <HiOutlineX className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Reward</h3>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    {selectedRequest.reward?.icon && <span className="text-3xl">{selectedRequest.reward.icon}</span>}
                    <div>
                      <p className="font-semibold text-white">{selectedRequest.reward?.name}</p>
                      <p className="text-xs text-slate-400">{selectedRequest.reward?.category}</p>
                      <p className="text-sm text-[#F5D26A] mt-1">{selectedRequest.reward?.cost} coins</p>
                    </div>
                  </div>
                  {selectedRequest.reward?.description && (
                    <p className="text-sm text-slate-300 mt-2">{selectedRequest.reward.description}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">User Information</h3>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <div>
                    <p className="text-xs text-slate-400">Full Name</p>
                    <p className="text-white font-semibold">{selectedRequest.user?.fullName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-white">{selectedRequest.user?.email || "N/A"}</p>
                  </div>
                  {selectedRequest.userProfile?.phone && (
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="text-white">{selectedRequest.userProfile.phone}</p>
                    </div>
                  )}
                  {selectedRequest.userProfile?.location && (
                    <div>
                      <p className="text-xs text-slate-400">Location</p>
                      <p className="text-white">
                        {selectedRequest.userProfile.location.city || ""}
                        {selectedRequest.userProfile.location.city && selectedRequest.userProfile.location.country ? ", " : ""}
                        {selectedRequest.userProfile.location.country || ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Request Information</h3>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">Status</p>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Coins Requested</p>
                    <p className="text-[#F5D26A] font-semibold">{selectedRequest.coinsRequested}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Requested At</p>
                    <p className="text-white">{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                  {selectedRequest.approvedAt && (
                    <div>
                      <p className="text-xs text-slate-400">Approved At</p>
                      <p className="text-white">{formatDate(selectedRequest.approvedAt)}</p>
                      {selectedRequest.approvedBy && (
                        <p className="text-xs text-slate-400 mt-1">By: {selectedRequest.approvedBy?.fullName}</p>
                      )}
                    </div>
                  )}
                  {selectedRequest.rejectedAt && (
                    <div>
                      <p className="text-xs text-slate-400">Rejected At</p>
                      <p className="text-white">{formatDate(selectedRequest.rejectedAt)}</p>
                      {selectedRequest.rejectedBy && (
                        <p className="text-xs text-slate-400 mt-1">By: {selectedRequest.rejectedBy?.fullName}</p>
                      )}
                    </div>
                  )}
                  {selectedRequest.rejectionReason && (
                    <div>
                      <p className="text-xs text-slate-400">Rejection Reason</p>
                      <p className="text-white">{selectedRequest.rejectionReason}</p>
                    </div>
                  )}
                  {selectedRequest.adminNotes && (
                    <div>
                      <p className="text-xs text-slate-400">Admin Notes</p>
                      <p className="text-white">{selectedRequest.adminNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.status === "pending" && (
                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenActionModal("approve", selectedRequest);
                    }}
                    className="flex-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition">
                    <HiOutlineCheckCircle className="h-5 w-5 inline mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenActionModal("reject", selectedRequest);
                    }}
                    className="flex-1 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition">
                    <HiOutlineXCircle className="h-5 w-5 inline mr-2" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {actionType === "approve" ? "Approve Request" : "Reject Request"}
              </h2>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedRequest(null);
                  setActionNotes("");
                }}
                className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition">
                <HiOutlineX className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-300 mb-4">
                {actionType === "approve"
                  ? "Are you sure you want to approve this redemption request? Coins will be deducted from the user's account."
                  : "Please provide a reason for rejecting this request. The reserved coins will be returned to the user."}
              </p>
              <label className="block text-sm font-semibold text-white mb-2">
                {actionType === "approve" ? "Admin Notes (optional)" : "Rejection Reason *"}
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                required={actionType === "reject"}
                rows={4}
                placeholder={actionType === "approve" ? "Add any notes..." : "Enter rejection reason..."}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={actionType === "approve" ? handleApprove : handleReject}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  actionType === "approve"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                }`}>
                {actionType === "approve" ? "Approve" : "Reject"}
              </button>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedRequest(null);
                  setActionNotes("");
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RedemptionRequestsManagement;

