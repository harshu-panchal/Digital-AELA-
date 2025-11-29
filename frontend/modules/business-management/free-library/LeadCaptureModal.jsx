import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { createPublicLead } from "../../../src/services/api/crm";
import TranslatedText from "../../../src/components/TranslatedText";

const BOOK_PREFERENCES = [
  "Public Speaking",
  "IELTS & Test Prep",
  "Corporate Communication",
  "Leadership & Soft Skills",
  "Digital Marketing",
  "Career Development",
  "Learn & Earn",
  "Other",
];

const LeadCaptureModal = ({ isOpen, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bookPreferences: [],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        bookPreferences: [],
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Simple validation - no phone format checking
  const validateForm = () => {
    const newErrors = {};

    // First name validation
    const firstName = (formData.firstName || "").trim();
    if (!firstName) {
      newErrors.firstName = "First name is required";
    }

    // Last name validation
    const lastName = (formData.lastName || "").trim();
    if (!lastName) {
      newErrors.lastName = "Last name is required";
    }

    // Email validation - simple check
    const email = (formData.email || "").trim().toLowerCase();
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@") || !email.includes(".")) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation - ONLY check if empty, NO format validation
    const phone = (formData.phone || "").trim();
    if (!phone) {
      newErrors.phone = "Phone number is required";
    }
    // NO format validation - accept any input

    // Book preferences validation
    if (!formData.bookPreferences || formData.bookPreferences.length === 0) {
      newErrors.bookPreferences = "Please select at least one book preference";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleCheckboxChange = (preference) => {
    setFormData((prev) => {
      const currentPreferences = prev.bookPreferences || [];
      const isSelected = currentPreferences.includes(preference);
      const newPreferences = isSelected
        ? currentPreferences.filter((p) => p !== preference)
        : [...currentPreferences, preference];
      return {
        ...prev,
        bookPreferences: newPreferences,
      };
    });
    // Clear error when user selects a preference
    if (errors.bookPreferences) {
      setErrors((prev) => ({
        ...prev,
        bookPreferences: undefined,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data - trim all string values
      const payload = {
        firstName: (formData.firstName || "").trim(),
        lastName: (formData.lastName || "").trim(),
        email: (formData.email || "").trim().toLowerCase(),
        phone: (formData.phone || "").trim(), // Accept any phone format
        bookPreferences: formData.bookPreferences || [],
      };

      console.log("[LeadCaptureModal] Submitting payload:", payload);

      await createPublicLead(payload);

      toast.success("Thank you! Your information has been submitted successfully.");

      // Store submission status in localStorage
      localStorage.setItem("freeLibraryLeadSubmitted", "true");

      // Call success callback to close modal
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("[LeadCaptureModal] Submission error:", error);
      console.error("[LeadCaptureModal] Error details:", {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
      });

      // Handle duplicate email error
      if (error.code === "ALREADY_EXISTS" || error.status === 409) {
        toast.error("This email is already registered. Please use a different email address.");
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered",
        }));
      } else if (error.isNetworkError) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        // Show error message from backend or generic message
        const errorMessage = error.message || "Failed to submit. Please try again.";
        toast.error(errorMessage);
        
        // If error mentions phone/contact, log it for debugging
        if (errorMessage.toLowerCase().includes("phone") || errorMessage.toLowerCase().includes("contact")) {
          console.warn("[LeadCaptureModal] Phone-related error detected:", errorMessage);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop - non-clickable */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#F5D26A]/30 bg-[#04060F] shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 border-b border-[#F5D26A]/20 bg-[#04060F]/95 backdrop-blur-sm px-6 py-4">
              <h2 className="text-2xl font-bold text-[#F5D26A]"><TranslatedText>Welcome to Free Library</TranslatedText></h2>
              <p className="mt-2 text-sm text-slate-300">
                <TranslatedText>Please fill in your details to access our free e-books</TranslatedText>
              </p>
            </div>

            {/* Form Content */}
            <form 
              onSubmit={handleSubmit} 
              className="p-6 space-y-5"
              noValidate
            >
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-200 mb-2">
                  <TranslatedText>First Name</TranslatedText> <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.firstName
                      ? "border-red-500 bg-red-500/10"
                      : "border-white/20 bg-white/5"
                  } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 focus:border-[#F5D26A]/50 transition-colors`}
                  placeholder="Enter your first name"
                  disabled={isSubmitting}
                  autoComplete="given-name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-200 mb-2">
                  <TranslatedText>Last Name</TranslatedText> <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.lastName
                      ? "border-red-500 bg-red-500/10"
                      : "border-white/20 bg-white/5"
                  } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 focus:border-[#F5D26A]/50 transition-colors`}
                  placeholder="Enter your last name"
                  disabled={isSubmitting}
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                  <TranslatedText>Email</TranslatedText> <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.email
                      ? "border-red-500 bg-red-500/10"
                      : "border-white/20 bg-white/5"
                  } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 focus:border-[#F5D26A]/50 transition-colors`}
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Phone - NO validation, accept any input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-200 mb-2">
                  <TranslatedText>Phone Number</TranslatedText> <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.phone
                      ? "border-red-500 bg-red-500/10"
                      : "border-white/20 bg-white/5"
                  } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 focus:border-[#F5D26A]/50 transition-colors`}
                  placeholder="Enter your phone number (any format)"
                  disabled={isSubmitting}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                )}
              </div>

              {/* Book Preferences */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  <TranslatedText>Book Preferences</TranslatedText> <span className="text-red-400">*</span>
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    <TranslatedText>(Select all that apply)</TranslatedText>
                  </span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {BOOK_PREFERENCES.map((preference) => (
                    <label
                      key={preference}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.bookPreferences.includes(preference)}
                        onChange={() => handleCheckboxChange(preference)}
                        className="w-5 h-5 rounded border-white/30 bg-white/5 text-[#F5D26A] focus:ring-2 focus:ring-[#F5D26A]/50 focus:ring-offset-2 focus:ring-offset-[#04060F] cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-slate-200">{preference}</span>
                    </label>
                  ))}
                </div>
                {errors.bookPreferences && (
                  <p className="mt-2 text-sm text-red-400">{errors.bookPreferences}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 px-6 py-3 rounded-lg bg-[#F5D26A] text-[#04060F] font-semibold hover:bg-[#F5D26A]/90 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 focus:ring-offset-2 focus:ring-offset-[#04060F] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#04060F]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <TranslatedText>Submitting...</TranslatedText>
                  </span>
                ) : (
                  <TranslatedText>Submit & Continue</TranslatedText>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LeadCaptureModal;
