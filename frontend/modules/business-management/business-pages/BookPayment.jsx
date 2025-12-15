import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { FaArrowLeft, FaLock, FaCreditCard, FaSpinner } from "react-icons/fa";
import { fetchEbookById } from "../../../src/services/api/resources";
import bookGrammarImg from "../../../src/assets/images/books/grammar.png";
import { createPayment, createRazorpayPaymentLink } from "../../../src/services/api/payments";

const BookPayment = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    paymentMethod: "card",
  });

  useEffect(() => {
    const loadBook = async () => {
      try {
        setLoading(true);
        const ebook = await fetchEbookById(id);
        if (ebook) {
          // Transform backend data to frontend format
          const price = ebook.metadata?.price !== undefined && ebook.metadata.price !== null && ebook.metadata.price !== "" ? Number(ebook.metadata.price) : 0;
          const transformedBook = {
            id: ebook._id || id,
            title: ebook.title,
            author: ebook.metadata?.author || "Digital AELA",
            price: price,
            currency: "AED", // Default to AED
            format: "ebook", // All books from API are ebooks
            image: ebook.metadata?.coverImage || bookGrammarImg,
          };
          setBook(transformedBook);
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

    if (id) {
      loadBook();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isProcessing || !book || book.price <= 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create payment record
      const paymentResponse = await createPayment({
        amount: book.price,
        currency: book.currency || "AED",
        description: `Payment for ${book.title} by ${book.author}`,
        paymentMethod: formData.paymentMethod,
        gateway: "razorpay",
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
      toast.error(error.message || "Failed to process payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4 font-display">
            Loading book details...
          </h2>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4 font-display">
            Book not found
          </h2>
          <Link
            to="/books"
            className="text-[#D4AF37] hover:text-[#E5C158] transition-colors">
            Back to Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title={`Payment - ${book.title} | Digital AELA Book Store`}
        description={`Complete your purchase of ${book.title} by ${book.author} from Digital AELA Book Store. Secure payment gateway.`}
        keywords={`Buy ${book.title}, Book payment, Digital AELA payment, Secure checkout`}
        url={`https://digitalaela.com/books/${book.id}/payment`}
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
            to={`/books/${book.id}`}
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200 mb-4">
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Book Details</span>
          </Link>
        </div>
      </motion.section>

      {/* Payment Section */}
      <section className="py-12 bg-[#141414] relative">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:col-span-1">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/20 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6 font-display">
                  Order Summary
                </h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Book</p>
                    <p className="text-white font-semibold">{book.title}</p>
                    <p className="text-gray-400 text-sm">by {book.author}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Format</p>
                    <p className="text-white font-semibold capitalize">
                      {book.format === "ebook" ? "E-Book" : "Physical Book"}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-semibold">
                      {book.currency || "AED"} {book.price}
                    </span>
                  </div>
                  {book.format === "physical" && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Shipping</span>
                      <span className="text-white font-semibold">Free</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-[#D4AF37] font-display">
                      {book.currency || "AED"} {book.price}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Form */}
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
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 font-display">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
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
                    </div>
                  </div>

                  {/* Shipping Address (only for physical books) */}
                  {book.format === "physical" && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4 font-display">
                        Shipping Address
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Address *
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              required
                              className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">
                              State *
                            </label>
                            <input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              required
                              className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">
                              ZIP Code *
                            </label>
                            <input
                              type="text"
                              name="zipCode"
                              value={formData.zipCode}
                              onChange={handleInputChange}
                              required
                              className="w-full bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
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

                  {/* Submit Button */}
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
                      `Pay ${book.currency || "AED"} ${book.price} - Complete Purchase`
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

export default BookPayment;

