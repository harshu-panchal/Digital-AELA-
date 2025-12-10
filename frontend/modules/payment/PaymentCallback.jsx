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
      // Log all URL parameters received
      console.log("==========================================");
      console.log("[Payment Callback Frontend] Received parameters:");
      console.log("URL Search Params:", {
        paymentId,
        paymentStatus,
        payment_id,
        errorMessage,
        allParams: Object.fromEntries(searchParams.entries()),
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
        console.log("[Payment Callback Frontend] Fetching payment details for:", paymentId);
        // Fetch payment details to check status
        const paymentData = await getPaymentDetails(paymentId);
        setPayment(paymentData.payment);

        console.log("[Payment Callback Frontend] Payment data received:", {
          paymentId,
          paymentStatusFromURL: paymentStatus,
          paymentStatusFromDB: paymentData.payment?.status,
          paymentData: {
            id: paymentData.payment?._id,
            status: paymentData.payment?.status,
            amount: paymentData.payment?.amount,
            gatewayTransactionId: paymentData.payment?.gatewayTransactionId,
            course: paymentData.payment?.course ? "present" : "missing",
          },
        });

        // Normalize status from URL - treat "unknown" as "processing"
        const normalizedStatus = paymentStatus === "unknown" || !paymentStatus ? "processing" : paymentStatus;
        
        // Check for success status from URL or payment record
        const isSuccess = normalizedStatus === "success" || normalizedStatus === "paid" || paymentData.payment?.status === "completed";
        const isFailed = normalizedStatus === "failed" || paymentData.payment?.status === "failed";

        console.log("[Payment Callback Frontend] Status determination:", {
          isSuccess,
          isFailed,
          paymentStatusFromURL: paymentStatus,
          normalizedStatus,
          paymentStatusFromDB: paymentData.payment?.status,
          conditions: {
            urlSuccess: normalizedStatus === "success",
            urlPaid: normalizedStatus === "paid",
            dbCompleted: paymentData.payment?.status === "completed",
            urlFailed: normalizedStatus === "failed",
            dbFailed: paymentData.payment?.status === "failed",
          },
        });

        if (isSuccess) {
          console.log("[Payment Callback Frontend] Setting status to SUCCESS");
          setStatus("success");
          toast.success("Payment successful!");

          // Redirect based on payment type
          setTimeout(() => {
            if (paymentData.payment?.course) {
              const courseId = paymentData.payment.course._id || paymentData.payment.course;
              console.log("[Payment Callback Frontend] Redirecting to course:", courseId);
              navigate(`/courses/${courseId}`);
            } else {
              console.log("[Payment Callback Frontend] Redirecting to payments page");
              navigate("/student/payments");
            }
          }, 3000);
        } else if (isFailed) {
          console.log("[Payment Callback Frontend] Setting status to FAILED");
          setStatus("failed");
          toast.error("Payment failed. Please try again.");
        } else {
          // Payment is processing - implement exponential backoff polling
          console.log("[Payment Callback Frontend] Setting status to PROCESSING, will poll with exponential backoff");
          setStatus("processing");
          
          // Exponential backoff intervals: 2s, 5s, 10s, 20s, 30s (total ~67 seconds)
          const pollIntervals = [2000, 5000, 10000, 20000, 30000];
          let pollAttempt = 0;
          let totalWaitTime = 0;
          
          const pollPaymentStatus = async () => {
            if (pollAttempt >= pollIntervals.length) {
              // After all retries, try manual verification from Razorpay one last time
              try {
                console.log("[Payment Callback Frontend] Final check: Trying manual verification from Razorpay");
                const verifyResult = await verifyPaymentStatus(paymentId);
                
                if (verifyResult.verified && verifyResult.payment?.status === "completed") {
                  console.log("[Payment Callback Frontend] Payment completed on final verification");
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
                  }, 3000);
                } else {
                  // Fallback to regular check
                  const finalPayment = await getPaymentDetails(paymentId);
                  
                  if (finalPayment.payment?.status === "completed") {
                    console.log("[Payment Callback Frontend] Payment completed on final check");
                    setStatus("success");
                    setPayment(finalPayment.payment);
                    toast.success("Payment successful!");
                    setTimeout(() => {
                      if (finalPayment.payment?.course) {
                        const courseId = finalPayment.payment.course._id || finalPayment.payment.course;
                        navigate(`/courses/${courseId}`);
                      } else {
                        navigate("/student/payments");
                      }
                    }, 3000);
                  } else {
                    console.log("[Payment Callback Frontend] Payment still not completed after all retries, marking as failed");
                    setStatus("failed");
                    toast.error("Payment verification is taking longer than expected. The payment may still be processing. Please check your payment status in a few moments.");
                  }
                }
              } catch (err) {
                // Handle 404 gracefully - endpoint might not be deployed yet
                if (err.message?.includes('404') || err.message?.includes('Not Found')) {
                  console.log("[Payment Callback Frontend] Verify-status endpoint not available (404) on final check, using regular check instead");
                } else {
                  console.error("[Payment Callback Frontend] Error on final check:", err);
                }
                // Always try one last regular check
                try {
                  const finalPayment = await getPaymentDetails(paymentId);
                  if (finalPayment.payment?.status === "completed") {
                    setStatus("success");
                    setPayment(finalPayment.payment);
                    toast.success("Payment successful!");
                    setTimeout(() => {
                      if (finalPayment.payment?.course) {
                        const courseId = finalPayment.payment.course._id || finalPayment.payment.course;
                        navigate(`/courses/${courseId}`);
                      } else {
                        navigate("/student/payments");
                      }
                    }, 3000);
                  } else {
                    setStatus("failed");
                    toast.error("Payment verification is taking longer than expected. Your payment may still be processing - please check the payments page in a few moments or contact support if the issue persists.");
                  }
                } catch (finalErr) {
                  console.error("[Payment Callback Frontend] Error on final fallback check:", finalErr);
                  setStatus("failed");
                  toast.error("Payment verification timed out. Please check your payment status in the payments page.");
                }
              }
              return;
            }
            
            const delay = pollIntervals[pollAttempt];
            totalWaitTime += delay;
            
            console.log(`[Payment Callback Frontend] Polling attempt ${pollAttempt + 1}/${pollIntervals.length} after ${delay}ms (total: ${totalWaitTime}ms)`);
            
            setTimeout(async () => {
              try {
                // On later attempts (3rd and beyond), also try manual verification from Razorpay
                let updatedPayment;
                if (pollAttempt >= 2) {
                  console.log(`[Payment Callback Frontend] Attempt ${pollAttempt + 1}: Trying manual verification from Razorpay`);
                  try {
                    const verifyResult = await verifyPaymentStatus(paymentId);
                    if (verifyResult.verified && verifyResult.payment) {
                      updatedPayment = { payment: verifyResult.payment };
                      console.log("[Payment Callback Frontend] Manual verification successful:", {
                        status: verifyResult.payment.status,
                        verified: verifyResult.verified,
                      });
                    } else {
                      // Fallback to regular check
                      updatedPayment = await getPaymentDetails(paymentId);
                    }
                  } catch (verifyErr) {
                    // Handle 404 gracefully - endpoint might not be deployed yet
                    if (verifyErr.message?.includes('404') || verifyErr.message?.includes('Not Found')) {
                      console.log("[Payment Callback Frontend] Verify-status endpoint not available (404), using regular check instead");
                    } else {
                      console.log("[Payment Callback Frontend] Manual verification failed, falling back to regular check:", verifyErr.message);
                    }
                    // Always fallback to regular check
                    updatedPayment = await getPaymentDetails(paymentId);
                  }
                } else {
                  updatedPayment = await getPaymentDetails(paymentId);
                }
                
                console.log("[Payment Callback Frontend] Poll result:", {
                  attempt: pollAttempt + 1,
                  status: updatedPayment.payment?.status,
                  gatewayTransactionId: updatedPayment.payment?.gatewayTransactionId,
                });
                
                if (updatedPayment.payment?.status === "completed") {
                  console.log("[Payment Callback Frontend] Payment now completed, setting SUCCESS");
                  setStatus("success");
                  setPayment(updatedPayment.payment);
                  toast.success("Payment successful!");
                  setTimeout(() => {
                    if (updatedPayment.payment?.course) {
                      const courseId = updatedPayment.payment.course._id || updatedPayment.payment.course;
                      console.log("[Payment Callback Frontend] Redirecting to course:", courseId);
                      navigate(`/courses/${courseId}`);
                    } else {
                      console.log("[Payment Callback Frontend] Redirecting to payments page");
                      navigate("/student/payments");
                    }
                  }, 3000);
                } else if (updatedPayment.payment?.status === "failed") {
                  console.log("[Payment Callback Frontend] Payment marked as failed");
                  setStatus("failed");
                  toast.error("Payment failed. Please try again.");
                } else {
                  // Still processing, continue polling
                  pollAttempt++;
                  pollPaymentStatus();
                }
              } catch (err) {
                console.error(`[Payment Callback Frontend] Error on poll attempt ${pollAttempt + 1}:`, err);
                // Continue polling even on error (might be temporary network issue)
                pollAttempt++;
                pollPaymentStatus();
              }
            }, delay);
          };
          
          // Start polling
          pollPaymentStatus();
        }
      } catch (err) {
        console.error("[Payment Callback Frontend] Error fetching payment:", {
          error: err.message,
          stack: err.stack,
          paymentId,
        });
        setStatus("error");
        setError(err.message || "Failed to verify payment");
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
                    Amount: ₹{payment.amount} {payment.currency}
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




