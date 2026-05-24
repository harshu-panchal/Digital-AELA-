import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaLock,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import TranslatedText from "../../../src/components/TranslatedText";
import { formatCurrency } from "../../../src/utils/currencyUtils";
import {
  createPayment,
  createRazorpayPaymentLink,
} from "../../../src/services/api/payments";
import { useAuth } from "../../../src/contexts/AuthContext";
import { BOOK_CART_PENDING_PAYMENT_KEY } from "../utils/bookCart";

const CustomPaymentCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    // Get payment data from location state or URL params
    const state = location.state;
    const params = new URLSearchParams(location.search);

    let data = null;

    if (state && state.itemName) {
      data = { ...state };
    } else {
      // Fallback to URL params if state is not available
      const type = params.get("type"); // course, book, gift
      const itemName = params.get("itemName");
      const amount = params.get("amount");

      if (type && itemName && amount) {
        data = {
          type,
          itemId: params.get("itemId"),
          itemName,
          amount: amount,
          currency: params.get("currency") || "INR",
          quantity: params.get("quantity") || "1",
          description: params.get("description") || "",
          ...Object.fromEntries(params.entries()),
        };
      }
    }

    if (data && data.amount) {
      // Robust amount parsing: extract sequence of digits and dots
      const rawAmount = data.amount.toString();
      const matchedAmount = rawAmount.match(/[\d.]+/);
      const parsedAmount = matchedAmount ? parseFloat(matchedAmount[0]) : 0;

      setPaymentData({
        ...data,
        amount: parsedAmount,
        quantity: parseInt(data.quantity || 1) || 1,
      });
    }
  }, [location]);

  const handleContinue = async () => {
    if (!acceptedTerms || !paymentData || isProcessing) {
      return;
    }

    // Guest validation
    if (!isAuthenticated) {
      if (!guestInfo.firstName || !guestInfo.email || !guestInfo.phone) {
        toast.error("Please fill in your name, email, and phone number.");
        return;
      }
    }

    setIsProcessing(true);

    try {
      const { type, giftType, itemId, itemName, amount } = paymentData;
      const isBookCart = type === "book-cart";
      const paymentTotalAmount = isBookCart
        ? parseFloat(amount)
        : parseFloat(amount) * (paymentData.quantity || 1);

      // Prepare payment description based on type
      let description = "";
      if (type === "course") {
        description = `Payment for course: ${itemName}`;
      } else if (type === "book") {
        description = `Payment for book: ${itemName}`;
      } else if (type === "book-cart") {
        description = paymentData.giftType
          ? `Gift payment for ${paymentData.cartItems?.length || 0} books - ${
              paymentData.giftType === "near"
                ? "Gift to near one"
                : "Gift to anyone"
            }`
          : `Payment for ${paymentData.cartItems?.length || 0} books`;
      } else if (type === "gift") {
        description = `Gift payment: ${itemName || "Digital AELA"} - ${
          giftType === "near" ? "Gift to near one" : "Gift to anyone"
        }`;
      }

      const paymentPayload = {
        amount: paymentTotalAmount,
        currency: "INR", // Force INR as per platform standard
        description: description,
        paymentMethod: "card", // Use valid enum value from Payment model
        gateway: "razorpay",
        metadata: {
          type: paymentData.type,
          itemId: paymentData.itemId,
          itemName: paymentData.itemName,
          quantity: paymentData.quantity,
          cartItems: paymentData.cartItems || undefined,
          totalAmount: paymentTotalAmount,
          giftType: paymentData.giftType || undefined,
          recipientDetails: paymentData.recipientDetails || undefined,
          source: paymentData.source || undefined,
        },
      };

      if (!isAuthenticated) {
        paymentPayload.metadata.guestInfo = guestInfo;
      }

      if (paymentData.type === "course") {
        paymentPayload.courseId = paymentData.itemId;
      }

      // Step 1: Create payment record
      const paymentResponse = await createPayment(paymentPayload);

      if (!paymentResponse?.payment?._id) {
        throw new Error("Failed to create payment record");
      }

      const paymentId = paymentResponse.payment._id;

      // Step 2: Create Razorpay Payment Link
      const linkResponse = await createRazorpayPaymentLink(paymentId);

      if (!linkResponse?.paymentLink?.url) {
        throw new Error("Failed to create Razorpay payment link");
      }

      // Step 3: Redirect to Razorpay's payment page
      if (isBookCart) {
        sessionStorage.setItem(BOOK_CART_PENDING_PAYMENT_KEY, paymentId);
      }

      toast.success("Redirecting to secure payment gateway...");
      window.location.href = linkResponse.paymentLink.url;
    } catch (error) {
      console.error("[Payment] Error processing payment:", error);
      toast.error(
        error.message || "Failed to process payment. Please try again."
      );
      setIsProcessing(false);
    }
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4 font-display">
            <TranslatedText>No payment information found</TranslatedText>
          </h2>
          <Link
            to="/"
            className="text-[#D4AF37] hover:text-[#E5C158] transition-colors">
            <TranslatedText>Back to Home</TranslatedText>
          </Link>
        </div>
      </div>
    );
  }

  const { itemName, amount, currency, quantity = 1, type } = paymentData;
  const isBookCart = type === "book-cart";
  const totalAmount = isBookCart ? amount : amount * quantity;
  const isGiftCart = isBookCart && Boolean(paymentData.giftType);

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title="Digital AELA | Payment Confirmation"
        description="Confirm your payment details before proceeding to secure checkout"
        keywords="Digital AELA payment, secure checkout, payment confirmation"
        url="https://digitalaela.com/payment/confirm"
      />

      {/* Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-10 md:pt-[150px] md:pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200 mb-4">
            <FaArrowLeft className="w-4 h-4" />
            <span>
              <TranslatedText>Back to Home</TranslatedText>
            </span>
          </Link>
        </div>
      </motion.section>

      {/* Payment Confirmation Section */}
      <section className="py-12 bg-[#141414] relative">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <FaLock className="w-6 h-6 text-[#D4AF37]" />
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display">
                <TranslatedText>Confirm Your Purchase</TranslatedText>
              </h1>
            </div>

            {/* Order Summary */}
            <div className="bg-[#0a0a0a] rounded-lg p-6 mb-6 border border-[#D4AF37]/10">
              <h2 className="text-lg font-bold text-white mb-4 font-display">
                <TranslatedText>Order Summary</TranslatedText>
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-gray-400">
                    <TranslatedText>{isBookCart ? "Items" : "Item"}</TranslatedText>
                  </span>
                  <span className="text-white font-semibold text-right max-w-[60%] flex flex-col items-end">
                    <TranslatedText>{itemName}</TranslatedText>
                    {paymentData.description && (
                      <p className="text-xs text-gray-500 font-normal mt-1 italic text-left w-full">
                        <TranslatedText>
                          {paymentData.description}
                        </TranslatedText>
                      </p>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    <TranslatedText>Type</TranslatedText>
                  </span>
                  <span className="text-white font-semibold capitalize">
                    <TranslatedText>
                      {isGiftCart
                        ? "Book Cart Gift"
                        : isBookCart
                        ? "Book Cart"
                        : type}
                    </TranslatedText>
                  </span>
                </div>
                {isGiftCart && (
                  <div className="rounded-lg border border-[#D4AF37]/10 bg-[#141414] p-3">
                    <p className="text-sm font-semibold text-white">
                      <TranslatedText>
                        {paymentData.giftType === "near"
                          ? "Gift Near One"
                          : "Gift Anyone"}
                      </TranslatedText>
                    </p>
                    {paymentData.giftType === "near" &&
                      paymentData.recipientDetails && (
                        <div className="mt-2 space-y-1 text-xs text-gray-400">
                          <p>
                            <TranslatedText>Recipient</TranslatedText>:{" "}
                            {paymentData.recipientDetails.fullName}
                          </p>
                          <p>
                            <TranslatedText>User ID</TranslatedText>:{" "}
                            {paymentData.recipientDetails.userId}
                          </p>
                          {paymentData.recipientDetails.relation && (
                            <p>
                              <TranslatedText>Relation</TranslatedText>:{" "}
                              {paymentData.recipientDetails.relation}
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                )}
                {isBookCart && paymentData.cartItems?.length > 0 && (
                  <div className="rounded-lg border border-[#D4AF37]/10 bg-[#141414] p-3">
                    <p className="mb-3 text-sm font-semibold text-white">
                      <TranslatedText>Books in this order</TranslatedText>
                    </p>
                    <div className="space-y-3">
                      {paymentData.cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-4 text-sm">
                          <div>
                            <p className="font-semibold text-white">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(item.price)} x {item.quantity}
                            </p>
                          </div>
                          <span className="font-semibold text-[#D4AF37]">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    <TranslatedText>Quantity</TranslatedText>
                  </span>
                  <span className="text-white font-semibold">x{quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    <TranslatedText>
                      {isBookCart ? "Subtotal" : "Price"}
                    </TranslatedText>
                  </span>
                  <span className="text-white font-semibold">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-3 mt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-white">
                    <TranslatedText>Total Amount</TranslatedText>
                  </span>
                  <span className="text-2xl font-bold text-[#D4AF37] font-display">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 bg-[#0a0a0a] rounded-lg p-4 border border-[#D4AF37]/10">
                <FaShieldAlt className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">
                    <TranslatedText>Secure</TranslatedText>
                  </p>
                  <p className="text-sm text-white font-semibold">
                    <TranslatedText>SSL Encrypted</TranslatedText>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[#0a0a0a] rounded-lg p-4 border border-[#D4AF37]/10">
                <FaCheckCircle className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">
                    <TranslatedText>Verified</TranslatedText>
                  </p>
                  <p className="text-sm text-white font-semibold">
                    <TranslatedText>Payment Gateway</TranslatedText>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[#0a0a0a] rounded-lg p-4 border border-[#D4AF37]/10">
                <FaLock className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">
                    <TranslatedText>Protected</TranslatedText>
                  </p>
                  <p className="text-sm text-white font-semibold">
                    <TranslatedText>Data Safe</TranslatedText>
                  </p>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-[#0a0a0a] rounded-lg p-6 mb-6 border border-[#D4AF37]/10">
              <h3 className="text-lg font-bold text-white mb-4 font-display">
                <TranslatedText>Before You Continue</TranslatedText>
              </h3>
              <div className="space-y-3 text-sm text-gray-300 mb-4">
                <p>
                  <TranslatedText>
                    • All payments are processed securely through Razorpay
                    payment gateway
                  </TranslatedText>
                </p>
                <p>
                  <TranslatedText>
                    • Your payment information is encrypted and protected
                  </TranslatedText>
                </p>
                <p>
                  <TranslatedText>
                    • For courses and e-books, access will be granted
                    immediately after payment
                  </TranslatedText>
                </p>
                <p>
                  <TranslatedText>
                    • Physical books will be shipped within 3-5 business days
                  </TranslatedText>
                </p>
                <p>
                  <TranslatedText>
                    • Please review our refund policy before completing your
                    purchase
                  </TranslatedText>
                </p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0 bg-[#0a0a0a]"
                />
                <span className="text-sm text-gray-300">
                  <TranslatedText>I agree to the </TranslatedText>
                  <Link
                    to="/terms-conditions"
                    target="_blank"
                    className="text-[#D4AF37] hover:text-[#E5C158] underline">
                    <TranslatedText>Terms & Conditions</TranslatedText>
                  </Link>
                  <TranslatedText> and </TranslatedText>
                  <Link
                    to="/refund-cancellation-policy"
                    target="_blank"
                    className="text-[#D4AF37] hover:text-[#E5C158] underline">
                    <TranslatedText>Refund Policy</TranslatedText>
                  </Link>
                </span>
              </label>
            </div>

            {/* Guest Checkout Form */}
            {!isAuthenticated && (
              <div className="bg-[#0a0a0a] rounded-lg p-6 mb-6 border border-[#D4AF37]/10">
                <h3 className="text-lg font-bold text-white mb-4 font-display">
                  <TranslatedText>Guest Checkout Information</TranslatedText>
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  <TranslatedText>
                    {type === "course" 
                      ? "We will create an account for you to access this course." 
                      : "Please provide your details for the receipt."}
                  </TranslatedText>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1"><TranslatedText>First Name *</TranslatedText></label>
                    <input
                      type="text"
                      value={guestInfo.firstName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-white focus:border-[#D4AF37] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1"><TranslatedText>Last Name</TranslatedText></label>
                    <input
                      type="text"
                      value={guestInfo.lastName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1"><TranslatedText>Email *</TranslatedText></label>
                    <input
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-white focus:border-[#D4AF37] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1"><TranslatedText>Phone *</TranslatedText></label>
                    <input
                      type="tel"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-white focus:border-[#D4AF37] focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <motion.button
              whileHover={{ scale: acceptedTerms ? 1.02 : 1 }}
              whileTap={{ scale: acceptedTerms ? 0.98 : 1 }}
              onClick={handleContinue}
              disabled={!acceptedTerms}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-200 ${
                acceptedTerms
                  ? "bg-[#D4AF37] text-black hover:bg-[#E5C158] cursor-pointer"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}>
              <TranslatedText>Continue to Secure Payment</TranslatedText>
            </motion.button>

            <p className="text-xs text-gray-500 text-center mt-4">
              <TranslatedText>
                You will be redirected to Razorpay secure payment gateway to
                complete your transaction
              </TranslatedText>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CustomPaymentCheck;
