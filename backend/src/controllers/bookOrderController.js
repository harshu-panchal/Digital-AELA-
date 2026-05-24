import mongoose from "mongoose";
import BookOrder from "../models/BookOrder.js";
import EbookResource from "../models/EbookResource.js";
import Payment from "../models/Payment.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { createPaymentLink } from "../services/razorpayService.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "https://digitalaela.com";

/**
 * Helper: get IP address from request
 */
const getClientIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  null;

const buildRazorpayPaymentLink = async (order, customerName, email, phone) => {
  const link = await createPaymentLink(
    order.amount,
    order.currency || "INR",
    order.orderNumber || order._id.toString(), // receipt
    `Book Purchase: ${order.bookTitle}`, // description
    customerName,
    email,
    phone,
    `${FRONTEND_URL}/payment/callback?type=book-order&orderId=${order._id}`, // callbackUrl
    { type: "book-order", orderId: order._id.toString() } // notes
  );
  return link;
};

/**
 * POST /api/v1/book-orders
 * Create a guest book order — no authentication required
 */
export const createGuestBookOrder = async (req, res, next) => {
  try {
    const {
      bookId,
      firstName,
      lastName,
      email,
      phone,
      quantity,
      shippingAddress,
      paymentMethod,
    } = req.body;

    // --- Validation ---
    if (!bookId || !mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Valid book ID is required" },
      });
    }
    if (!firstName?.trim()) {
      return res.status(422).json({
        error: { code: "VALIDATION_ERROR", message: "First name is required" },
      });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).json({
        error: { code: "VALIDATION_ERROR", message: "Valid email is required" },
      });
    }
    if (!phone?.trim()) {
      return res.status(422).json({
        error: { code: "VALIDATION_ERROR", message: "Phone number is required" },
      });
    }

    // --- Fetch book ---
    const book = await EbookResource.findById(bookId).lean();
    if (!book) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Book not found" },
      });
    }
    if (!book.isPublic) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "This book is not available for purchase" },
      });
    }

    const price =
      book.metadata?.price !== undefined &&
      book.metadata.price !== null &&
      book.metadata.price !== ""
        ? Number(book.metadata.price)
        : 0;

    if (!price || price <= 0) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "This book does not have a valid price" },
      });
    }

    const orderQuantity = quantity ? parseInt(quantity, 10) : 1;
    const totalAmount = price * orderQuantity;

    const bookFormat =
      book.metadata?.bookType === "physical" || book.downloadUrl === "physical-book"
        ? "physical"
        : "ebook";

    // Require shipping address for physical books
    if (bookFormat === "physical") {
      if (
        !shippingAddress?.addressLine1?.trim() ||
        !shippingAddress?.city?.trim() ||
        !shippingAddress?.state?.trim() ||
        !shippingAddress?.pincode?.trim()
      ) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Complete shipping address is required for physical books",
          },
        });
      }
    }

    // --- Create BookOrder ---
    const order = await BookOrder.create({
      bookId: book._id,
      bookTitle: book.title,
      bookFormat,
      quantity: orderQuantity,
      amount: totalAmount,
      currency: "INR",
      isGuest: true,
      guestInfo: {
        firstName: firstName.trim(),
        lastName: (lastName || "").trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      },
      shippingAddress: bookFormat === "physical" ? shippingAddress : null,
      status: "pending",
      createdByIp: getClientIp(req),
    });

    // --- Create CRM Lead ---
    try {
      const fullName = `${firstName.trim()} ${(lastName || "").trim()}`.trim();
      const lead = await Lead.create({
        firstName: firstName.trim(),
        lastName: (lastName || "").trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        source: "website",
        formSource: "guest-book-purchase",
        status: "new",
        priority: "medium",
        value: totalAmount,
        currency: "INR",
        description: `Guest purchased book: "${book.title}" (${bookFormat}) x${orderQuantity} - ₹${totalAmount}`,
        tags: ["book-purchase", "guest", bookFormat],
      });
      await BookOrder.findByIdAndUpdate(order._id, { crmLeadId: lead._id });
    } catch (leadErr) {
      // Non-critical — don't fail the order if CRM lead creation fails
      console.error("[BookOrder] Failed to create CRM lead:", leadErr.message);
    }

    // --- Create Razorpay Payment Link ---
    try {
      const fullName = `${firstName.trim()} ${(lastName || "").trim()}`.trim();
      const link = await buildRazorpayPaymentLink(order, fullName, email, phone);

      await BookOrder.findByIdAndUpdate(order._id, {
        razorpayPaymentLinkId: link.id,
        razorpayOrderId: link.id,
        status: "payment_initiated",
      });

      return res.status(201).json({
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentLinkUrl: link.short_url || link.url,
        message: "Book order created. Redirecting to payment...",
      });
    } catch (razorpayErr) {
      // Update order status to failed
      await BookOrder.findByIdAndUpdate(order._id, { status: "payment_failed" });
      console.error("[BookOrder] Razorpay link creation failed:", razorpayErr.message);
      return res.status(502).json({
        error: {
          code: "PAYMENT_GATEWAY_ERROR",
          message: "Failed to initiate payment. Please try again.",
        },
      });
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/book-orders/registered
 * Create a book order for a registered/authenticated user
 */
export const createRegisteredBookOrder = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const { bookId, quantity, shippingAddress, paymentMethod } = req.body;

    if (!bookId || !mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Valid book ID is required" },
      });
    }

    // Fetch user
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "User not found" },
      });
    }
    if (user.isActive === false) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Your account is not active" },
      });
    }

    // Fetch book
    const book = await EbookResource.findById(bookId).lean();
    if (!book) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Book not found" },
      });
    }
    if (!book.isPublic) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "This book is not available for purchase" },
      });
    }

    const price =
      book.metadata?.price !== undefined &&
      book.metadata.price !== null &&
      book.metadata.price !== ""
        ? Number(book.metadata.price)
        : 0;

    if (!price || price <= 0) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "This book does not have a valid price" },
      });
    }

    const orderQuantity = quantity ? parseInt(quantity, 10) : 1;
    const totalAmount = price * orderQuantity;

    const bookFormat =
      book.metadata?.bookType === "physical" || book.downloadUrl === "physical-book"
        ? "physical"
        : "ebook";

    // Require shipping address for physical books
    if (bookFormat === "physical") {
      if (
        !shippingAddress?.addressLine1?.trim() ||
        !shippingAddress?.city?.trim() ||
        !shippingAddress?.state?.trim() ||
        !shippingAddress?.pincode?.trim()
      ) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Complete shipping address is required for physical books",
          },
        });
      }
    }

    // Create order
    const order = await BookOrder.create({
      bookId: book._id,
      bookTitle: book.title,
      bookFormat,
      quantity: orderQuantity,
      amount: totalAmount,
      currency: "INR",
      isGuest: false,
      userId: new mongoose.Types.ObjectId(userId),
      shippingAddress: bookFormat === "physical" ? shippingAddress : null,
      status: "pending",
      createdByIp: getClientIp(req),
    });

    // Create Razorpay payment link
    try {
      const link = await buildRazorpayPaymentLink(
        order,
        user.fullName || "Customer",
        user.email,
        user.phone || user.metadata?.phone || ""
      );

      await BookOrder.findByIdAndUpdate(order._id, {
        razorpayPaymentLinkId: link.id,
        razorpayOrderId: link.id,
        status: "payment_initiated",
      });

      return res.status(201).json({
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentLinkUrl: link.short_url || link.url,
        message: "Book order created. Redirecting to payment...",
      });
    } catch (razorpayErr) {
      await BookOrder.findByIdAndUpdate(order._id, { status: "payment_failed" });
      console.error("[BookOrder] Razorpay link creation failed:", razorpayErr.message);
      return res.status(502).json({
        error: {
          code: "PAYMENT_GATEWAY_ERROR",
          message: "Failed to initiate payment. Please try again.",
        },
      });
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/book-orders/verify-payment
 * Verify payment after Razorpay callback
 */
export const verifyBookOrderPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_payment_id,
      razorpay_payment_link_id,
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_signature,
    } = req.body;

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Valid order ID is required" },
      });
    }

    const order = await BookOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Order not found" },
      });
    }

    // Avoid double-processing
    if (order.status === "payment_completed" || order.status === "delivered") {
      return res.json({
        success: true,
        orderStatus: order.status,
        orderNumber: order.orderNumber,
        message: "Payment already verified",
      });
    }

    // Update payment details
    const newStatus = order.bookFormat === "ebook" ? "delivered" : "processing";
    const updateData = {
      razorpayPaymentId: razorpay_payment_id || null,
      razorpaySignature: razorpay_signature || null,
      status: razorpay_payment_link_status === "paid" ? newStatus : "payment_failed",
      metadata: {
        ...order.metadata,
        razorpayCallbackData: req.body,
        verifiedAt: new Date(),
      },
    };

    if (newStatus === "delivered") {
      updateData.deliveredAt = new Date();
    }

    await BookOrder.findByIdAndUpdate(orderId, updateData);

    // Create a Payment record for financial tracking (only on success)
    if (razorpay_payment_link_status === "paid") {
      try {
        const payment = await Payment.create({
          user: order.userId || null,
          amount: order.amount,
          currency: order.currency,
          status: "completed",
          paymentMethod: "card",
          gateway: "razorpay",
          gatewayTransactionId: razorpay_payment_id || null,
          description: `Book purchase: ${order.bookTitle}`,
          metadata: {
            type: "book",
            bookOrderId: order._id.toString(),
            bookTitle: order.bookTitle,
            bookFormat: order.bookFormat,
            isGuest: order.isGuest,
            guestEmail: order.isGuest ? order.guestInfo?.email : null,
          },
        });
        await BookOrder.findByIdAndUpdate(orderId, { paymentId: payment._id });
      } catch (paymentErr) {
        console.error("[BookOrder] Failed to create Payment record:", paymentErr.message);
      }
    }

    const updatedOrder = await BookOrder.findById(orderId).lean();

    return res.json({
      success: true,
      orderStatus: updatedOrder.status,
      orderNumber: updatedOrder.orderNumber,
      message:
        razorpay_payment_link_status === "paid"
          ? "Payment verified successfully!"
          : "Payment verification failed",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/book-orders/admin
 * Admin: Get all book orders with filters and pagination
 */
export const getBookOrders = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    if (!userId || userRole !== "super-admin") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Admin access required" },
      });
    }

    const {
      page = 1,
      pageSize = 20,
      status,
      isGuest,
      bookId,
      search,
      startDate,
      endDate,
      bookFormat,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (isGuest !== undefined && isGuest !== "") {
      query.isGuest = isGuest === "true";
    }
    if (bookId && mongoose.isValidObjectId(bookId)) {
      query.bookId = new mongoose.Types.ObjectId(bookId);
    }
    if (bookFormat) query.bookFormat = bookFormat;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }

    // Search by name, email, order number
    if (search?.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { "guestInfo.email": regex },
        { "guestInfo.firstName": regex },
        { "guestInfo.lastName": regex },
        { orderNumber: regex },
        { bookTitle: regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [orders, total] = await Promise.all([
      BookOrder.find(query)
        .populate("bookId", "title metadata categories")
        .populate("userId", "fullName email")
        .populate("paymentId", "gatewayTransactionId invoiceNumber invoiceUrl status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      BookOrder.countDocuments(query),
    ]);

    // Summary stats (for the filtered set)
    const statsAgg = await BookOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["payment_completed", "processing", "shipped", "delivered"]] },
                "$amount",
                0,
              ],
            },
          },
          pending: {
            $sum: { $cond: [{ $in: ["$status", ["pending", "payment_initiated"]] }, 1, 0] },
          },
          completed: {
            $sum: {
              $cond: [
                { $in: ["$status", ["payment_completed", "processing", "shipped", "delivered"]] },
                1,
                0,
              ],
            },
          },
          guestOrders: { $sum: { $cond: ["$isGuest", 1, 0] } },
          registeredOrders: { $sum: { $cond: ["$isGuest", 0, 1] } },
        },
      },
    ]);

    const summary = statsAgg[0] || {
      totalRevenue: 0,
      pending: 0,
      completed: 0,
      guestOrders: 0,
      registeredOrders: 0,
    };

    return res.json({
      orders,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
      summary: { ...summary, total },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/book-orders/admin/stats
 * Admin: Get aggregate stats for dashboard widget
 */
export const getBookOrderStats = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    if (!userId || userRole !== "super-admin") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Admin access required" },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStats,
      byStatus,
      topBooks,
      todayOrders,
      revenueByDay,
    ] = await Promise.all([
      // Total stats
      BookOrder.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["payment_completed", "processing", "shipped", "delivered"]] },
                  1,
                  0,
                ],
              },
            },
            revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["payment_completed", "processing", "shipped", "delivered"]] },
                  "$amount",
                  0,
                ],
              },
            },
            guestCount: { $sum: { $cond: ["$isGuest", 1, 0] } },
          },
        },
      ]),
      // By status
      BookOrder.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Top 5 books by order count
      BookOrder.aggregate([
        { $group: { _id: "$bookId", title: { $first: "$bookTitle" }, orders: { $sum: 1 }, revenue: { $sum: "$amount" } } },
        { $sort: { orders: -1 } },
        { $limit: 5 },
      ]),
      // Today's orders
      BookOrder.countDocuments({ createdAt: { $gte: today } }),
      // Revenue last 30 days
      BookOrder.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            status: { $in: ["payment_completed", "processing", "shipped", "delivered"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const stats = totalStats[0] || { total: 0, completed: 0, revenue: 0, guestCount: 0 };
    const guestPercentage =
      stats.total > 0 ? Math.round((stats.guestCount / stats.total) * 100) : 0;

    return res.json({
      totalStats: {
        total: stats.total,
        completed: stats.completed,
        revenue: stats.revenue,
        guestCount: stats.guestCount,
        guestPercentage,
        todayOrders,
      },
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      topBooks,
      revenueByDay,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/book-orders/admin/:orderId
 * Admin: Get full order details
 */
export const getBookOrderById = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    if (!userId || userRole !== "super-admin") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Admin access required" },
      });
    }

    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid order ID" },
      });
    }

    const order = await BookOrder.findById(orderId)
      .populate("bookId", "title description metadata categories downloadUrl")
      .populate("userId", "fullName email phone role")
      .populate("paymentId", "gatewayTransactionId invoiceNumber invoiceUrl status amount currency")
      .populate("crmLeadId", "status priority assignedTo")
      .lean();

    if (!order) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Order not found" },
      });
    }

    return res.json({ order });
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/v1/book-orders/admin/:orderId/status
 * Admin: Update order status and fulfillment details
 */
