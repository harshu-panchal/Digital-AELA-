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
      if (errorMessage) {
        setStatus("error");
        setError(errorMessage);
        return;
      }

      if (!paymentId) {
        setStatus("error");
        setError("Payment ID not found");
        return;
      }

      try {
        // Fetch payment details to check status
        const paymentData = await getPaymentDetails(paymentId);
        setPayment(paymentData.payment);

        if (paymentStatus === "paid" || paymentData.payment?.status === "completed") {
          setStatus("success");
          toast.success("Payment successful!");

          // Redirect based on payment type
          setTimeout(() => {
            if (paymentData.payment?.course) {
              navigate(`/courses/${paymentData.payment.course._id || paymentData.payment.course}`);
            } else {
              navigate("/student/payments");
            }
          }, 3000);
        } else if (paymentStatus === "failed" || paymentData.payment?.status === "failed") {
          setStatus("failed");
          toast.error("Payment failed. Please try again.");
        } else {
          setStatus("processing");
          // Wait a bit and check again
          setTimeout(async () => {
            try {
              const updatedPayment = await getPaymentDetails(paymentId);
              if (updatedPayment.payment?.status === "completed") {
                setStatus("success");
                setPayment(updatedPayment.payment);
                toast.success("Payment successful!");
                setTimeout(() => {
                  if (updatedPayment.payment?.course) {
                    navigate(`/courses/${updatedPayment.payment.course._id || updatedPayment.payment.course}`);
                  } else {
                    navigate("/student/payments");
                  }
                }, 3000);
              } else {
                setStatus("failed");
              }
            } catch (err) {
              setStatus("error");
              setError("Failed to verify payment status");
            }
          }, 2000);
        }
      } catch (err) {
        console.error("[Payment] Error fetching payment:", err);
        setStatus("error");
        setError(err.message || "Failed to verify payment");
      }
    };

    handleCallback();
  }, [paymentId, paymentStatus, payment_id, errorMessage, navigate]);

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




