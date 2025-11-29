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
    // Try to get settings from database first
    const settings = await getSettings([
      "payment.gateway.razorpay.keyId",
      "payment.gateway.razorpay.keySecret",
    ]);

    const keyId = settings["payment.gateway.razorpay.keyId"] || process.env.RAZORPAY_KEY_ID;
    const keySecret = settings["payment.gateway.razorpay.keySecret"] || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials not configured. Please set keyId and keySecret in settings or environment variables.");
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    return razorpayInstance;
  } catch (error) {
    console.error("[Razorpay] Initialization error:", error);
    throw error;
  }
};

/**
 * Get Razorpay key ID for frontend
 */
export const getRazorpayKeyId = async () => {
  try {
    const settings = await getSettings(["payment.gateway.razorpay.keyId"]);
    return settings["payment.gateway.razorpay.keyId"] || process.env.RAZORPAY_KEY_ID || null;
  } catch (error) {
    console.error("[Razorpay] Error getting key ID:", error);
    return null;
  }
};

/**
 * Check if Razorpay is enabled
 */
export const isRazorpayEnabled = async () => {
  try {
    const settings = await getSettings(["payment.gateway.razorpay.enabled"]);
    return settings["payment.gateway.razorpay.enabled"] === true || settings["payment.gateway.razorpay.enabled"] === "true";
  } catch (error) {
    console.error("[Razorpay] Error checking if enabled:", error);
    return false;
  }
};

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in smallest currency unit (paise for INR)
 * @param {string} currency - Currency code (INR, AED, etc.)
 * @param {string} receipt - Receipt ID (usually payment ID)
 * @param {Object} notes - Additional notes/metadata
 * @returns {Promise<Object>} Razorpay order object
 */
export const createOrder = async (amount, currency, receipt, notes = {}) => {
  try {
    const razorpay = await initializeRazorpay();

    // Razorpay expects amount in smallest currency unit
    // For INR: paise (amount * 100)
    // For AED: fils (amount * 100)
    const amountInSmallestUnit = Math.round(amount * 100);

    // Razorpay primarily supports INR, but can handle other currencies
    // If currency is AED, we might need to convert or use INR
    const orderCurrency = currency === "AED" ? "INR" : (currency || "INR");

    const orderOptions = {
      amount: amountInSmallestUnit,
      currency: orderCurrency,
      receipt: receipt,
      notes: notes,
    };

    const order = await razorpay.orders.create(orderOptions);

    console.log(`[Razorpay] Order created successfully: ${order.id} for amount ${order.amount} ${order.currency}`);

    return {
      id: order.id,
      entity: order.entity,
      amount: order.amount,
      amount_paid: order.amount_paid,
      amount_due: order.amount_due,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      attempts: order.attempts,
      notes: order.notes,
      created_at: order.created_at,
    };
  } catch (error) {
    console.error("[Razorpay] Error creating order:", {
      error: error.message,
      stack: error.stack,
      amount,
      currency,
      receipt,
    });
    
    // Provide more specific error messages
    if (error.error?.description) {
      throw new Error(`Razorpay error: ${error.error.description}`);
    }
    throw new Error(`Failed to create Razorpay order: ${error.message}`);
  }
};

/**
 * Verify payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Payment signature from Razorpay
 * @returns {boolean} True if signature is valid
 */
export const verifyPaymentSignature = async (orderId, paymentId, signature) => {
  try {
    const keySecret = await getSettings(["payment.gateway.razorpay.keySecret"]).then(
      (settings) => settings["payment.gateway.razorpay.keySecret"] || process.env.RAZORPAY_KEY_SECRET
    );

    if (!keySecret) {
      throw new Error("Razorpay key secret not configured");
    }

    // Create signature string: orderId|paymentId
    const payload = `${orderId}|${paymentId}`;

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    // Compare signatures
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    
    if (!isValid) {
      console.warn("[Razorpay] Payment signature verification failed", {
        orderId,
        paymentId,
      });
    }
    
    return isValid;
  } catch (error) {
    console.error("[Razorpay] Error verifying signature:", {
      error: error.message,
      orderId,
      paymentId,
    });
    return false;
  }
};

/**
 * Verify webhook signature
 * @param {string} payload - Webhook payload (JSON string)
 * @param {string} signature - Webhook signature
 * @returns {boolean} True if signature is valid
 */
