import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { getPaymentDetails, verifyPaymentStatus } from "../../src/services/api/payments";
import SEO from "../../src/components/SEO";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get("paymentId");
  const paymentStatus = searchParams.get("status");
  const payment_id = searchParams.get("payment_id");
  const errorMessage = searchParams.get("error");

  useEffect(() => {
    const handleCallback = async () => {
      console.log("==========================================");
      console.log("[Payment Callback Frontend] Received parameters");
      console.log("URL Search Params:", {
        paymentId,
        paymentStatus,
        payment_id,
        errorMessage,
      });
      console.log("==========================================");

      if (errorMessage) {
        console.log("[Payment Callback Frontend] Error message found:", errorMessage);
        setStatus("error");
        setError(errorMessage);
        return;
      }

      if (!paymentId) {
        console.log("[Payment Callback Frontend] No paymentId found");
        setStatus("error");
        setError("Payment ID not found");
        return;
      }

      try {
        // Method 1: If we have razorpay_payment_id, try immediate verification
        if (payment_id) {
          console.log("[Payment Callback Frontend] Attempting immediate verification with ID:", payment_id);
          try {
            // Determine which verification function to use
            // If verifyWithRazorpayCallback wasn't imported yet, we might need to rely on existing one or polling
            const { verifyWithRazorpayCallback } = await import("../../src/services/api/payments");

            if (verifyWithRazorpayCallback) {
              const verifyResult = await verifyWithRazorpayCallback(paymentId, payment_id);
              console.log("[Payment Callback Frontend] Immediate verification result:", verifyResult);

              if (verifyResult.success || verifyResult.verified || verifyResult.payment?.status === "completed") {
                setStatus("success");
                setPayment(verifyResult.payment);
                toast.success("Payment successful!");

                setTimeout(() => {
                  if (verifyResult.payment?.course) {
                    const courseId = verifyResult.payment.course._id || verifyResult.payment.course;
                    navigate(`/courses/${courseId}`);
                  } else {
                    navigate("/student/payments");
                  }
                }, 2000);
                return; // Exit successfully
              }
            }
          } catch (verifyErr) {
            console.warn("[Payment Callback Frontend] Immediate verification failed, falling back to polling:", verifyErr);
            // Fallthrough to polling
          }
        }

        // Method 2: Fallback to polling (checking DB status)
        console.log("[Payment Callback Frontend] Starting status polling...");

        // Fetch initially to check if already completed
        const paymentData = await getPaymentDetails(paymentId);
        setPayment(paymentData.payment);
        const currentStatus = paymentData.payment?.status;

        console.log("[Payment Callback Frontend] Initial DB status:", currentStatus);

        if (currentStatus === "completed") {
          setStatus("success");
          toast.success("Payment successful!");
          setTimeout(() => {
            if (paymentData.payment?.course) {
              const courseId = paymentData.payment.course._id || paymentData.payment.course;
              navigate(`/courses/${courseId}`);
            } else {
              navigate("/student/payments");
            }
          }, 3000);
        } else if (currentStatus === "failed") {
          setStatus("failed");
          toast.error("Payment failed. Please try again.");
        } else {
          // Payment is processing - poll for updates
          setStatus("processing");

          // Poll with intervals: 2s, 3s, 5s, 5s, 5s (total ~20 seconds)
          const pollIntervals = [2000, 3000, 5000, 5000, 5000];
          let pollAttempt = 0;

          const pollPaymentStatus = async () => {
            if (pollAttempt >= pollIntervals.length) {
              // Time out - likely webhook delayed
              console.log("[Payment Callback Frontend] Polling timed out, redirecting...");
              toast.info("Payment is being verified in background. Please check your payments page shortly.");
              setTimeout(() => {
                navigate("/student/payments");
              }, 3000);
              return;
            }

            const delay = pollIntervals[pollAttempt];
            console.log(`[Payment Callback Frontend] Polling attempt ${pollAttempt + 1}/${pollIntervals.length} in ${delay}ms`);

            setTimeout(async () => {
              try {
                const updatedPayment = await getPaymentDetails(paymentId);

                console.log("[Payment Callback Frontend] Poll result:", updatedPayment.payment?.status);

                if (updatedPayment.payment?.status === "completed") {
                  setStatus("success");
                  setPayment(updatedPayment.payment);
                  toast.success("Payment successful!");
                  setTimeout(() => {
                    if (updatedPayment.payment?.course) {
                      const courseId = updatedPayment.payment.course._id || updatedPayment.payment.course;
                      navigate(`/courses/${courseId}`);
                    } else {
                      navigate("/student/payments");
                    }
                  }, 3000);
                } else if (updatedPayment.payment?.status === "failed") {
                  setStatus("failed");
                  toast.error("Payment failed. Please try again.");
                } else {
                  // Still processing, continue polling
                  pollAttempt++;
                  pollPaymentStatus();
                }
              } catch (err) {
                console.error(`[Payment Callback Frontend] Poll error:`, err);
                pollAttempt++;
                pollPaymentStatus();
              }
            }, delay);
          };

          // Start polling
          pollPaymentStatus();
        }
      } catch (err) {
        console.error("[Payment Callback Frontend] Critical error:", err);
        setStatus("error");
        setError(err.message || "Failed to verified payment details");
      }
    };

    handleCallback();
  }, [paymentId, paymentStatus, payment_id, errorMessage, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <SEO
        title="Payment Status | Digital AELA"
        description="Payment processing status"
        url="https://digitalaela.com/payment/callback"
      />

      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-[#1a1a1a] rounded-xl p-8 border border-[#D4AF37]/20 text-center">
          {status === "loading" && (
            <>
              <FaSpinner className="w-16 h-16 text-[#D4AF37] animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2 font-display">
                Processing Payment...
              </h2>
              <p className="text-gray-400">
                Please wait while we verify your payment.
              </p>
            </>
          )}

          {status === "processing" && (
            <>
              <FaSpinner className="w-16 h-16 text-[#D4AF37] animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2 font-display">
                Verifying Payment...
              </h2>
              <p className="text-gray-400">
                Your payment is being verified. This may take a few moments.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Please do not close this page.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2 font-display">
                Payment Successful!
              </h2>
              {payment && (
                <div className="mt-4 space-y-2">
                  <p className="text-gray-300">
                    Amount: {payment.amount} {payment.currency}
                  </p>
                  {payment.course && (
                    <p className="text-gray-300">
                      Course: {payment.course.title || payment.course}
                    </p>
                  )}
                </div>
              )}
              <p className="text-gray-400 mt-4">
                Redirecting you in a moment...
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2 font-display">
                Payment Failed
              </h2>
              <p className="text-gray-400 mb-6">
                Your payment could not be processed. Please try again.
              </p>
              <button
                onClick={() => navigate("/student/payments")}
                className="bg-[#D4AF37] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#E5C158] transition-colors"
              >
                Go to Payments
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2 font-display">
                Error
              </h2>
              <p className="text-gray-400 mb-6">
                {error || "An error occurred while processing your payment."}
              </p>
              <button
                onClick={() => navigate("/student/payments")}
                className="bg-[#D4AF37] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#E5C158] transition-colors"
              >
                Go to Payments
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;




