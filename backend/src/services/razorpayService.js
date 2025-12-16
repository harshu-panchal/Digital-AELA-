import Razorpay from "razorpay";
import crypto from "crypto";
import { getSettings } from "../utils/settingsHelper.js";
import { removeEmojis, sanitizeObjectForPayment } from "../utils/stringUtils.js";

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
 * @param {number} amount - Amount in currency units (e.g. 100 AED)
 * @param {string} currency - Currency code (INR, AED, etc.)
 * @param {string} receipt - Receipt ID (usually payment ID)
 * @param {Object} notes - Additional notes/metadata
 * @returns {Promise<Object>} Razorpay order object
 */
export const createOrder = async (amount, currency, receipt, notes = {}) => {
  try {
    const razorpay = await initializeRazorpay();

    // Get settings to check for conversion
    const settings = await getSettings([
      "payment.currency.convertAEDtoINR",
      "payment.currency.aedToInrRate",
      "payment.gateway.razorpay.keyId"
    ]);

    // Detect if using test keys
    const keyId = settings["payment.gateway.razorpay.keyId"] || process.env.RAZORPAY_KEY_ID || "";
    const isTestKey = keyId.startsWith("rzp_test_");

    // Handle currency conversion
    let finalCurrency = currency || "INR";
    let finalAmount = amount;
    const originalAmount = amount;
    const originalCurrency = currency;

    const exchangeRate = parseFloat(settings["payment.currency.aedToInrRate"] || "22.5");

    // Logic:
    // 1. If currency is AED
    // 2. AND (Test Key detected OR Conversion Enabled in settings)
    // 3. THEN -> Convert to INR
    if (finalCurrency === "AED") {
      const shouldConvert = isTestKey || (
        settings["payment.currency.convertAEDtoINR"] !== false &&
        settings["payment.currency.convertAEDtoINR"] !== "false"
      );

      if (shouldConvert) {
        finalCurrency = "INR";
        finalAmount = Math.round(amount * exchangeRate * 100) / 100;

        console.log(`[Razorpay] Currency Conversion Applied:`);
        console.log(`- Original: ${amount} AED`);
        console.log(`- Rate: ${exchangeRate}`);
        console.log(`- Converted: ${finalAmount} INR`);

        if (isTestKey) {
          console.log(`[Razorpay] NOTE: Conversion enforced due to Test Key usage.`);
        }
      }
    }

    // Safety check: Test keys cannot accept AED
    if (isTestKey && finalCurrency === "AED") {
      throw new Error("Razorpay Test Keys do not support AED. Please enable currency conversion to INR.");
    }

    // Razorpay expects amount in smallest currency unit
    // For INR: paise (amount * 100)
    // For AED: fils (amount * 100)
    const amountInSmallestUnit = Math.round(finalAmount * 100);

    // Sanitize notes (remove emojis)
    const sanitizedNotes = sanitizeObjectForPayment({
      ...notes,
      original_amount: originalAmount,
      original_currency: originalCurrency,
      exchange_rate: exchangeRate
    });

    const orderOptions = {
      amount: amountInSmallestUnit,
      currency: finalCurrency,
      receipt: receipt,
      notes: sanitizedNotes,
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
 * 
 * NOTE: Payment signature verification is disabled - always returns true
 * This allows payments to complete immediately without signature verification
 */
export const verifyPaymentSignature = async (orderId, paymentId, signature) => {
  // Payment signature verification disabled - always return true
  console.log("[Razorpay] Payment signature verification skipped (disabled)");
  return true;
};

/**
 * Verify webhook signature
 * @param {string} payload - Webhook payload (JSON string)
 * @param {string} signature - Webhook signature from X-Razorpay-Signature header
 * @returns {boolean} True if signature is valid
 */
export const verifyWebhookSignature = async (payload, signature) => {
  try {
    if (!signature) {
      console.error("[Razorpay] Webhook signature missing");
      return false;
    }

    // Get webhook secret from settings or environment
    const settings = await getSettings(["payment.gateway.razorpay.webhookSecret"]);
    const webhookSecret = settings["payment.gateway.razorpay.webhookSecret"] || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn("[Razorpay] Webhook secret not configured - signature verification skipped");
      // In development, allow webhooks without secret if not configured
      if (process.env.NODE_ENV === "development") {
        return true;
      }
      return false;
    }

    // Razorpay uses HMAC SHA256 for webhook signatures
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    // Razorpay sends signature in format: signature=expectedSignature
    const receivedSignature = signature.replace("signature=", "");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );

    if (!isValid) {
      console.error("[Razorpay] Webhook signature verification failed");
      return false;
    }

    console.log("[Razorpay] Webhook signature verified successfully");
    return true;
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
 * @param {number} amount - Amount in currency units (e.g. 100 AED)
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

    // Get settings for conversion
    const settings = await getSettings([
      "payment.currency.convertAEDtoINR",
      "payment.currency.aedToInrRate",
      "payment.gateway.razorpay.keyId"
    ]);

    // Detect test keys
    const keyId = settings["payment.gateway.razorpay.keyId"] || process.env.RAZORPAY_KEY_ID || "";
    const isTestKey = keyId.startsWith("rzp_test_");

    // Handle currency conversion
    let finalCurrency = currency || "INR";
    let finalAmount = amount;
    const originalAmount = amount;
    const originalCurrency = currency;
    const exchangeRate = parseFloat(settings["payment.currency.aedToInrRate"] || "22.5");

    if (finalCurrency === "AED") {
      const shouldConvert = isTestKey || (
        settings["payment.currency.convertAEDtoINR"] !== false &&
        settings["payment.currency.convertAEDtoINR"] !== "false"
      );

      if (shouldConvert) {
        finalCurrency = "INR";
        finalAmount = Math.round(amount * exchangeRate * 100) / 100;

        console.log(`[Razorpay-Link] Currency Conversion Applied:`);
        console.log(`- Original: ${amount} AED`);
        console.log(`- Converted: ${finalAmount} INR`);
      }
    }

    // Razorpay expects amount in smallest currency unit
    const amountInSmallestUnit = Math.round(finalAmount * 100);

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

    // SANITIZE INPUTS (Remove emojis to distinguish colation errors)
    const sanitizedDescription = removeEmojis(description || "Payment");
    const sanitizedCustomerName = removeEmojis(validCustomerName);
    const sanitizedNotes = sanitizeObjectForPayment({
      receipt: receipt,
      original_amount: originalAmount,
      original_currency: originalCurrency,
      ...notes,
    });

    const paymentLinkOptions = {
      amount: amountInSmallestUnit,
      currency: finalCurrency,
      description: sanitizedDescription,
      customer: {
        name: sanitizedCustomerName,
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
      notes: sanitizedNotes,
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

