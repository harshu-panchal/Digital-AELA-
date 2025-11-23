import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePlus,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { createPayoutRequest, getPayoutRequests } from "../../src/services/api/earnings";
import { getEarningsSummary } from "../../src/services/api/earnings";

const PayoutRequests = () => {
  const { user } = useAuth();
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [availableEarnings, setAvailableEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    amount: "",
    paymentMethod: "bank_transfer",
    paymentDetails: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      iban: "",
      swiftCode: "",
    },
    notes: "",
  });
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
    loadData();
  }, [filters.status, pagination.page]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [summaryResponse, requestsResponse] = await Promise.all([
        getEarningsSummary(),
        getPayoutRequests({
          status: filters.status || undefined,
          page: pagination.page,
          pageSize: pagination.pageSize,
        }),
      ]);
      setAvailableEarnings(summaryResponse.summary?.availableEarnings || 0);
      setPayoutRequests(requestsResponse.payoutRequests || []);
      setPagination(requestsResponse.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestData.amount || Number(requestData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (Number(requestData.amount) > availableEarnings) {
      toast.error(`Amount exceeds available earnings (AED ${availableEarnings.toFixed(2)})`);
      return;
    }

    if (requestData.paymentMethod === "bank_transfer") {
      if (!requestData.paymentDetails.accountName || !requestData.paymentDetails.accountNumber) {
        toast.error("Please fill in bank account details");
        return;
      }
    }

    try {
      await createPayoutRequest(requestData);
      toast.success("Payout request created successfully");
      setShowRequestModal(false);
      setRequestData({
        amount: "",
        paymentMethod: "bank_transfer",
        paymentDetails: {
          accountName: "",
          accountNumber: "",
          bankName: "",
          iban: "",
          swiftCode: "",
        },
        notes: "",
      });
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to create payout request");
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
      case "completed":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "approved":
      case "processing":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "rejected":
      case "cancelled":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <HiOutlineCheckCircle className="h-5 w-5" />;
      case "approved":
      case "processing":
        return <HiOutlineClock className="h-5 w-5" />;
      case "pending":
        return <HiOutlineClock className="h-5 w-5" />;
      case "rejected":
      case "cancelled":
        return <HiOutlineXCircle className="h-5 w-5" />;
      default:
        return <HiOutlineClock className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Payout Requests | Digital AELA" description="Manage your payout requests" />

      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Payout Requests</h1>
            <p className="text-slate-400">Request payouts for your available earnings</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            disabled={availableEarnings <= 0}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#F5D26A] to-[#E5C158] text-black font-semibold hover:brightness-110 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <HiOutlinePlus className="h-5 w-5" />
            Request Payout
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
          <div className="flex items-center gap-3 mb-2">
            <HiOutlineCurrencyDollar className="h-6 w-6 text-[#F5D26A]" />
            <p className="text-sm text-slate-400">Available Earnings</p>
          </div>
          <p className="text-3xl font-semibold text-white">
            AED {availableEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Ready for payout</p>
        </div>

        <div className="mb-6">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading payout requests...</p>
          </div>
        ) : payoutRequests.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <p className="text-slate-400">No payout requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payoutRequests.map((request) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        Request #{request._id.toString().slice(-8)}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(
                          request.status
                        )}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-2">
                      <div>
                        <span className="text-slate-500">Amount: </span>
                        <span className="text-white font-semibold">
                          {request.currency} {request.amount.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Method: </span>
                        <span className="text-white">{request.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Requested: </span>
                        <span>{formatDate(request.requestedAt)}</span>
                      </div>
                      {request.approvedAt && (
                        <div>
                          <span className="text-slate-500">Approved: </span>
                          <span>{formatDate(request.approvedAt)}</span>
                        </div>
                      )}
                    </div>
                    {request.rejectionReason && (
                      <div className="mt-2 text-sm text-red-400">
                        Rejection Reason: {request.rejectionReason}
                      </div>
                    )}
                    {request.notes && (
                      <div className="mt-2 text-sm text-slate-400">Notes: {request.notes}</div>
                    )}
                  </div>
                  <div className="ml-6 text-right">
                    {request.paymentSlip && (
                      <button className="px-4 py-2 rounded-lg border border-white/10 bg-[#111] text-white text-sm font-semibold hover:bg-white/5 transition flex items-center gap-2">
                        <HiOutlineDocumentText className="h-4 w-4" />
                        View Slip
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

        {/* Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F1E] p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-white mb-4">Request Payout</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount (Available: AED {availableEarnings.toFixed(2)})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={availableEarnings}
                    step="0.01"
                    value={requestData.amount}
                    onChange={(e) =>
                      setRequestData({ ...requestData, amount: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={requestData.paymentMethod}
                    onChange={(e) =>
                      setRequestData({ ...requestData, paymentMethod: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {requestData.paymentMethod === "bank_transfer" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Account Name *
                      </label>
                      <input
                        type="text"
                        value={requestData.paymentDetails.accountName}
                        onChange={(e) =>
                          setRequestData({
                            ...requestData,
                            paymentDetails: {
                              ...requestData.paymentDetails,
                              accountName: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                        placeholder="Enter account name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={requestData.paymentDetails.accountNumber}
                        onChange={(e) =>
                          setRequestData({
                            ...requestData,
                            paymentDetails: {
                              ...requestData.paymentDetails,
                              accountNumber: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                        placeholder="Enter account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={requestData.paymentDetails.bankName}
                        onChange={(e) =>
                          setRequestData({
                            ...requestData,
                            paymentDetails: {
                              ...requestData.paymentDetails,
                              bankName: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">IBAN</label>
                      <input
                        type="text"
                        value={requestData.paymentDetails.iban}
                        onChange={(e) =>
                          setRequestData({
                            ...requestData,
                            paymentDetails: {
                              ...requestData.paymentDetails,
                              iban: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                        placeholder="Enter IBAN"
                      />
                    </div>
                  </>
                )}
                {requestData.paymentMethod === "paypal" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      PayPal Email *
                    </label>
                    <input
                      type="email"
                      value={requestData.paymentDetails.paypalEmail || ""}
                      onChange={(e) =>
                        setRequestData({
                          ...requestData,
                          paymentDetails: {
                            ...requestData.paymentDetails,
                            paypalEmail: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                      placeholder="Enter PayPal email"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                  <textarea
                    value={requestData.notes}
                    onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                    placeholder="Optional notes"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setRequestData({
                        amount: "",
                        paymentMethod: "bank_transfer",
                        paymentDetails: {
                          accountName: "",
                          accountNumber: "",
                          bankName: "",
                          iban: "",
                          swiftCode: "",
                        },
                        notes: "",
                      });
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRequest}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold transition hover:brightness-110">
                    Submit Request
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

export default PayoutRequests;

