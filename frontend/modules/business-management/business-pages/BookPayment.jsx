import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import {
  FaArrowLeft,
  FaLock,
  FaCreditCard,
  FaSpinner,
  FaUser,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { HiOutlineShoppingBag, HiOutlineUserCircle } from "react-icons/hi2";
import { fetchEbookById } from "../../../src/services/api/resources";
import { formatCurrency } from "../../../src/utils/currencyUtils";
import bookGrammarImg from "../../../src/assets/images/books/grammar.png";
import { useAuth } from "../../../src/contexts/AuthContext";
import {
  createGuestBookOrder,
  createRegisteredBookOrder,
} from "../../../src/services/api/bookOrders";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
  "Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
  "Puducherry",
];

const inputClass =
  "w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all duration-200";

const labelClass = "block text-sm font-medium text-gray-300 mb-2";

const BookPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [quantity, setQuantity] = useState(1);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    // Personal info (guest) / pre-fill (registered)
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Address (all users for physical; optional for ebook)
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    // Payment
    paymentMethod: "card",
  });

  const [errors, setErrors] = useState({});

  // Load book details and query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qtyParam = params.get("quantity");
    if (qtyParam) {
      const parsedQty = parseInt(qtyParam, 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        setQuantity(parsedQty);
      }
    }

    const loadBook = async () => {
      try {
        setLoading(true);
        const ebook = await fetchEbookById(id);
        if (ebook) {
          const price =
            ebook.metadata?.price !== undefined &&
            ebook.metadata.price !== null &&
            ebook.metadata.price !== ""
              ? Number(ebook.metadata.price)
              : 0;
          const bookFormat =
            ebook.metadata?.bookType === "physical" ||
            ebook.downloadUrl === "physical-book"
              ? "physical"
              : "ebook";
          setBook({
            id: ebook._id || id,
            title: ebook.title,
            author: ebook.metadata?.author || "Digital AELA",
            price,
            currency: "INR",
            format: bookFormat,
            image: ebook.metadata?.coverImage || bookGrammarImg,
            coverImage: ebook.metadata?.coverImage || null,
          });
        } else {
          toast.error("Book not found");
        }
      } catch (error) {
        console.error("Failed to load book:", error);
        toast.error("Failed to load book details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadBook();
  }, [id, location.search]);

  // Pre-fill form from authenticated user
  useEffect(() => {
    if (user) {
      const nameParts = (user.fullName || "").trim().split(" ");
      setFormData((prev) => ({
        ...prev,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.metadata?.phone || user.phone || "",
      }));
    }
  }, [user]);

  const validate = () => {
    const newErrors = {};

    // Guest-only fields
    if (!isAuthenticated) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Valid email is required";
      }
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    }

    // Address required for physical books (all users)
    if (book?.format === "physical") {
      if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state.trim()) newErrors.state = "State is required";
      if (!formData.pincode.trim()) newErrors.pincode = "PIN/ZIP code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isProcessing || !book || book.price <= 0) return;
    if (!validate()) {
      toast.error("Please fix the form errors before continuing.");
      return;
    }

    setIsProcessing(true);

    try {
      const shippingAddress =
        book.format === "physical"
          ? {
              addressLine1: formData.addressLine1.trim(),
              addressLine2: formData.addressLine2.trim(),
              city: formData.city.trim(),
              state: formData.state.trim(),
              pincode: formData.pincode.trim(),
              country: formData.country || "India",
            }
          : null;

      let response;

      if (isAuthenticated) {
        // Registered user flow
        response = await createRegisteredBookOrder({
          bookId: book.id,
          quantity: quantity,
          shippingAddress,
          paymentMethod: formData.paymentMethod,
        });
      } else {
        // Guest flow
        response = await createGuestBookOrder({
          bookId: book.id,
          quantity: quantity,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          shippingAddress,
          paymentMethod: formData.paymentMethod,
        });
      }

      if (!response?.paymentLinkUrl) {
        throw new Error("Failed to create payment link. Please try again.");
      }

      toast.info("Redirecting to secure payment...", { autoClose: 2000 });
      setTimeout(() => {
        window.location.href = response.paymentLinkUrl;
      }, 1200);
    } catch (error) {
      console.error("[BookPayment] Error:", error);
      toast.error(error.message || "Failed to process order. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Loading book details...</h2>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Book not found</h2>
          <Link to="/books" className="text-[#D4AF37] hover:text-[#E5C158] transition-colors">
            Back to Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title={`Checkout — ${book.title} | Digital AELA`}
        description={`Purchase "${book.title}" by ${book.author}. Secure checkout with Razorpay.`}
        keywords={`Buy ${book.title}, Digital AELA checkout`}
        url={`https://digitalaela.com/books/${book.id}/payment`}
      />

      {/* Back button header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative pt-[140px] pb-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0800] to-black" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <Link
            to={`/books/${book.id}`}
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200 mb-2"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Book Details</span>
          </Link>
        </div>
      </motion.section>

      {/* Main payment section */}
      <section className="py-8 pb-20 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 md:px-8">

          {/* Guest Notice Banner */}
          <AnimatePresence>
            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <HiOutlineUserCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                  <p className="text-sm text-gray-300">
                    <span className="text-[#D4AF37] font-semibold">You're buying as a guest.</span>{" "}
                    Have an account?{" "}
                    <Link
                      to="/student/login"
                      className="text-[#D4AF37] underline underline-offset-2 hover:text-[#E5C158]"
                    >
                      Sign in
                    </Link>{" "}
                    or{" "}
                    <Link
                      to="/student/register"
                      className="text-[#D4AF37] underline underline-offset-2 hover:text-[#E5C158]"
                    >
                      Register
                    </Link>{" "}
                    for a better experience.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registered user welcome */}
          <AnimatePresence>
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3"
              >
                <FaCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-emerald-300 font-semibold">
                    Welcome back, {user?.fullName?.split(" ")[0] || ""}!
                  </p>
                  <p className="text-xs text-gray-400">
                    Purchasing as <span className="text-white">{user?.email}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Order Summary Sidebar ── */}
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1"
            >
              <div className="bg-[#111111] rounded-2xl p-6 border border-[#D4AF37]/20 sticky top-28">
                {/* Book cover */}
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-40 object-cover rounded-xl mb-5 border border-[#D4AF37]/10"
                  />
                ) : (
                  <div className="w-full h-40 rounded-xl mb-5 border border-[#D4AF37]/10 bg-[#1a1a1a] flex items-center justify-center">
                    <HiOutlineShoppingBag className="w-12 h-12 text-[#D4AF37]/40" />
                  </div>
                )}

                <h2 className="text-lg font-bold text-white mb-5">Order Summary</h2>

                <div className="space-y-3 mb-5 text-sm">
                  <div>
                    <p className="text-gray-500 mb-0.5">Book</p>
                    <p className="text-white font-semibold">{book.title}</p>
                    <p className="text-gray-400">by {book.author}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Format</p>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        book.format === "physical"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      }`}
                    >
                      {book.format === "physical" ? "Physical Book" : "E-Book (Digital)"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-semibold">{formatCurrency(book.price)}</span>
                  </div>
                  {book.format === "physical" && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping</span>
                      <span className="text-emerald-400 font-semibold">FREE</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-800">
                    <span className="text-base font-bold text-white">Total {quantity > 1 ? `(x${quantity})` : ''}</span>
                    <span className="text-2xl font-bold text-[#D4AF37]">
                      {formatCurrency(book.price * quantity)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaLock className="w-3 h-3 text-emerald-500" />
                    <span>Secured by Razorpay · 256-bit SSL</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Payment Form ── */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-[#D4AF37]/20">
                <div className="flex items-center gap-3 mb-7">
                  <FaLock className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-2xl font-bold text-white">Secure Checkout</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7" noValidate>

                  {/* ── Personal Information (Guest only) ── */}
                  {!isAuthenticated && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <FaUser className="w-4 h-4 text-[#D4AF37]" />
                        <h3 className="text-base font-bold text-white">Personal Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass} htmlFor="firstName">
                            First Name *
                          </label>
                          <input
                            id="firstName"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter your first name"
                            className={`${inputClass} ${errors.firstName ? "border-red-500/70" : ""}`}
                            required
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="lastName">
                            Last Name
                          </label>
                          <input
                            id="lastName"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter your last name"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="email">
                            <span className="flex items-center gap-1.5">
                              <FaEnvelope className="w-3 h-3" /> Email Address *
                            </span>
                          </label>
                          <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className={`${inputClass} ${errors.email ? "border-red-500/70" : ""}`}
                            required
                          />
                          {errors.email && (
                            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                          )}
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="phone">
                            <span className="flex items-center gap-1.5">
                              <FaPhone className="w-3 h-3" /> Phone Number *
                            </span>
                          </label>
                          <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className={`${inputClass} ${errors.phone ? "border-red-500/70" : ""}`}
                            required
                          />
                          {errors.phone && (
                            <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Contact for Digital Delivery (registered, ebook only) ── */}
                  {isAuthenticated && book.format === "ebook" && (
                    <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#D4AF37]/10">
                      <p className="text-sm text-gray-400">
                        Your digital book will be available immediately after payment and linked to your account{" "}
                        <span className="text-[#D4AF37] font-medium">{user?.email}</span>.
                      </p>
                    </div>
                  )}

                  {/* ── Shipping Address ── */}
                  {book.format === "physical" && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <FaMapMarkerAlt className="w-4 h-4 text-[#D4AF37]" />
                        <h3 className="text-base font-bold text-white">Shipping Address</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className={labelClass} htmlFor="addressLine1">
                            Street Address / Flat, House No. *
                          </label>
                          <input
                            id="addressLine1"
                            type="text"
                            name="addressLine1"
                            value={formData.addressLine1}
                            onChange={handleChange}
                            placeholder="123, Main Street / Flat 4B, Building Name"
                            className={`${inputClass} ${errors.addressLine1 ? "border-red-500/70" : ""}`}
                            required
                          />
                          {errors.addressLine1 && (
                            <p className="mt-1 text-xs text-red-400">{errors.addressLine1}</p>
                          )}
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="addressLine2">
                            Area, Colony, Landmark (optional)
                          </label>
                          <input
                            id="addressLine2"
                            type="text"
                            name="addressLine2"
                            value={formData.addressLine2}
                            onChange={handleChange}
                            placeholder="Near XYZ landmark, ABC Colony"
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className={labelClass} htmlFor="city">
                              City *
                            </label>
                            <input
                              id="city"
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              placeholder="Mumbai"
                              className={`${inputClass} ${errors.city ? "border-red-500/70" : ""}`}
                              required
                            />
                            {errors.city && (
                              <p className="mt-1 text-xs text-red-400">{errors.city}</p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass} htmlFor="state">
                              State *
                            </label>
                            <input
                              id="state"
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleChange}
                              placeholder="Maharashtra"
                              className={`${inputClass} ${errors.state ? "border-red-500/70" : ""}`}
                              required
                            />
                            {errors.state && (
                              <p className="mt-1 text-xs text-red-400">{errors.state}</p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass} htmlFor="pincode">
                              PIN Code *
                            </label>
                            <input
                              id="pincode"
                              type="text"
                              name="pincode"
                              value={formData.pincode}
                              onChange={handleChange}
                              placeholder="400001"
                              maxLength={6}
                              className={`${inputClass} ${errors.pincode ? "border-red-500/70" : ""}`}
                              required
                            />
                            {errors.pincode && (
                              <p className="mt-1 text-xs text-red-400">{errors.pincode}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className={labelClass} htmlFor="country">
                            Country
                          </label>
                          <input
                            id="country"
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="India"
                            className={inputClass}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}


                  {/* ── Submit ── */}
                  <motion.button
                    type="submit"
                    disabled={isProcessing}
                    whileHover={{ scale: isProcessing ? 1 : 1.01 }}
                    whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C09B2B] text-black py-4 rounded-xl font-bold text-base hover:from-[#E5C158] hover:to-[#D4AF37] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-[#D4AF37]/20"
                  >
                    {isProcessing ? (
                      <>
                        <FaSpinner className="animate-spin w-4 h-4" />
                        Processing your order...
                      </>
                    ) : (
                      <>
                        <FaExternalLinkAlt className="w-4 h-4" />
                        Pay {formatCurrency(book.price * quantity)} — Proceed to Payment
                      </>
                    )}
                  </motion.button>

                  <p className="text-xs text-gray-600 text-center">
                    By placing this order you agree to our{" "}
                    <Link to="/terms-conditions" className="text-[#D4AF37]/70 hover:text-[#D4AF37]">
                      Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link to="/refund-cancellation-policy" className="text-[#D4AF37]/70 hover:text-[#D4AF37]">
                      Refund Policy
                    </Link>.
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

export default BookPayment;
