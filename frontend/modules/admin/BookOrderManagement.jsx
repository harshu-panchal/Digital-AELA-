import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineShoppingBag,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineTruck,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineUser,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineCalendar,
  HiOutlineIdentification,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineClipboardDocument,
} from "react-icons/hi2";
import { FaSpinner } from "react-icons/fa";
import SEO from "../../src/components/SEO";
import { formatCurrency } from "../../src/utils/currencyUtils";
import {
  getAdminBookOrders,
  getAdminBookOrderStats,
  getAdminBookOrderById,
  updateBookOrderStatus,
} from "../../src/services/api/bookOrders";

// ── Status Helpers ──────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "payment_initiated", label: "Payment Initiated" },
  { value: "payment_completed", label: "Payment Completed" },
  { value: "payment_failed", label: "Payment Failed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "payment_completed", label: "Payment Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_STEP_INDEX = {
  pending: 0,
  payment_initiated: 0,
  payment_completed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

const getStatusColor = (status) => {
  switch (status) {
    case "payment_completed":
    case "delivered":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    case "payment_initiated":
    case "pending":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
    case "payment_failed":
    case "cancelled":
      return "bg-red-500/20 text-red-300 border-red-500/40";
    case "processing":
      return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    case "shipped":
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    case "refunded":
      return "bg-orange-500/20 text-orange-300 border-orange-500/40";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/40";
  }
};

const getStatusLabel = (status) =>
  STATUS_OPTIONS.find((s) => s.value === status)?.label || status;

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = "text-white", sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-5 flex flex-col gap-2"
  >
    <div className="flex items-center gap-2">
      <Icon className={`h-5 w-5 ${color}`} />
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-slate-500">{sub}</p>}
  </motion.div>
);

// ── Status Timeline ───────────────────────────────────────────────────────────
const StatusTimeline = ({ status }) => {
  const currentStep = STATUS_STEP_INDEX[status] ?? -1;
  const isFailed = ["payment_failed", "cancelled", "refunded"].includes(status);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentStep && !isFailed;
        const active = idx === currentStep && !isFailed;
        return (
          <div key={step.key} className="flex items-center gap-1 min-w-fit">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : active
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                    : "bg-white/5 border-white/20 text-slate-600"
                }`}
              >
                {done ? (
                  <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium text-center max-w-[60px] leading-tight ${
                  done ? "text-emerald-400" : active ? "text-[#D4AF37]" : "text-slate-600"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 rounded-full mb-4 ${done ? "bg-emerald-500/50" : "bg-white/10"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Detail Panel ──────────────────────────────────────────────────────────────
const DetailPanel = ({ orderId, onClose, onUpdated }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "",
    trackingNumber: "",
    trackingUrl: "",
    adminNotes: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await getAdminBookOrderById(orderId);
        setOrder(resp.order);
        setUpdateData({
          status: resp.order.status || "",
          trackingNumber: resp.order.trackingNumber || "",
          trackingUrl: resp.order.trackingUrl || "",
          adminNotes: resp.order.adminNotes || "",
        });
      } catch (err) {
        toast.error("Failed to load order details");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    if (orderId) load();
  }, [orderId]);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateBookOrderStatus(orderId, updateData);
      toast.success("Order updated successfully");
      onUpdated();
      const resp = await getAdminBookOrderById(orderId);
      setOrder(resp.order);
    } catch (err) {
      toast.error(err.message || "Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  const quickUpdate = async (status) => {
    setIsUpdating(true);
    try {
      await updateBookOrderStatus(orderId, { ...updateData, status });
      setUpdateData((p) => ({ ...p, status }));
      toast.success(`Order marked as ${getStatusLabel(status)}`);
      onUpdated();
      const resp = await getAdminBookOrderById(orderId);
      setOrder(resp.order);
    } catch (err) {
      toast.error(err.message || "Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  const customerName = order?.isGuest
    ? `${order.guestInfo?.firstName || ""} ${order.guestInfo?.lastName || ""}`.trim()
    : order?.userId?.fullName || "—";
  const customerEmail = order?.isGuest
    ? order.guestInfo?.email
    : order?.userId?.email;
  const customerPhone = order?.isGuest ? order.guestInfo?.phone : order?.userId?.phone || "—";

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 h-screen w-full max-w-lg bg-[#0B0F1E] border-l border-white/10 z-[200] flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-white">Order Details</h2>
          {order && (
            <p className="text-xs text-[#D4AF37] font-mono">{order.orderNumber}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition"
        >
          <HiOutlineXMark className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      ) : !order ? null : (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Status timeline */}
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Order Progress</p>
            <StatusTimeline status={order.status} />
            {["payment_failed", "cancelled", "refunded"].includes(order.status) && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                This order has status: <strong>{getStatusLabel(order.status)}</strong>
              </div>
            )}
          </div>

          {/* Book info */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Book</p>
            <p className="text-base font-semibold text-white">{order.bookTitle}</p>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                  order.bookFormat === "physical"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                }`}
              >
                {order.bookFormat === "physical" ? "Physical" : "E-Book"}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <HiOutlineCurrencyRupee className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-lg font-bold text-[#D4AF37]">
                {formatCurrency(order.amount)}
              </span>
            </div>
          </div>

          {/* Customer info */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Customer</p>
              {order.isGuest && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold">
                  Guest
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <HiOutlineUser className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <span className="text-white">{customerName || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlineEnvelope className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <span className="text-slate-300">{customerEmail || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlinePhone className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <span className="text-slate-300">{customerPhone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <HiOutlineMapPin className="h-4 w-4 text-[#D4AF37]" />
                <p className="text-xs text-slate-500 uppercase tracking-wider">Shipping Address</p>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed">
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Payment info */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payment</p>
            <div className="space-y-1.5 text-sm">
              {order.razorpayPaymentId && (
                <div className="flex items-start gap-2">
                  <HiOutlineIdentification className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-xs">Razorpay Payment ID</span>
                    <p className="text-white font-mono text-xs">{order.razorpayPaymentId}</p>
                  </div>
                </div>
              )}
              {order.paymentId?.gatewayTransactionId && (
                <div className="flex items-start gap-2">
                  <HiOutlineClipboardDocument className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-xs">Transaction ID</span>
                    <p className="text-white font-mono text-xs">{order.paymentId.gatewayTransactionId}</p>
                  </div>
                </div>
              )}
              {order.paymentId?.invoiceUrl && (
                <a
                  href={order.paymentId.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#D4AF37] text-xs hover:text-[#E5C158] transition-colors mt-1"
                >
                  <HiOutlineDocumentText className="h-4 w-4" />
                  View Invoice
                </a>
              )}
              {!order.razorpayPaymentId && !order.paymentId && (
                <p className="text-slate-500 text-xs">No payment information yet</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Timestamps</p>
            <div className="space-y-1.5 text-sm">
              {[
                { label: "Ordered", value: order.orderedAt || order.createdAt },
                { label: "Shipped", value: order.shippedAt },
                { label: "Delivered", value: order.deliveredAt },
                { label: "Cancelled", value: order.cancelledAt },
              ]
                .filter((r) => r.value)
                .map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <HiOutlineCalendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-500 w-20">{label}</span>
                    <span className="text-slate-300">{formatDate(value)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Tracking (if available) */}
          {(order.trackingNumber || order.trackingUrl) && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <HiOutlineTruck className="h-4 w-4 text-[#D4AF37]" />
                <p className="text-xs text-slate-500 uppercase tracking-wider">Tracking</p>
              </div>
              {order.trackingNumber && (
                <p className="text-sm font-mono text-white">{order.trackingNumber}</p>
              )}
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#D4AF37] hover:text-[#E5C158] transition-colors"
                >
                  Track Package →
                </a>
              )}
            </div>
          )}

          {/* Admin Actions */}
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4 space-y-4">
            <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
              Admin Actions
            </p>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {order.status === "payment_completed" && (
                <button
                  onClick={() => quickUpdate("processing")}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-semibold hover:bg-blue-500/30 transition disabled:opacity-50"
                >
                  Mark Processing
                </button>
              )}
              {order.status === "processing" && (
                <button
                  onClick={() => quickUpdate("shipped")}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 transition disabled:opacity-50"
                >
                  Mark Shipped
                </button>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={() => quickUpdate("delivered")}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition disabled:opacity-50"
                >
                  Mark Delivered
                </button>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
              <select
                value={updateData.status}
                onChange={(e) => setUpdateData((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none"
              >
                {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Tracking Number
                </label>
                <input
                  type="text"
                  placeholder="AWB / Docket no."
                  value={updateData.trackingNumber}
                  onChange={(e) =>
                    setUpdateData((p) => ({ ...p, trackingNumber: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-white text-sm placeholder-slate-600 focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Tracking URL
                </label>
                <input
                  type="url"
                  placeholder="https://track.delhivery.com/..."
                  value={updateData.trackingUrl}
                  onChange={(e) =>
                    setUpdateData((p) => ({ ...p, trackingUrl: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-white text-sm placeholder-slate-600 focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Admin Notes</label>
              <textarea
                rows={3}
                placeholder="Internal notes (not visible to customer)..."
                value={updateData.adminNotes}
                onChange={(e) => setUpdateData((p) => ({ ...p, adminNotes: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-white text-sm placeholder-slate-600 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold text-sm hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <FaSpinner className="animate-spin h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const BookOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    isGuest: "",
    search: "",
    startDate: "",
    endDate: "",
    bookFormat: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  });
  const [summary, setSummary] = useState(null);

  const loadStats = async () => {
    try {
      const resp = await getAdminBookOrderStats();
      setStats(resp.totalStats || null);
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  };

  const loadOrders = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const resp = await getAdminBookOrders({
          ...filters,
          page: pagination.page,
          pageSize: pagination.pageSize,
        });
        setOrders(resp.orders || []);
        setPagination((p) => ({ ...p, ...resp.pagination }));
        setSummary(resp.summary || null);
      } catch (e) {
        toast.error("Failed to load orders");
        setOrders([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters, pagination.page, pagination.pageSize]
  );

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [filters.status, filters.isGuest, filters.bookFormat, filters.startDate, filters.endDate, pagination.page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((p) => ({ ...p, page: 1 }));
      loadOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleFilterChange = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ status: "", isGuest: "", search: "", startDate: "", endDate: "", bookFormat: "" });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasFilters =
    filters.status || filters.isGuest || filters.search || filters.startDate || filters.endDate || filters.bookFormat;

  const getCustomerName = (order) => {
    if (order.isGuest) {
      return `${order.guestInfo?.firstName || ""} ${order.guestInfo?.lastName || ""}`.trim() || "Guest";
    }
    return order.userId?.fullName || "—";
  };

  const getCustomerEmail = (order) => {
    return order.isGuest ? order.guestInfo?.email : order.userId?.email;
  };

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Book Purchase Orders | Admin — Digital AELA"
        description="Track and manage all book purchase orders, both guest and registered user orders."
      />

      <div className="layout-container py-8">
        {/* ── Page Header ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-1">Book Purchase Orders</h1>
            <p className="text-slate-400 text-sm">
              Track, manage, and fulfil all book orders — guest &amp; registered
            </p>
          </div>
          <button
            onClick={() => loadOrders(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            <HiOutlineArrowPath className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={HiOutlineShoppingBag}
            label="Total Orders"
            value={stats?.total ?? "—"}
            color="text-white"
            sub="All time"
          />
          <StatCard
            icon={HiOutlineCurrencyRupee}
            label="Total Revenue"
            value={stats ? formatCurrency(stats.revenue) : "—"}
            color="text-[#D4AF37]"
            sub="Completed payments"
          />
          <StatCard
            icon={HiOutlineClock}
            label="Pending"
            value={stats ? (stats.total - stats.completed) : "—"}
            color="text-yellow-400"
            sub="Awaiting fulfillment"
          />
          <StatCard
            icon={HiOutlineUser}
            label="Guest Orders"
            value={stats ? `${stats.guestCount} (${stats.guestPercentage}%)` : "—"}
            color="text-orange-400"
            sub="No account"
          />
          <StatCard
            icon={HiOutlineCheckCircle}
            label="Today"
            value={stats?.todayOrders ?? "—"}
            color="text-emerald-400"
            sub="Orders today"
          />
        </div>

        {/* ── Filter Bar ── */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#060A17]/80 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
            {/* Search */}
            <div className="xl:col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5">Search</label>
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Name, email, order no., book..."
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#111] pl-9 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:border-[#D4AF37]/40 focus:outline-none"
                />
              </div>
            </div>
            {/* Status */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/40 focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Order type */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Order Type</label>
              <select
                value={filters.isGuest}
                onChange={(e) => handleFilterChange("isGuest", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/40 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="true">Guest Orders</option>
                <option value="false">Registered Users</option>
              </select>
            </div>
            {/* Date range */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/40 focus:outline-none"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <HiOutlineXMark className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>

        {/* ── Summary strip ── */}
        {summary && (
          <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-400">
            <span>
              Showing <strong className="text-white">{orders.length}</strong> of{" "}
              <strong className="text-white">{summary.total}</strong> orders
            </span>
            <span>
              Revenue:{" "}
              <strong className="text-[#D4AF37]">{formatCurrency(summary.totalRevenue)}</strong>
            </span>
            <span>
              Pending: <strong className="text-yellow-400">{summary.pending}</strong>
            </span>
            <span>
              Completed: <strong className="text-emerald-400">{summary.completed}</strong>
            </span>
          </div>
        )}

        {/* ── Orders List ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <FaSpinner className="h-10 w-10 animate-spin text-[#D4AF37]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-white/10 bg-[#060A17]/80">
            <HiOutlineShoppingBag className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">No orders found</p>
            <p className="text-slate-600 text-sm mt-1">
              {hasFilters ? "Try adjusting your filters" : "Orders will appear here once customers start purchasing"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-5 hover:border-[#D4AF37]/20 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Row 1: Order no + badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-bold text-[#D4AF37]">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                          order.bookFormat === "physical"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        }`}
                      >
                        {order.bookFormat === "physical" ? "Physical" : "E-Book"}
                      </span>
                      {order.isGuest && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold">
                          Guest
                        </span>
                      )}
                    </div>
                    {/* Row 2: Book title */}
                    <p className="text-base font-semibold text-white mb-1 truncate">
                      {order.bookTitle}
                    </p>
                    {/* Row 3: Customer */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <HiOutlineUser className="h-3.5 w-3.5" />
                        {getCustomerName(order)}
                      </span>
                      {getCustomerEmail(order) && (
                        <span className="flex items-center gap-1.5">
                          <HiOutlineEnvelope className="h-3.5 w-3.5" />
                          {getCustomerEmail(order)}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <HiOutlineCalendar className="h-3.5 w-3.5" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Amount + action */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">{formatCurrency(order.amount)}</p>
                      <p className="text-xs text-slate-500">{order.currency}</p>
                    </div>
                    <button
                      onClick={() => setSelectedOrderId(order._id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] text-sm font-semibold hover:from-[#D4AF37]/30 hover:to-[#D4AF37]/20 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white text-sm hover:bg-white/5 transition disabled:opacity-40"
            >
              <HiOutlineChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page{" "}
              <strong className="text-white">{pagination.page}</strong> of{" "}
              <strong className="text-white">{pagination.totalPages}</strong>
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white text-sm hover:bg-white/5 transition disabled:opacity-40"
            >
              Next
              <HiOutlineChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Detail Side Panel ── */}
      <AnimatePresence>
        {selectedOrderId && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderId(null)}
              className="fixed inset-0 bg-black/70 z-[190]"
            />
            <DetailPanel
              orderId={selectedOrderId}
              onClose={() => setSelectedOrderId(null)}
              onUpdated={() => loadOrders(true)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookOrderManagement;
