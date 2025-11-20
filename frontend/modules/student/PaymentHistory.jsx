import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { HiOutlineCheckCircle } from "react-icons/hi";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getPaymentHistory, getInvoice } from "../../src/services/api/payments";

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
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
    loadPayments();
  }, [filters.status, pagination.page]);

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
      toast.error(error.message || "Failed to load payment history");
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (paymentId) => {
    try {
      const response = await getInvoice(paymentId);
      if (response.invoiceUrl) {
        window.open(response.invoiceUrl, "_blank");
      } else {
        // Generate invoice data for display/download
        const invoiceData = response.invoice;
        const invoiceText = `
INVOICE
Invoice Number: ${invoiceData.invoiceNumber}
Date: ${new Date(invoiceData.date).toLocaleDateString()}

Customer:
${invoiceData.user.name}
${invoiceData.user.email}

${invoiceData.course ? `Course: ${invoiceData.course.title}` : ""}

Amount: ${invoiceData.payment.currency} ${invoiceData.payment.amount}
Payment Method: ${invoiceData.payment.paymentMethod}
Status: ${invoiceData.payment.status}
        `;
        
        const blob = new Blob([invoiceText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoiceData.invoiceNumber}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Invoice downloaded");
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
      <SEO title="Payment History | Digital AELA" description="View your payment history and invoices" />

      <div className="layout-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Payment History</h1>
          <p className="text-slate-400">View all your payments and download invoices</p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading payment history...</p>
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
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-4">
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
                          <span className="text-slate-500">Transaction ID:</span>{" "}
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
                    {payment.status === "completed" && (
                      <button
                        onClick={() => handleDownloadInvoice(payment._id)}
                        className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold hover:from-sky-600 hover:to-sky-700 transition flex items-center gap-2">
                        <HiOutlineDocumentText className="h-4 w-4" />
                        Download Invoice
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
      </div>
    </div>
  );
};

export default PaymentHistory;

