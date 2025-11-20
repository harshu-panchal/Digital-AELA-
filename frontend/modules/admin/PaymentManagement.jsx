import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getPaymentHistory, processRefund, getInvoice } from "../../src/services/api/payments";

const PaymentManagement = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundData, setRefundData] = useState({
    refundAmount: "",
    refundReason: "",
  });
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
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
    loadPayments();
  }, [filters.status, filters.startDate, filters.endDate, pagination.page]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const response = await getPaymentHistory({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setPayments(response.payments || []);
      setSummary(response.summary || null);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load payments");
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;

    if (!refundData.refundAmount || isNaN(Number(refundData.refundAmount))) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    const refundAmount = Number(refundData.refundAmount);
    if (refundAmount <= 0 || refundAmount > selectedPayment.amount) {
      toast.error(`Refund amount must be between 0 and ${selectedPayment.amount}`);
      return;
    }

    setIsProcessingRefund(true);
    try {
      await processRefund(selectedPayment._id, {
        refundAmount,
        refundReason: refundData.refundReason || "",
      });
      toast.success("Refund processed successfully");
      setSelectedPayment(null);
      setRefundData({ refundAmount: "", refundReason: "" });
      loadPayments();
    } catch (error) {
      toast.error(error.message || "Failed to process refund");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleDownloadInvoice = async (paymentId) => {
    try {
      const response = await getInvoice(paymentId);
      if (response.invoiceUrl) {
        window.open(response.invoiceUrl, "_blank");
      } else {
        toast.info("Invoice PDF generation not yet implemented");
      }
    } catch (error) {
      toast.error(error.message || "Failed to download invoice");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "pending":
      case "processing":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "refunded":
      case "partially_refunded":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "cancelled":
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <HiOutlineCheckCircle className="h-5 w-5" />;
      case "pending":
      case "processing":
        return <HiOutlineClock className="h-5 w-5" />;
      case "failed":
        return <HiOutlineXCircle className="h-5 w-5" />;
      case "refunded":
      case "partially_refunded":
        return <HiOutlineArrowPath className="h-5 w-5" />;
      default:
        return <HiOutlineClock className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO title="Payment Management | Digital AELA" description="Manage all payments and refunds" />

      <div className="layout-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Payment Management</h1>
          <p className="text-slate-400">View and manage all platform payments</p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Total Payments</p>
              <p className="text-2xl font-semibold text-white">{summary.totalPayments}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Total Amount</p>
              <p className="text-2xl font-semibold text-white">
                {summary.currency} {summary.totalAmount?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Completed</p>
              <p className="text-2xl font-semibold text-emerald-400">
                {summary.currency} {summary.completedAmount?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
              <p className="text-sm text-slate-400 mb-1">Completed Count</p>
              <p className="text-2xl font-semibold text-emerald-400">
                {summary.completedPayments || 0}
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <p className="text-slate-400">No payments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <motion.div
                key={payment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {payment.course?.title || payment.description || "Payment"}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(
                          payment.status
                        )}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-2">
                      <div>
                        <span className="text-slate-500">User: </span>
                        <span className="text-white">
                          {payment.user?.fullName || payment.user?.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="h-4 w-4" />
                        <span>{formatDate(payment.createdAt)}</span>
                      </div>
                      {payment.invoiceNumber && (
                        <div className="flex items-center gap-2">
                          <HiOutlineDocumentText className="h-4 w-4" />
                          <span>Invoice: {payment.invoiceNumber}</span>
                        </div>
                      )}
                      {payment.gatewayTransactionId && (
                        <div>
                          <span className="text-slate-500">Txn ID: </span>
                          <span className="text-white">{payment.gatewayTransactionId}</span>
                        </div>
                      )}
                    </div>
                    {payment.refundAmount > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-400">Refunded: </span>
                        <span className="text-blue-400 font-semibold">
                          {payment.currency} {payment.refundAmount.toFixed(2)}
                        </span>
                        {payment.refundReason && (
                          <span className="text-slate-500 ml-2">({payment.refundReason})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-6 text-right">
                    <div className="mb-2">
                      <p className="text-2xl font-semibold text-white">
                        {payment.currency} {payment.amount.toFixed(2)}
                      </p>
                      {payment.refundAmount > 0 && (
                        <p className="text-sm text-slate-400 line-through">
                          {payment.currency} {payment.amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {payment.status === "completed" && (
                        <>
                          <button
                            onClick={() => handleDownloadInvoice(payment._id)}
                            className="px-3 py-2 rounded-lg border border-white/10 bg-[#111] text-white text-sm hover:bg-white/5 transition">
                            <HiOutlineDocumentText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setRefundData({
                                refundAmount: payment.amount.toString(),
                                refundReason: "",
                              });
                            }}
                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition">
                            Refund
                          </button>
                        </>
                      )}
                    </div>
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

        {/* Refund Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F1E] p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Process Refund</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Payment Amount</p>
                  <p className="text-white font-semibold">
                    {selectedPayment.currency} {selectedPayment.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Already Refunded</p>
                  <p className="text-white">
                    {selectedPayment.currency} {selectedPayment.refundAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Refund Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedPayment.amount}
                    value={refundData.refundAmount}
                    onChange={(e) =>
                      setRefundData({ ...refundData, refundAmount: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Refund Reason
                  </label>
                  <textarea
                    value={refundData.refundReason}
                    onChange={(e) =>
                      setRefundData({ ...refundData, refundReason: e.target.value })
                    }
                    rows={3}
                    placeholder="Enter reason for refund..."
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setSelectedPayment(null);
                      setRefundData({ refundAmount: "", refundReason: "" });
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleRefund}
                    disabled={isProcessingRefund}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold transition hover:brightness-110 disabled:opacity-50">
                    {isProcessingRefund ? "Processing..." : "Process Refund"}
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

export default PaymentManagement;

