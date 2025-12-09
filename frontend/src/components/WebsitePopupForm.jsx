import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlineXMark, HiOutlineUser, HiOutlinePhone, HiOutlineEnvelope, HiOutlineMapPin, HiOutlineBriefcase, HiOutlineCalendar, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { useAuth } from "../contexts/AuthContext";
import { createFormLead } from "../services/api/crm";

const WebsitePopupForm = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    country: "",
    profession: "",
    age: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  // Show popup 10 seconds after page load, only for unregistered users on public pages
  useEffect(() => {
    if (isAuthenticated) {
      return; // Don't show for registered users
    }

    // Don't show on admin login, dashboard pages, or protected routes
    const isAdminLogin = location.pathname === "/admin/login";
    const isDashboard = 
      location.pathname.startsWith("/super-admin") ||
      location.pathname.startsWith("/teacher/") ||
      location.pathname.startsWith("/student/") ||
      location.pathname.startsWith("/learn-earn") ||
      location.pathname.startsWith("/recruiter/") ||
      location.pathname.startsWith("/explore-jobs");

    if (isAdminLogin || isDashboard) {
      return; // Don't show on admin or dashboard pages
    }

    // Check if user has already submitted or dismissed the popup in this session
    const hasSeenPopup = sessionStorage.getItem("website-popup-seen");
    if (hasSeenPopup) {
      return; // Don't show again in this session
    }

    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [isAuthenticated, location.pathname]);

  const handleClose = () => {
    setShowPopup(false);
    // Mark as seen in this session
    sessionStorage.setItem("website-popup-seen", "true");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.profession.trim()) {
      newErrors.profession = "Profession is required";
    }

    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    } else if (isNaN(formData.age) || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = "Please enter a valid age";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);

    try {
      // Split name into firstName and lastName
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Prepare payload for createFormLead
      const payload = {
        formId: "website-popup",
        firstName,
        lastName,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        profession: formData.profession.trim(),
        age: formData.age.trim(),
        message: formData.message.trim() || "",
      };

      await createFormLead(payload);

      toast.success("Thank you! We'll get back to you soon.");
      
      // Mark as submitted in session storage
      sessionStorage.setItem("website-popup-seen", "true");
      sessionStorage.setItem("website-popup-submitted", "true");
      
      // Reset form and close popup
      setFormData({
        name: "",
        phone: "",
        email: "",
        city: "",
        country: "",
        profession: "",
        age: "",
        message: "",
      });
      setShowPopup(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || "Failed to submit form. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Don't render if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
          />

          {/* Popup Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ ease: "easeOut", duration: 0.4 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-[#0a0e1a] via-[#1a1f2e] to-[#0a0e1a] border border-[#F5D26A]/20 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#F5D26A]/10 to-transparent border-b border-[#F5D26A]/20 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
                <div>
                  <h2 className="text-xl font-bold text-[#F5D26A]">Get in Touch</h2>
                  <p className="text-sm text-gray-400 mt-1">We'd love to hear from you!</p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                  aria-label="Close"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineUser className="inline w-4 h-4 mr-1" />
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 transition ${
                      errors.name ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineEnvelope className="inline w-4 h-4 mr-1" />
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 transition ${
                      errors.email ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <HiOutlinePhone className="inline w-4 h-4 mr-1" />
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 transition ${
                      errors.phone ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="+1 234 567 8900"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineMapPin className="inline w-4 h-4 mr-1" />
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 transition ${
                      errors.city ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="Enter your city"
                  />
                  {errors.city && (
                    <p className="text-red-400 text-xs mt-1">{errors.city}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineMapPin className="inline w-4 h-4 mr-1" />
                    Country <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 transition ${
                      errors.country ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="Enter your country"
                  />
                  {errors.country && (
                    <p className="text-red-400 text-xs mt-1">{errors.country}</p>
                  )}
                </div>

                {/* Profession */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineBriefcase className="inline w-4 h-4 mr-1" />
                    Profession <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 transition ${
                      errors.profession ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="e.g., Software Engineer, Teacher, Student"
                  />
                  {errors.profession && (
                    <p className="text-red-400 text-xs mt-1">{errors.profession}</p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineCalendar className="inline w-4 h-4 mr-1" />
                    Age <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="1"
                    max="120"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 transition ${
                      errors.age ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="Enter your age"
                  />
                  {errors.age && (
                    <p className="text-red-400 text-xs mt-1">{errors.age}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <HiOutlineChatBubbleLeftRight className="inline w-4 h-4 mr-1" />
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 transition resize-none"
                    placeholder="Any additional message or inquiry..."
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#F5D26A] to-[#d4b85a] text-[#0a0e1a] font-semibold py-3 px-6 rounded-lg hover:from-[#d4b85a] hover:to-[#F5D26A] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WebsitePopupForm;

