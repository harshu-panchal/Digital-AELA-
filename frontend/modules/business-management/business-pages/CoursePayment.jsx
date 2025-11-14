import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import { FaArrowLeft, FaLock, FaCreditCard } from "react-icons/fa";
import { extractNumericPrice } from "../utils/paymentLinks";

const externalCourseGatewayUrl = "https://digitalaela.com/course-payment";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const CoursePayment = () => {
  const location = useLocation();
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const stateCourse = location.state?.course ?? {};

  const title =
    stateCourse.title ?? query.get("title") ?? "Digital AELA Course";
  const courseId =
    stateCourse.id ??
    stateCourse.courseId ??
    stateCourse.slug ??
    query.get("id") ??
    query.get("slug") ??
    "";
  const trackOrCategory =
    stateCourse.category ??
    stateCourse.track ??
    query.get("category") ??
    query.get("track") ??
    "Course";
  const duration =
    stateCourse.duration ?? query.get("duration") ?? stateCourse.length ?? "";
  const format =
    stateCourse.format ?? query.get("format") ?? stateCourse.mode ?? "";
  const level = stateCourse.level ?? query.get("level") ?? "";

  const basePrice =
    extractNumericPrice(
      stateCourse.price ?? stateCourse.amount ?? query.get("price")
    ) || 0;

  const initialQuantity =
    Number(stateCourse.quantity ?? query.get("quantity")) || 1;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    quantity: initialQuantity,
    paymentMethod: "card",
    message: "",
  });

  const quantity = Math.max(1, formData.quantity || 1);
  const totalAmount = basePrice * quantity;

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity"
          ? Math.max(1, parseInt(value, 10) || 1)
          : value,
    }));
  };

  const proceedToGateway = () => {
    window.open(externalCourseGatewayUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    proceedToGateway();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title={`Digital AELA | Enrol in ${title}`}
        description={`Secure your seat in ${title} from Digital AELA. Complete the checkout to start learning.`}
        keywords="Digital AELA course payment, online course checkout, Digital AELA enrollment"
        url="https://digitalaela.com/courses/payment"
      />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-10 md:pt-[150px] md:pb-12 overflow-hidden"
      >
        <div className="absolute inset-0 bg-black" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200 mb-4"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Courses</span>
          </Link>
        </div>
      </motion.section>

      <section className="py-12 bg-[#141414] relative">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:col-span-1"
            >
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/20 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6 font-display">
                  Course Summary
                </h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Course</p>
                    <p className="text-white font-semibold leading-snug">
                      {title}
                    </p>
                    {courseId && (
                      <p className="text-gray-500 text-xs mt-1">
                        ID: {courseId}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide">
                        Track
                      </p>
                      <p className="text-white font-medium">
                        {trackOrCategory}
                      </p>
                    </div>
                    {duration && (
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Duration
                        </p>
                        <p className="text-white font-medium">{duration}</p>
                      </div>
                    )}
                    {format && (
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Format
                        </p>
                        <p className="text-white font-medium">{format}</p>
                      </div>
                    )}
                    {level && (
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Level
                        </p>
                        <p className="text-white font-medium">{level}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-1">Impact</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Your enrolment unlocks guided cohorts, mentor feedback,
                      and project workspaces built to accelerate learner
                      careers across the Digital AELA network.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Quantity</span>
                    <span className="text-white font-semibold">× {quantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Course Fee</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(basePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Processing Fee</span>
                    <span className="text-white font-semibold">₹0</span>
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

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="lg:col-span-2"
            >
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
                      Learner Information
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
                          onChange={handleFormChange}
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
                          onChange={handleFormChange}
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
                          onChange={handleFormChange}
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
                          onChange={handleFormChange}
                          required
                          className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 font-display">
                      Note for the Team (optional)
                    </h3>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleFormChange}
                      className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                      placeholder="Share specific requirements, timeline expectations, or scholarship details"
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
                          onChange={handleFormChange}
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
                          onChange={handleFormChange}
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
                          onChange={handleFormChange}
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
                    className="w-full bg-[#D4AF37] text-black py-4 rounded-lg font-bold text-lg hover:bg-[#E5C158] transition-colors duration-200"
                    disabled={totalAmount <= 0}
                  >
                    Pay {formatCurrency(totalAmount)}
                  </motion.button>

                  <p className="text-xs text-gray-500 text-center">
                    Payments are processed on secure, PCI-compliant gateways.
                    You will be redirected to complete the transaction.
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

export default CoursePayment;