export const updateBookOrderStatus = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    if (!userId || userRole !== "super-admin") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Admin access required" },
      });
    }

    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid order ID" },
      });
    }

    const { status, trackingNumber, trackingUrl, adminNotes } = req.body;

    const validStatuses = [
      "pending",
      "payment_initiated",
      "payment_completed",
      "payment_failed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(422).json({
        error: { code: "VALIDATION_ERROR", message: `Invalid status: ${status}` },
      });
    }

    const order = await BookOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Order not found" },
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    // Set timestamp fields based on status transitions
    if (status === "shipped" && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (status === "delivered" && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }
    if (status === "cancelled" && !order.cancelledAt) {
      updateData.cancelledAt = new Date();
    }

    const updated = await BookOrder.findByIdAndUpdate(orderId, updateData, { new: true })
      .populate("bookId", "title metadata")
      .populate("userId", "fullName email")
      .populate("paymentId", "gatewayTransactionId invoiceUrl status")
      .lean();

    return res.json({
      order: updated,
      message: "Order updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/book-orders/my-orders
 * Authenticated user: Get their own book orders
 */
export const getUserBookOrders = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const { page = 1, pageSize = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const [orders, total] = await Promise.all([
      BookOrder.find({ userId, isGuest: false })
        .populate("bookId", "title metadata")
        .populate("paymentId", "gatewayTransactionId invoiceUrl status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      BookOrder.countDocuments({ userId, isGuest: false }),
    ]);

    return res.json({
      orders,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/book-orders/my-orders/:orderId
 * Authenticated user: Get a specific order
 */
export const getUserBookOrderById = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid order ID" },
      });
    }

    const order = await BookOrder.findOne({ _id: orderId, userId, isGuest: false })
      .populate("bookId", "title description metadata")
      .populate("paymentId", "gatewayTransactionId invoiceUrl invoiceNumber status")
      .lean();

    if (!order) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Order not found" },
      });
    }

    return res.json({ order });
  } catch (error) {
    return next(error);
  }
};
