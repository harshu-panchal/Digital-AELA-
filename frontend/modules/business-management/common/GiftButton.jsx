import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import TranslatedText from "../../../src/components/TranslatedText";

const formDefaults = {
  userId: "",
  fullName: "",
  email: "",
  phone: "",
  relation: "",
  messageLocation: "",
  message: "",
};

const GiftButton = ({
  className = "",
  children,
  paymentPath = "/gift/payment",
  label = "Gift",
  size = "sm",
  course = null, // Accept course/book object
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("choice");
  const [formData, setFormData] = useState(formDefaults);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const wrapperRef = useRef(null);

  const trapEvent = (event) => {
    if (!event) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.nativeEvent && typeof event.nativeEvent.stopImmediatePropagation === "function") {
      event.nativeEvent.stopImmediatePropagation();
    }
  };

  const getPriceAndCurrency = () => {
    if (!course) return { amount: 5000, currency: "INR" };

    let price = 0;
    // Check rawPrice first (numeric)
    if (course.rawPrice !== undefined && course.rawPrice !== null) {
      price = parseFloat(course.rawPrice) || 0;
    }
    // Check direct numeric price
    else if (typeof course.price === 'number') {
      price = course.price;
    }
    // Parse string price
    else if (typeof course.price === 'string') {
      if (course.price.toLowerCase().includes('free')) {
        price = 0;
      } else {
        price = parseFloat(course.price.replace(/[^0-9.]/g, '')) || 0;
      }
    }

    // Default to a fallback if extraction fails, but prefer passing 0 to let user set it if logical
    // But for "Buy" equivalent, we want the item price. 
    // If it's 0 (Free), maybe gifting isn't relevant? Or maybe it's a donation?
    // User complaint implies they want the item price.

    return {
      // Trust the extraction and fallback to extracted price (which defaults to 0)
      // or if 0 doesn't make sense for a gift, consider the 5000 fallback carefully.
      // For now, eliminating duplication while keeping the extracted price.
      amount: price || 5000,
      currency: "INR" // Default to INR for courses/books as per user request
    };
  };

  const sizeClasses = useMemo(() => {
    switch (size) {
      case "lg":
        return "py-3 text-base";
      case "md":
        return "py-2.5 text-sm";
      default:
        return "py-2 text-xs";
    }
  }, [size]);

  const handleOpen = (event) => {
    trapEvent(event);
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setStep("choice");
      setErrors({});
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("choice");
    setFormData(formDefaults);
    setErrors({});
    setShowForm(false);
    setMenuPosition(null);
  };

  const handleGiftAnyone = (event) => {
    trapEvent(event);

    const { amount, currency } = getPriceAndCurrency();

    const params = new URLSearchParams({
      type: "gift",
      giftType: "anyone",
      amount: amount.toString(),
      currency: currency
    });

    if (course && (course.title || course.name)) {
      params.set("itemName", course.title || course.name);
    }

    // Redirect to custom payment page first
    window.location.href = `/payment/confirm?${params.toString()}`;
    setIsOpen(false);
    setStep("choice");
    setErrors({});
    setMenuPosition(null);
  };

  const handleSelectNearOne = (event) => {
    trapEvent(event);
    setIsOpen(false);
    setStep("form");
    setShowForm(true);
    setErrors({});
    setMenuPosition(null);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.userId.trim()) {
      nextErrors.userId = "User ID is required"; // Error messages can stay in English for now
    }
    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required"; // Error messages can stay in English for now
    }
    return nextErrors;
  };

  const handleGiftNearOne = (event) => {
    trapEvent(event);
    event.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const { amount, currency } = getPriceAndCurrency();

    const params = new URLSearchParams({
      type: "gift",
      giftType: "near",
      userId: formData.userId.trim(),
      fullName: formData.fullName.trim(),
      amount: amount.toString(),
      currency: currency
    });

    if (course && (course.title || course.name)) {
      params.set("itemName", course.title || course.name);
    }

    if (formData.email.trim()) {
      params.set("email", formData.email.trim());
    }
    if (formData.phone.trim()) {
      params.set("phone", formData.phone.trim());
    }
    if (formData.relation.trim()) {
      params.set("relation", formData.relation.trim());
    }
    if (formData.messageLocation.trim()) {
      params.set("location", formData.messageLocation.trim());
    }
    if (formData.message.trim()) {
      params.set("message", formData.message.trim());
    }

    // Redirect to custom payment page first
    window.location.href = `/payment/confirm?${params.toString()}`;
    handleClose();
  };

  const updatePosition = useCallback(() => {
    const anchor = wrapperRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.max(rect.width, 220);
    const viewportWidth = window.innerWidth;
    let left = rect.left + window.scrollX;
    if (left + width > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - width - 16);
    } else {
      left = Math.max(16, left);
    }
    const top = rect.bottom + window.scrollY + 8;
    setMenuPosition({ top, left, width });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }
    updatePosition();
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setStep("choice");
        setErrors({});
        setMenuPosition(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const containerClass = className && className.includes("w-full") ? "w-full" : "";

  return (
    <div ref={wrapperRef} className={`relative inline-flex ${containerClass}`}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        onMouseDown={trapEvent}
        onPointerDown={trapEvent}
        onTouchStart={trapEvent}
        className={`rounded-lg font-bold transition-colors duration-200 ${sizeClasses} ${className}`}>
        {children || label}
      </motion.button>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && menuPosition && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  top: menuPosition.top,
                  left: menuPosition.left,
                  width: menuPosition.width,
                  zIndex: 120,
                }}
                className="min-w-[210px] rounded-xl border border-[#D4AF37]/30 bg-[#05070E]/95 p-2 shadow-[0_16px_48px_rgba(6,9,18,0.45)] backdrop-blur">
                <button
                  type="button"
                  onClick={handleSelectNearOne}
                  onMouseDown={trapEvent}
                  onPointerDown={trapEvent}
                  onTouchStart={trapEvent}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10">
                  <TranslatedText>Gift to a near one</TranslatedText>
                </button>
                <button
                  type="button"
                  onClick={handleGiftAnyone}
                  onMouseDown={trapEvent}
                  onPointerDown={trapEvent}
                  onTouchStart={trapEvent}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10">
                  <TranslatedText>Gift to anyone</TranslatedText>
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                  className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-[#05070E] shadow-[0_30px_120px_rgba(5,7,14,0.85)]">
                  <div className="absolute inset-0 bg-linear-to-br from-white/5 via-white/0 to-white/10" />
                  <div className="relative p-6 sm:p-7">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF37]/80">
                          <TranslatedText>Dedicate your gift</TranslatedText>
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                          <TranslatedText>Recipient details</TranslatedText>
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-white/40 hover:text-white">
                        <span className="sr-only">Close gift form</span>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handleGiftNearOne} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                            <TranslatedText>User ID*</TranslatedText>
                          </label>
                          <input
                            type="text"
                            value={formData.userId}
                            onChange={(event) => handleFormChange("userId", event.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                            placeholder="Recipient user ID"
                          />
                          {errors.userId && (
                            <p className="mt-1 text-xs text-red-400">{errors.userId}</p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                            <TranslatedText>Full name*</TranslatedText>
                          </label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(event) => handleFormChange("fullName", event.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                            placeholder="Recipient name"
                          />
                          {errors.fullName && (
                            <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                            <TranslatedText>Email</TranslatedText>
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(event) => handleFormChange("email", event.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                            placeholder="Recipient email"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                            <TranslatedText>Phone</TranslatedText>
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(event) => handleFormChange("phone", event.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                            placeholder="Contact number"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                            <TranslatedText>Relation</TranslatedText>
                          </label>
                          <input
                            type="text"
                            value={formData.relation}
                            onChange={(event) => handleFormChange("relation", event.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                            placeholder="Parent, friend, mentor…"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                            <TranslatedText>City / Country</TranslatedText>
                          </label>
                          <input
                            type="text"
                            value={formData.messageLocation || ""}
                            onChange={(event) => handleFormChange("messageLocation", event.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                            placeholder="Where are they based?"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                          <TranslatedText>Message (optional)</TranslatedText>
                        </label>
                        <textarea
                          rows={3}
                          value={formData.message}
                          onChange={(event) => handleFormChange("message", event.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                          placeholder="Add instructions or a note for our team"
                        />
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setStep("choice");
                            setErrors({});
                          }}
                          className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/40 hover:text-white">
                          <TranslatedText>← Back</TranslatedText>
                        </button>

                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-2 text-sm font-bold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                          <TranslatedText>Continue to payment</TranslatedText>
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default GiftButton;

