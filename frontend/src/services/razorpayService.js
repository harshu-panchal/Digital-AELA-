/**
 * Razorpay Service for Frontend
 * Handles Razorpay Checkout integration
 */

let razorpayScriptLoaded = false;
let razorpayScriptLoading = false;

/**
 * Load Razorpay Checkout script
 */
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (razorpayScriptLoaded) {
      resolve();
      return;
    }

    if (razorpayScriptLoading) {
      // Wait for existing load to complete
      const checkInterval = setInterval(() => {
        if (razorpayScriptLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    razorpayScriptLoading = true;

    // Check if script already exists
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      razorpayScriptLoaded = true;
      razorpayScriptLoading = false;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      razorpayScriptLoaded = true;
      razorpayScriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      razorpayScriptLoading = false;
      reject(new Error("Failed to load Razorpay checkout script"));
    };
    document.body.appendChild(script);
  });
};

/**
 * Initialize Razorpay Checkout
 * @param {string} keyId - Razorpay key ID
 * @param {Object} orderData - Order data from backend
 * @param {Function} onSuccess - Success callback
 * @param {Function} onFailure - Failure callback
 */
export const openRazorpayCheckout = async (keyId, orderData, onSuccess, onFailure) => {
  try {
    // Load Razorpay script if not already loaded
    await loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error("Razorpay SDK not loaded");
    }

    const options = {
      key: keyId,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "Digital AELA",
      description: orderData.payment.description || "Payment",
      order_id: orderData.order.id,
      handler: async function (response) {
        // Payment successful, verify with backend
        try {
          if (onSuccess) {
            await onSuccess({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
          }
        } catch (error) {
          console.error("[Razorpay] Error in success handler:", error);
          if (onFailure) {
            onFailure(error);
          }
        }
      },
      prefill: {
        name: orderData.payment.user?.fullName || "",
        email: orderData.payment.user?.email || "",
        contact: "",
      },
      notes: {
        payment_id: orderData.payment.id,
        ...orderData.order.notes,
      },
      theme: {
        color: "#D4AF37",
      },
      modal: {
        ondismiss: function () {
          if (onFailure) {
            onFailure(new Error("Payment cancelled by user"));
          }
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", function (response) {
      console.error("[Razorpay] Payment failed:", response);
      if (onFailure) {
        onFailure(new Error(response.error.description || "Payment failed"));
      }
    });

    razorpay.open();
  } catch (error) {
    console.error("[Razorpay] Error opening checkout:", {
      error: error.message,
      keyId,
      orderId: orderData.order.id,
    });
    if (onFailure) {
      onFailure(error);
    }
  }
};

/**
 * Check if Razorpay is available
 */
export const isRazorpayAvailable = () => {
  return typeof window !== "undefined" && window.Razorpay !== undefined;
};

