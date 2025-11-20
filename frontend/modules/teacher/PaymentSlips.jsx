import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineCalendar,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getPaymentSlips } from "../../src/services/api/earnings";

const PaymentSlips = () => {
  const { user } = useAuth();
  const [paymentSlips, setPaymentSlips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadPaymentSlips();
  }, [pagination.page]);

  const loadPaymentSlips = async () => {
    setIsLoading(true);
    try {
      const response = await getPaymentSlips({
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setPaymentSlips(response.paymentSlips || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load payment slips");
      setPaymentSlips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (slip) => {
    try {
      // In production, this would download the actual PDF
      // For now, generate a text version
      const slipText = `
PAYMENT SLIP
Slip Number: ${slip.slipNumber}
Date: ${new Date(slip.generatedAt).toLocaleDateString()}

Teacher: ${slip.teacher?.fullName || "N/A"}
Amount: ${slip.currency} ${slip.amount.toFixed(2)}

Period: ${slip.period?.startDate ? new Date(slip.period.startDate).toLocaleDateString() : "N/A"} - ${slip.period?.endDate ? new Date(slip.period.endDate).toLocaleDateString() : "N/A"}

Earnings Breakdown:
${slip.earnings?.map((e, i) => `${i + 1}. ${e.description || "Earning"}: ${slip.currency} ${e.amount.toFixed(2)}`).join("\n") || "No earnings listed"}

Total: ${slip.currency} ${slip.amount.toFixed(2)}
      `;

      const blob = new Blob([slipText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-slip-${slip.slipNumber}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Payment slip downloaded");
    } catch (error) {
      toast.error(error.message || "Failed to download payment slip");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Payment Slips | Digital AELA" description="View and download your payment slips" />

      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Payment Slips</h1>
          <p className="text-slate-400">View and download your payment slips</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading payment slips...</p>
          </div>
        ) : paymentSlips.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <HiOutlineDocumentText className="h-16 w-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400 mb-2">No payment slips found</p>
            <p className="text-sm text-slate-500">Payment slips will appear here after payouts are processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentSlips.map((slip) => (
              <motion.div
                key={slip._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        Payment Slip #{slip.slipNumber}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-2">
                      <div>
                        <span className="text-slate-500">Amount: </span>
                        <span className="text-white font-semibold text-lg">
                          {slip.currency} {slip.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="h-4 w-4" />
                        <span>{formatDate(slip.generatedAt)}</span>
                      </div>
                      {slip.period && (
                        <div>
                          <span className="text-slate-500">Period: </span>
                          <span>
                            {slip.period.startDate
                              ? new Date(slip.period.startDate).toLocaleDateString()
                              : "N/A"}{" "}
                            -{" "}
                            {slip.period.endDate
                              ? new Date(slip.period.endDate).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      )}
                    </div>
                    {slip.earnings && slip.earnings.length > 0 && (
                      <div className="mt-4 text-sm">
                        <p className="text-slate-400 mb-2">Earnings Breakdown:</p>
                        <div className="space-y-1">
                          {slip.earnings.slice(0, 5).map((earning, i) => (
                            <div key={i} className="text-slate-300">
                              • {earning.description || "Earning"}: {slip.currency}{" "}
                              {earning.amount.toFixed(2)}
                            </div>
                          ))}
                          {slip.earnings.length > 5 && (
                            <div className="text-slate-400">
                              ... and {slip.earnings.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-6">
                    <button
                      onClick={() => handleDownload(slip)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold hover:from-sky-600 hover:to-sky-700 transition flex items-center gap-2">
                      <HiOutlineDownload className="h-4 w-4" />
                      Download PDF
                    </button>
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

export default PaymentSlips;