export const verifyWebhookSignature = async (payload, signature) => {
  try {
    const settings = await getSettings(["payment.gateway.razorpay.webhookSecret"]);
    const webhookSecret = settings["payment.gateway.razorpay.webhookSecret"] || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn("[Razorpay] Webhook secret not configured, skipping verification");
      return true; // Allow if not configured (for development)
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("[Razorpay] Error verifying webhook signature:", error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
export const fetchPayment = async (paymentId) => {
  try {
    const razorpay = await initializeRazorpay();
    const payment = await razorpay.payments.fetch(paymentId);
    console.log(`[Razorpay] Payment fetched: ${paymentId}, status: ${payment.status}`);
    return payment;
  } catch (error) {
    console.error("[Razorpay] Error fetching payment:", {
      error: error.message,
      paymentId,
      stack: error.stack,
    });
    
    if (error.statusCode === 404) {
      throw new Error(`Payment not found: ${paymentId}`);
    }
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
};

/**
 * Process refund
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount (in smallest currency unit)
 * @param {string} notes - Refund reason/notes
 * @returns {Promise<Object>} Refund details
 */
export const processRefund = async (paymentId, amount, notes = {}) => {
  try {
    const razorpay = await initializeRazorpay();

    // Amount should be in smallest currency unit
    const amountInSmallestUnit = Math.round(amount * 100);

    const refundOptions = {
      amount: amountInSmallestUnit,
      notes: notes,
    };

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return refund;
  } catch (error) {
    console.error("[Razorpay] Error processing refund:", error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Fetch order details
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<Object>} Order details
 */
export const fetchOrder = async (orderId) => {
  try {
    const razorpay = await initializeRazorpay();
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error("[Razorpay] Error fetching order:", error);
    throw new Error(`Failed to fetch order: ${error.message}`);
  }
};

/**
 * Create a Razorpay Payment Link for redirect-based payment
 * @param {number} amount - Amount in smallest currency unit (paise for INR)
 * @param {string} currency - Currency code (INR, AED, etc.)
 * @param {string} receipt - Receipt ID (usually payment ID)
 * @param {string} description - Payment description
 * @param {string} customerName - Customer name
 * @param {string} customerEmail - Customer email
 * @param {string} customerContact - Customer contact
 * @param {string} callbackUrl - URL to redirect after payment
 * @param {Object} notes - Additional notes/metadata
 * @returns {Promise<Object>} Payment link object with short_url
 */
export const createPaymentLink = async (
  amount,
  currency,
  receipt,
  description,
  customerName,
  customerEmail,
  customerContact,
  callbackUrl,
  notes = {}
) => {
  try {
    const razorpay = await initializeRazorpay();

    // Razorpay expects amount in smallest currency unit
    const amountInSmallestUnit = Math.round(amount * 100);

    // Razorpay primarily supports INR, but can handle other currencies
    const orderCurrency = currency === "AED" ? "INR" : (currency || "INR");

    // Validate required customer information
    if (!customerEmail || !customerEmail.trim()) {
      throw new Error("Customer email is required for Razorpay payment links");
    }

    // Ensure customer name is not empty
    const validCustomerName = customerName && customerName.trim() ? customerName.trim() : "Customer";

    // Validate callback URL format
    try {
      new URL(callbackUrl);
    } catch (urlError) {
      throw new Error(`Invalid callback URL format: ${callbackUrl}`);
    }

    const paymentLinkOptions = {
      amount: amountInSmallestUnit,
      currency: orderCurrency,
      description: description || "Payment",
      customer: {
        name: validCustomerName,
        email: customerEmail.trim(),
        contact: customerContact ? customerContact.trim() : "",
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
        ...notes,
      },
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);

    console.log(`[Razorpay] Payment link created successfully: ${paymentLink.id} - ${paymentLink.short_url}`);

    return {
      id: paymentLink.id,
      short_url: paymentLink.short_url,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      description: paymentLink.description,
      status: paymentLink.status,
      created_at: paymentLink.created_at,
    };
  } catch (error) {
    console.error("[Razorpay] Error creating payment link:", {
      error: error.message,
      stack: error.stack,
      amount,
      currency,
      receipt,
    });
    
    if (error.error?.description) {
      throw new Error(`Razorpay error: ${error.error.description}`);
    }
    throw new Error(`Failed to create Razorpay payment link: ${error.message}`);
  }
};

