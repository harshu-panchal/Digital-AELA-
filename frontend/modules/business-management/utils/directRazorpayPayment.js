import { toast } from "react-toastify";
import {
  createPayment,
  createRazorpayPaymentLink,
} from "../../../src/services/api/payments";

/**
 * Direct Razorpay Payment - Skip custom payment page and go straight to Razorpay
 * @param {Object} options - Payment options
 * @param {string} options.courseId - Course ID (optional)
 * @param {string} options.bookId - Book ID (optional)
 * @param {number} options.amount - Payment amount
 * @param {string} options.currency - Currency (default: INR)
 * @param {string} options.description - Payment description
 * @param {string} options.userName - User's full name
 * @param {string} options.userEmail - User's email
 * @param {string} options.userPhone - User's phone (optional)
 * @param {number} options.quantity - Quantity (default: 1)
 */
export const redirectToRazorpay = async (options) => {
  try {
    const {
      courseId,
      bookId,
      amount,
      currency = "INR",
      description,
      userName = "",
      userEmail = "",
      userPhone = "",
      quantity = 1,
    } = options;

    // Validate amount
    const numericAmount =
      typeof amount === "number" ? amount : parseFloat(amount);

    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      console.error("[Payment] Invalid payment amount:", {
        amount,
        numericAmount,
        options,
      });
      toast.error(
        `Invalid payment amount: ${amount}. Please check the price and try again.`
      );
      return;
    }

    // Show loading toast
    toast.info("Preparing payment...", { autoClose: 2000 });

    // Step 1: Create payment record
    const paymentResponse = await createPayment({
      courseId: courseId || null,
      amount: amount * quantity, // Total amount
      currency: currency,
      description:
        description ||
        (courseId ? "Course enrollment" : bookId ? "Book purchase" : "Payment"),
      paymentMethod: "card",
      gateway: "razorpay",
    });

    if (!paymentResponse?.payment?._id) {
      throw new Error("Failed to create payment record");
    }

    const paymentId = paymentResponse.payment._id;

    // Step 2: Create Razorpay Payment Link
    // For localhost, don't pass callback URL - let backend use its default backend callback endpoint
    // Razorpay can't redirect to localhost URLs, so backend callback endpoint is used instead
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const callbackUrl = isLocalhost
      ? null // Let backend set the default callback URL (backend callback endpoint)
      : `${window.location.origin}/payment/callback?paymentId=${paymentId}`;
    const linkResponse = await createRazorpayPaymentLink(
      paymentId,
      callbackUrl
    );

    if (
      !linkResponse?.paymentLink?.short_url &&
      !linkResponse?.paymentLink?.url
    ) {
      throw new Error("Failed to create Razorpay payment link");
    }

    // Step 3: Redirect to Razorpay's payment page
    toast.success("Redirecting to payment page...", { autoClose: 1000 });
    window.location.href =
      linkResponse.paymentLink.short_url || linkResponse.paymentLink.url;
  } catch (error) {
    console.error("[Payment] Error redirecting to Razorpay:", error);
    toast.error(
      error.message || "Failed to process payment. Please try again."
    );
  }
};
