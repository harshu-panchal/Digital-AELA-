import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { FaArrowLeft, FaLock, FaCreditCard, FaSpinner } from "react-icons/fa";
import {
  createPayment,
  createRazorpayPaymentLink,
} from "../../../src/services/api/payments";
import {
  formatCurrency,
  getCurrencySymbol,
} from "../../../src/utils/currencyUtils";

const externalGiftUrl = "https://digitalaela.com/gift";

const GiftPayment = () => {
  const location = useLocation();
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const type = query.get("type") || "anyone";
  const nearOneDetails = {
    userId: query.get("userId") || "",
    fullName: query.get("fullName") || "",
    email: query.get("email") || "",
    phone: query.get("phone") || "",
    relation: query.get("relation") || "",
    location: query.get("location") || "",
    message: query.get("message") || "",
  };

  const initialAmount = Number(query.get("amount")) || 0;
  const initialCurrency = query.get("currency") || "INR";
  const itemName = query.get("itemName") || "contribution";

  const initialQuantity = Number(query.get("quantity")) || 1;
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: nearOneDetails.fullName || "",
    email: nearOneDetails.email || "",
    phone: nearOneDetails.phone || "",
    amount: initialAmount,
    currency: initialCurrency, // Add currency to state
    message: nearOneDetails.message || "",
    paymentMethod: "card",
    quantity: initialQuantity,
  });

  const giftAmount = formData.amount > 0 ? formData.amount : initialAmount;
  const quantity =
    formData.quantity && formData.quantity > 0 ? formData.quantity : 1;
  const totalAmount = giftAmount * quantity;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "amount"
          ? Number(value) || 0
          : name === "quantity"
          ? Math.max(1, parseInt(value, 10) || 1)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isProcessing || totalAmount <= 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create payment record
      const paymentResponse = await createPayment({
        amount: totalAmount,
        currency: formData.currency, // Use dynamic currency
        description: `Gift payment ${itemName ? `- ${itemName}` : ""} - ${
          type === "near"
            ? `For ${nearOneDetails.fullName || "recipient"}`
            : "Open contribution"
        }`,
        paymentMethod: formData.paymentMethod,
        gateway: "razorpay",
        metadata: {
          guestInfo: {
            firstName: formData.fullName || nearOneDetails.fullName || "Guest",
            email: formData.email || "guest@digitalaela.com", // Ensure an email is passed
            phone: formData.phone || "",
          },
          giftType: type,
        },
      });

      if (!paymentResponse?.payment?._id) {
        throw new Error("Failed to create payment record");
      }

      const paymentId = paymentResponse.payment._id;

      // Step 2: Create Razorpay Payment Link (Redirect-based)
      const linkResponse = await createRazorpayPaymentLink(paymentId);

      if (!linkResponse?.paymentLink?.url) {
        throw new Error("Failed to create Razorpay payment link");
      }

      // Step 3: Redirect to Razorpay's payment page
      toast.info("Redirecting to payment page...");
      window.location.href = linkResponse.paymentLink.url;
    } catch (error) {
      console.error("[Payment] Error processing payment:", error);
      toast.error(
        error.message || "Failed to process payment. Please try again."
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title="Digital AELA | Gift Checkout"
        description="Complete your gift to the Digital AELA learner community with secure payment options."
        keywords="Digital AELA gift, sponsor student, education support"
        url="https://digitalaela.com/gift/payment"
      />

      {/* Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-10 md:pt-[150px] md:pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200 mb-4">
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </motion.section>

      {/* Payment Section */}
      <section className="py-12 bg-[#141414] relative">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gift Summary */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:col-span-1">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/20 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6 font-display">
                  Gift Summary
                </h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Gift Type</p>
                    <p className="text-white font-semibold">
                      {type === "near" ? "Dedicated Gift" : "Open Contribution"}
                    </p>
                  </div>
                  {type === "near" && (
                    <>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Recipient</p>
                        <p className="text-white font-semibold">
                          {nearOneDetails.fullName || "-"}
                        </p>
                        <p className="text-gray-400 text-sm">
                          ID: {nearOneDetails.userId || "-"}
                        </p>
                      </div>
                      {nearOneDetails.relation && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Relation</p>
                          <p className="text-white font-semibold">
                            {nearOneDetails.relation}
                          </p>
                        </div>
                      )}
                      {nearOneDetails.location && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Location</p>
                          <p className="text-white font-semibold">
                            {nearOneDetails.location}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Impact</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Your gift powers scholarships, lab upgrades, and
                      mentorship pods for learners building Digital AELA centres
                      worldwide.
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Quantity</span>
                    <span className="text-white font-semibold">
                      × {quantity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Gift Amount</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(giftAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Processing Fee</span>
                    <span className="text-white font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-[#D4AF37] font-display">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Gift Form */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="lg:col-span-2">
              <div className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20">
                <div className="flex items-center gap-3 mb-6">
                  <FaLock className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-2xl font-bold text-white font-display">
                    Secure Checkout
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 font-display">
                      Gifter Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Gift Amount ({getCurrencySymbol(formData.currency)}) *
                        </label>
                        <input
                          type="number"
                          name="amount"
                          min={1}
                          value={formData.amount}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          min={1}
                          value={formData.quantity}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 font-display">
                      Additional Message (optional)
                    </h3>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                      placeholder="Share a note for our team or the recipient"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 font-display">
                      Payment Method
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg cursor-pointer hover:border-[#D4AF37] transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={formData.paymentMethod === "card"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-[#D4AF37]"
                        />
                        <FaCreditCard className="w-5 h-5 text-[#D4AF37]" />
                        <span className="text-white font-semibold">
                          Credit/Debit Card
                        </span>
                      </label>
                      <label className="flex items-center gap-3 p-4 bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg cursor-pointer hover:border-[#D4AF37] transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="upi"
                          checked={formData.paymentMethod === "upi"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-[#D4AF37]"
                        />
                        <span className="text-white font-semibold">UPI</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg cursor-pointer hover:border-[#D4AF37] transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="netbanking"
                          checked={formData.paymentMethod === "netbanking"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-[#D4AF37]"
                        />
                        <span className="text-white font-semibold">
                          Net Banking
                        </span>
                      </label>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-[#D4AF37] text-black py-4 rounded-lg font-bold text-lg hover:bg-[#E5C158] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isProcessing ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Gift ${formatCurrency(totalAmount)} Securely`
                    )}
                  </motion.button>

                  <p className="text-xs text-gray-500 text-center">
                    Your payment information is secure and encrypted
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GiftPayment;

