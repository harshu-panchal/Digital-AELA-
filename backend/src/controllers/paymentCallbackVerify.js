import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Enrollment from "../models/Enrollment.js";
import { fetchPayment } from "../services/razorpayService.js";

/**
 * Verify Razorpay Payment from Callback (Immediate Verification)
 * POST /api/v1/payments/:paymentId/verify-razorpay-callback
 * 
 * This endpoint is called immediately when user returns from Razorpay payment page
 * It fetches the payment status directly from Razorpay and updates our database
 * This eliminates the need to wait for webhooks
 */
export const verifyRazorpayCallback = async (req, res, next) => {
    try {
        const { userId } = req.auth || {};
        const { paymentId } = req.params;
        const { razorpay_payment_id } = req.body;

        console.log("=========================================");
        console.log("[Payment Callback Verify] Immediate verification triggered");
        console.log("Payment ID:", paymentId);
        console.log("Razorpay Payment ID:", razorpay_payment_id);
        console.log("User ID:", userId);
        console.log("=========================================");

        if (!userId) {
            return res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication required",
                },
            });
        }

        if (!mongoose.isValidObjectId(paymentId)) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid payment ID",
                },
            });
        }

        if (!razorpay_payment_id) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Razorpay payment ID is required",
                },
            });
        }

        // Find payment
        const payment = await Payment.findById(paymentId).lean();

        if (!payment) {
            return res.status(404).json({
                error: {
                    code: "RESOURCE_NOT_FOUND",
                    message: "Payment not found",
                },
            });
        }

        // Check permissions
        const userObjectId = mongoose.isValidObjectId(userId)
            ? new mongoose.Types.ObjectId(userId)
            : null;

        if (payment.user.toString() !== userObjectId.toString()) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "You can only verify your own payments",
                },
            });
        }

        // If payment is already completed, return it
        if (payment.status === "completed") {
            console.log("[Payment Callback Verify] Payment already completed");
            const populatedPayment = await Payment.findById(paymentId)
                .populate("user", "fullName email")
                .populate("course", "title thumbnailUrl price")
                .lean();

            return res.json({
                success: true,
                payment: populatedPayment,
                message: "Payment already completed",
            });
        }

        // Fetch payment from Razorpay to verify status
        try {
            console.log("[Payment Callback Verify] Fetching payment from Razorpay:", razorpay_payment_id);
            const razorpayPayment = await fetchPayment(razorpay_payment_id);

            console.log("[Payment Callback Verify] Razorpay payment status:", {
                id: razorpayPayment.id,
                status: razorpayPayment.status,
                amount: razorpayPayment.amount,
                method: razorpayPayment.method,
            });

            // Check if payment is captured/authorized
            if (razorpayPayment.status === "captured" || razorpayPayment.status === "authorized") {
                console.log("[Payment Callback Verify] Payment is captured/authorized, updating database");

                const updateData = {
                    status: "completed",
                    gatewayTransactionId: razorpay_payment_id,
                };

                // Create enrollment if payment is for a course
                if (payment.course && !payment.metadata?.enrollmentCreated) {
                    try {
                        const existingEnrollment = await Enrollment.findOne({
                            student: payment.user,
                            course: payment.course,
                        }).lean();

                        if (!existingEnrollment) {
                            console.log("[Payment Callback Verify] Creating enrollment");
                            await Enrollment.create({
                                student: payment.user,
                                course: payment.course,
                                status: "active",
                                enrolledAt: new Date(),
                            });
                            updateData.metadata = {
                                ...payment.metadata,
                                enrollmentCreated: true,
                                enrollmentCreatedAt: new Date(),
                            };
                            console.log("[Payment Callback Verify] Enrollment created successfully");
                        } else {
                            console.log("[Payment Callback Verify] Enrollment already exists");
                        }
                    } catch (enrollmentError) {
                        console.error("[Payment Callback Verify] Error creating enrollment:", enrollmentError);
                    }
                }

                // Update payment
                await Payment.findByIdAndUpdate(paymentId, updateData);

                const updatedPayment = await Payment.findById(paymentId)
                    .populate("user", "fullName email")
                    .populate("course", "title thumbnailUrl price")
                    .lean();

                console.log("[Payment Callback Verify] Payment updated to completed");
                console.log("=========================================");

                return res.json({
                    success: true,
                    payment: updatedPayment,
                    message: "Payment verified and completed successfully",
                });
            } else if (razorpayPayment.status === "failed") {
                // Update payment as failed
                await Payment.findByIdAndUpdate(paymentId, {
                    status: "failed",
                    failureReason: razorpayPayment.error_description || "Payment failed",
                });

                return res.status(400).json({
                    error: {
                        code: "PAYMENT_FAILED",
                        message: "Payment failed",
                    },
                });
            } else {
                // Payment is still processing
                console.log("[Payment Callback Verify] Payment still processing:", razorpayPayment.status);
                return res.json({
                    success: false,
                    payment,
                    message: "Payment is still processing",
                    razorpayStatus: razorpayPayment.status,
                });
            }
        } catch (razorpayError) {
            console.error("[Payment Callback Verify] Error fetching from Razorpay:", razorpayError);
            return res.status(500).json({
                error: {
                    code: "RAZORPAY_ERROR",
                    message: "Failed to verify payment with Razorpay",
                },
            });
        }
    } catch (error) {
        console.error("[Payment Callback Verify] Error:", error);
        return next(error);
    }
};
