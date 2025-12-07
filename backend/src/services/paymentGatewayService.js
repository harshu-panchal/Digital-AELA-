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

    const keyId = settings["payment.gateway.razorpay.keyId"] || process.env.RAZORPAY_KEY_ID;
    const keySecret = settings["payment.gateway.razorpay.keySecret"] || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials not configured. Please configure Razorpay in settings.");
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
    return settings["payment.gateway.razorpay.enabled"] === true || settings["payment.gateway.razorpay.enabled"] === "true";
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
    return settings["payment.gateway.razorpay.keyId"] || process.env.RAZORPAY_KEY_ID || null;
  } catch (error) {
    console.error("[Payment Gateway] Error getting key ID:", error);
    return null;
  }
};

/**
 * Create a Razorpay Payment Link
 * @param {Object} options - Payment link options
 * @param {number} options.amount - Amount in currency units (will be converted to smallest unit)
 * @param {string} options.currency - Currency code (default: AED)
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
      currency = "AED",
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

    // Get all settings including key ID to detect test keys
    const allSettings = await getSettings([
      "payment.currency.convertAEDtoINR",
      "payment.currency.aedToInrRate",
      "payment.gateway.razorpay.keyId",
    ]);
    
    // Detect if using test keys (test keys have more restrictions)
    const keyId = allSettings["payment.gateway.razorpay.keyId"] || process.env.RAZORPAY_KEY_ID || "";
    const isTestKey = keyId.startsWith("rzp_test_");

    // Handle currency conversion for Razorpay compatibility
    // Most Razorpay accounts (including test) support INR by default
    // AED requires international payments to be enabled in Razorpay dashboard
    const razorpayCurrency = currency.toUpperCase();
    
    // Get exchange rate
    const aedToInrRate = parseFloat(allSettings["payment.currency.aedToInrRate"] || "22.5"); // Default: 1 AED = 22.5 INR
    
    let finalCurrency = razorpayCurrency;
    let finalAmount = amount;
    
    // FOR TEST KEYS: ALWAYS convert AED to INR (test accounts NEVER support international/AED)
    // FOR LIVE KEYS: Convert by default (can be disabled if international payments enabled)
    if (razorpayCurrency === "AED") {
      if (isTestKey) {
        // Test keys MUST use INR - no exceptions
        finalCurrency = "INR";
        finalAmount = Math.round(amount * aedToInrRate * 100) / 100; // Round to 2 decimal places
        console.log(`[Payment Gateway] TEST KEY DETECTED: Forcing conversion from ${amount} AED to ${finalAmount} INR (rate: ${aedToInrRate})`);
        console.log(`[Payment Gateway] Test accounts do not support AED/international cards - conversion is mandatory`);
      } else {
        // Live keys: Convert by default (unless explicitly disabled)
        const convertToINR = allSettings["payment.currency.convertAEDtoINR"] !== false && 
                             allSettings["payment.currency.convertAEDtoINR"] !== "false";
        
        if (convertToINR) {
          finalCurrency = "INR";
          finalAmount = Math.round(amount * aedToInrRate * 100) / 100;
          console.log(`[Payment Gateway] Converting ${amount} AED to ${finalAmount} INR (rate: ${aedToInrRate})`);
        }
      }
      
      if (finalCurrency === "INR") {
        console.log(`[Payment Gateway] Payment will be processed in INR to avoid international card issues`);
      }
    }

    // Safety check: Ensure test keys NEVER use AED
    if (isTestKey && finalCurrency === "AED") {
      throw new Error(
        "Test Razorpay keys do not support AED currency. " +
        "Currency conversion failed. Please check configuration or use INR currency directly."
      );
    }

    // Convert amount to smallest currency unit (fils for AED, paise for INR)
    // AED: 1 AED = 100 fils, INR: 1 INR = 100 paise
    const amountInSmallestUnit = Math.round(finalAmount * 100);
    
    // Log final currency for debugging
    console.log(`[Payment Gateway] Final payment currency: ${finalCurrency}, amount: ${finalAmount} (${amountInSmallestUnit} in smallest unit)`);

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
        converted_currency: finalCurrency,
        converted_amount: finalAmount,
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
    if (errorDescription.toLowerCase().includes("international") || 
        errorDescription.toLowerCase().includes("not supported") ||
        errorDescription.toLowerCase().includes("invalid currency")) {
      throw new Error(
        "International cards or AED currency are not supported. " +
        "Please enable international payments in Razorpay dashboard or use currency conversion. " +
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

    console.log(`[Payment Gateway] Payment fetched: ${paymentId}, status: ${payment.status}`);

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
 * Verify payment signature (for order-based payments if needed)
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Payment signature from Razorpay
 * @returns {Promise<boolean>} True if signature is valid
 */
export const verifyPaymentSignature = async (orderId, paymentId, signature) => {
  try {
    const settings = await getSettings(["payment.gateway.razorpay.keySecret"]);
    const keySecret = settings["payment.gateway.razorpay.keySecret"] || process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new Error("Razorpay key secret not configured");
    }

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("[Payment Gateway] Error verifying signature:", error);
    return false;
  }
};

