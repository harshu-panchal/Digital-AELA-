import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const formDefaults = {
  userId: "",
  fullName: "",
  email: "",
  phone: "",
  relation: "",
  messageLocation: "",
  message: "",
};

const DonateButton = ({
  className = "",
  children,
  paymentPath = "/donate/payment",
  label = "Donate",
  size = "sm",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("choice");
  const [formData, setFormData] = useState(formDefaults);
  const [errors, setErrors] = useState({});

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
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("choice");
    setFormData(formDefaults);
    setErrors({});
  };

  const handleDonateAnyone = () => {
    const params = new URLSearchParams({ type: "anyone" });
    window.location.href = `${paymentPath}?${params.toString()}`;
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
      nextErrors.userId = "User ID is required";
    }
    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required";
    }
    return nextErrors;
  };

  const handleDonateNearOne = (event) => {
    event.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const params = new URLSearchParams({
      type: "near",
      userId: formData.userId.trim(),
      fullName: formData.fullName.trim(),
    });

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

    window.location.href = `${paymentPath}?${params.toString()}`;
  };

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        className={`rounded-lg font-bold transition-colors duration-200 ${sizeClasses} ${className}`}>
        {children || label}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-[#05070E] shadow-[0_30px_120px_rgba(5,7,14,0.85)]">
              <div className="absolute inset-0 bg-linear-to-br from-white/5 via-white/0 to-white/10" />
              <div className="relative p-6 sm:p-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF37]/80">
                      Make A Difference
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                      Choose your donation flow
                    </h2>
                    <p className="mt-2 text-sm text-slate-300/80">
                      Support the AELA community by dedicating your gift to someone you love or by empowering any learner in need.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-white/40 hover:text-white">
                    <span className="sr-only">Close donate modal</span>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {step === "choice" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <motion.button
                      type="button"
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep("form")}
                      className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 p-5 text-left transition hover:border-[#D4AF37]/60 hover:bg-white/10">
                      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                        Option 1
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-white">
                        Donate to a near one
                      </h3>
                      <p className="mt-2 text-sm text-slate-300/85">
                        Fill a short form to dedicate your donation to a specific learner or family member.
                      </p>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDonateAnyone}
                      className="rounded-2xl border border-white/10 bg-[#0B1221] p-5 text-left transition hover:border-[#D4AF37]/50 hover:bg-[#111A30]">
                      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                        Option 2
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-white">
                        Donate to anyone
                      </h3>
                      <p className="mt-2 text-sm text-slate-300/85">
                        Skip the form and let us channel your contribution to learners who need it most.
                      </p>
                    </motion.button>
                  </div>
                )}

                {step === "form" && (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onSubmit={handleDonateNearOne}
                    className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                          User ID*
                        </label>
                        <input
                          type="text"
                          value={formData.userId}
                          onChange={(event) => handleFormChange("userId", event.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                          placeholder="Enter the registered user ID"
                        />
                        {errors.userId && (
                          <p className="mt-1 text-xs text-red-400">{errors.userId}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                          Full name*
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(event) => handleFormChange("fullName", event.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                          placeholder="Name of the recipient"
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                          Email
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
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                          Phone
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
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                          Relation
                        </label>
                        <input
                          type="text"
                          value={formData.relation}
                          onChange={(event) => handleFormChange("relation", event.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                          placeholder="Parent, sibling, friend, etc"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                          City / Country
                        </label>
                        <input
                          type="text"
                          value={formData.messageLocation || ""}
                          onChange={(event) => handleFormChange("messageLocation", event.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                          placeholder="Where is your recipient based?"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                        Message (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(event) => handleFormChange("message", event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                        placeholder="Share a note for our team or the recipient"
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setStep("choice");
                          setErrors({});
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/40 hover:text-white">
                        ← Back
                      </motion.button>

                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-2 text-sm font-bold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                        Continue to payment
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DonateButton;
