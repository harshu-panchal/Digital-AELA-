import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { getPaymentDetails } from "../../src/services/api/payments";
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

        // Check for success status from URL or payment record
        const isSuccess = paymentStatus === "success" || paymentStatus === "paid" || paymentData.payment?.status === "completed";
        const isFailed = paymentStatus === "failed" || paymentData.payment?.status === "failed";

        console.log("[Payment Callback Frontend] Status determination:", {
          isSuccess,
          isFailed,
          paymentStatusFromURL: paymentStatus,
          paymentStatusFromDB: paymentData.payment?.status,
          conditions: {
            urlSuccess: paymentStatus === "success",
            urlPaid: paymentStatus === "paid",
            dbCompleted: paymentData.payment?.status === "completed",
            urlFailed: paymentStatus === "failed",
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
          console.log("[Payment Callback Frontend] Setting status to PROCESSING, will check again in 2s");
          setStatus("processing");
          // Wait a bit and check again
          setTimeout(async () => {
            try {
              console.log("[Payment Callback Frontend] Re-checking payment status after delay");
              const updatedPayment = await getPaymentDetails(paymentId);
              console.log("[Payment Callback Frontend] Updated payment status:", {
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
              } else {
                console.log("[Payment Callback Frontend] Payment still not completed, setting FAILED");
                setStatus("failed");
              }
            } catch (err) {
              console.error("[Payment Callback Frontend] Error re-checking payment:", err);
              setStatus("error");
              setError("Failed to verify payment status");
            }
          }, 2000);
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




