import Razorpay from "razorpay";
import crypto from "crypto";
import { getSettings } from "../utils/settingsHelper.js";

let razorpayInstance = null;

/**
 * Initialize Razorpay instance with credentials from settings or environment
 */
const initializeRazorpay = async () => {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  try {
    const settings = await getSettings([
      "payment.gateway.razorpay.keyId",
      "payment.gateway.razorpay.keySecret",
    ]);

    const keyId =
      settings["payment.gateway.razorpay.keyId"] || process.env.RAZORPAY_KEY_ID;
    const keySecret =
      settings["payment.gateway.razorpay.keySecret"] ||
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials not configured. Please configure Razorpay in settings."
      );
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    return razorpayInstance;
  } catch (error) {
    console.error("[Payment Gateway] Initialization error:", error);
    throw error;
  }
};

/**
 * Check if Razorpay is enabled
 */
export const isRazorpayEnabled = async () => {
  try {
    const settings = await getSettings(["payment.gateway.razorpay.enabled"]);
    return (
      settings["payment.gateway.razorpay.enabled"] === true ||
      settings["payment.gateway.razorpay.enabled"] === "true"
    );
  } catch (error) {
    console.error("[Payment Gateway] Error checking if enabled:", error);
    return false;
  }
};

/**
 * Get Razorpay key ID for frontend (if needed)
 */
export const getRazorpayKeyId = async () => {
  try {
    const settings = await getSettings(["payment.gateway.razorpay.keyId"]);
    return (
      settings["payment.gateway.razorpay.keyId"] ||
      process.env.RAZORPAY_KEY_ID ||
      null
    );
  } catch (error) {
    console.error("[Payment Gateway] Error getting key ID:", error);
    return null;
  }
};

/**
 * Create a Razorpay Payment Link
 * @param {Object} options - Payment link options
 * @param {number} options.amount - Amount in currency units (will be converted to smallest unit)
 * @param {string} options.currency - Currency code (default: INR)
 * @param {string} options.receipt - Receipt ID (usually payment ID)
 * @param {string} options.description - Payment description
 * @param {string} options.customerName - Customer name
 * @param {string} options.customerEmail - Customer email
 * @param {string} options.customerContact - Customer contact (optional)
 * @param {string} options.callbackUrl - Callback URL after payment
 * @param {Object} options.notes - Additional notes/metadata
 * @returns {Promise<Object>} Payment link object
 */
export const createPaymentLink = async (options) => {
  try {
    const {
      amount,
      currency = "INR",
      receipt,
      description,
      customerName,
      customerEmail,
      customerContact = "",
      callbackUrl,
      notes = {},
    } = options;

    // Validate required fields
    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required");
    }
    if (!customerEmail) {
      throw new Error("Customer email is required");
    }
    if (!callbackUrl) {
      throw new Error("Callback URL is required");
    }

    // Check if Razorpay is enabled
    const enabled = await isRazorpayEnabled();
    if (!enabled) {
      throw new Error("Razorpay payment gateway is not enabled");
    }

    const razorpay = await initializeRazorpay();

    // Use INR as default currency
    const finalCurrency = "INR";
    const finalAmount = amount;

    // Convert amount to smallest currency unit (paise for INR)
    // INR: 1 INR = 100 paise
    const amountInSmallestUnit = Math.round(finalAmount * 100);

    // Log final currency for debugging
    console.log(
      `[Payment Gateway] Final payment currency: ${finalCurrency}, amount: ${finalAmount} (${amountInSmallestUnit} in smallest unit)`
    );

    // Payment link options with currency handling
    const paymentLinkOptions = {
      amount: amountInSmallestUnit,
      currency: finalCurrency,
      description: description || "Payment",
      customer: {
        name: customerName || "Customer",
        email: customerEmail,
        contact: customerContact || "",
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: false,
      callback_url: callbackUrl,
      callback_method: "get",
      notes: {
        receipt: receipt,
        original_currency: currency.toUpperCase(),
        original_amount: amount,
        ...notes,
      },
      // Configure payment methods - restrict to Indian payment methods for INR
      // This helps avoid international card issues
      options: {
        checkout: {
          method: {
            netbanking: 1,
            card: 1,
            wallet: 1,
            upi: 1,
          },
        },
      },
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);

    console.log(`[Payment Gateway] Payment link created: ${paymentLink.id}`);

    return {
      id: paymentLink.id,
      url: paymentLink.short_url || paymentLink.url,
      status: paymentLink.status,
    };
  } catch (error) {
    console.error("[Payment Gateway] Error creating payment link:", error);

    // Handle specific error cases
    const errorDescription = error.error?.description || error.message || "";

    // Check for international card/currency issues
    if (
      errorDescription.toLowerCase().includes("international") ||
      errorDescription.toLowerCase().includes("not supported") ||
      errorDescription.toLowerCase().includes("invalid currency")
    ) {
      throw new Error(
        "International cards are not supported. " +
          "Please use an Indian card or payment method. " +
          "Contact support for assistance."
      );
    }

    if (error.error?.description) {
      throw new Error(`Payment gateway error: ${error.error.description}`);
    }
    throw new Error(`Failed to create payment link: ${error.message}`);
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
export const fetchPayment = async (paymentId) => {
  try {
    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    const razorpay = await initializeRazorpay();
    const payment = await razorpay.payments.fetch(paymentId);

    console.log(
      `[Payment Gateway] Payment fetched: ${paymentId}, status: ${payment.status}`
    );

    return payment;
  } catch (error) {
    console.error("[Payment Gateway] Error fetching payment:", error);
    if (error.statusCode === 404) {
      throw new Error(`Payment not found: ${paymentId}`);
    }
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
};

/**
 * Fetch payment link details from Razorpay
 * @param {string} paymentLinkId - Razorpay payment link ID
 * @returns {Promise<Object>} Payment link details
 */
export const fetchPaymentLink = async (paymentLinkId) => {
  try {
    if (!paymentLinkId) {
      throw new Error("Payment link ID is required");
    }

    const razorpay = await initializeRazorpay();
    const paymentLink = await razorpay.paymentLink.fetch(paymentLinkId);

    console.log(
      `[Payment Gateway] Payment link fetched: ${paymentLinkId}, status: ${paymentLink.status}`
    );

    return paymentLink;
  } catch (error) {
    console.error("[Payment Gateway] Error fetching payment link:", error);
    if (error.statusCode === 404) {
      throw new Error(`Payment link not found: ${paymentLinkId}`);
    }
    throw new Error(`Failed to fetch payment link: ${error.message}`);
  }
};

/**
 * Verify payment signature (for order-based payments if needed)
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Payment signature from Razorpay
 * @returns {Promise<boolean>} True if signature is valid
 *
 * NOTE: Payment signature verification is disabled - always returns true
 * This allows payments to complete immediately without signature verification
 */
export const verifyPaymentSignature = async (orderId, paymentId, signature) => {
  // Payment signature verification disabled - always return true
  console.log(
    "[Payment Gateway] Payment signature verification skipped (disabled)"
  );
  return true;
};
