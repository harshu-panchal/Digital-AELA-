import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { validateContactForm, sanitizeUrl, safeString } from "../../../../src/utils/registrationHelpers";
import { toast } from "react-toastify";

const STORAGE_KEY = "aela.form.submissions";

const getStoredSubmissions = () => {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const storeSubmission = (formId, email) => {
  if (typeof window === "undefined") return;
  try {
    const submissions = getStoredSubmissions();
    submissions[`${formId}:${email.toLowerCase().trim()}`] = {
      submittedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch {
    // Ignore storage errors
  }
};

const checkSubmission = (formId, email) => {
  if (!formId || !email) return false;
  const submissions = getStoredSubmissions();
  return !!submissions[`${formId}:${email.toLowerCase().trim()}`];
};

const ContactForm = ({
  fields,
  submitLabel = "Submit",
  successMessage = "Thank you! Our team will reach out shortly.",
  disclaimer,
  onSubmit,
  errorMessage = "We couldn't submit your request. Please try again.",
  formId,
  pendingMessage = "Your submission is pending approval. We will review it and get back to you soon.",
}) => {
  const initialValues = useMemo(() => {
    return fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue || "";
      return acc;
    }, {});
  }, [fields]);

  const [formData, setFormData] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  // Check if form has been submitted when email changes
  useEffect(() => {
    if (formId && formData.email) {
      const submitted = checkSubmission(formId, formData.email);
      setIsAlreadySubmitted(submitted);
    }
  }, [formId, formData.email]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const issues = validateContactForm(fields, formData);
    if (issues.length > 0) {
      toast.error(issues[0], { toastId: `contact-form-error-${issues[0]}` });
      return;
    }

    const normalizedData = fields.reduce((acc, field) => {
      const rawValue = formData[field.name];
      
      // Handle file inputs separately - pass File object directly
      if (field.type === "file") {
        if (rawValue instanceof File) {
          acc[field.name] = rawValue; // Pass File object for upload
        } else {
          // If no file, skip this field (don't add empty string)
        }
        return acc;
      }
      
      const value = safeString(rawValue);
      if (!value) {
        acc[field.name] = "";
        return acc;
      }

      if (field.type === "url" || field.name.toLowerCase().includes("link") || field.name.toLowerCase().includes("website")) {
        acc[field.name] = sanitizeUrl(value);
      } else {
        acc[field.name] = value;
      }
      return acc;
    }, {});

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await Promise.resolve(onSubmit(normalizedData));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Store submission in localStorage
      if (formId && normalizedData.email) {
        storeSubmission(formId, normalizedData.email);
        setIsAlreadySubmitted(true);
      }

      setStatus("success");
      setFormData(initialValues);
    } catch (error) {
      const message =
        (error && typeof error === "object" && "message" in error && error.message) ||
        errorMessage;
      toast.error(message, { toastId: "contact-form-error-generic" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show thank you message if already submitted
  if (isAlreadySubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0b0b0b] border border-[#D4AF37]/20 rounded-2xl p-8 md:p-10 shadow-[0_0_24px_rgba(212,175,55,0.06)] text-center space-y-4">
        <div className="text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-semibold text-white mb-2">Thank You!</h3>
        <p className="text-[#D4AF37] text-lg mb-4">{successMessage}</p>
        <p className="text-gray-400 text-sm">{pendingMessage}</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="bg-[#0b0b0b] border border-[#D4AF37]/20 rounded-2xl p-5 md:p-7 shadow-[0_0_24px_rgba(212,175,55,0.06)] space-y-5">
      {status === "success" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#4ade80]/30 bg-[#1a2e23] text-[#9ef6c5] px-4 py-2.5 rounded-xl text-xs md:text-sm">
          {successMessage}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const {
            name,
            label,
            type = "text",
            placeholder,
            options = [],
            fullWidth,
            required = true,
            rows = 4,
            autoComplete,
            help,
          } = field;

          const containerClass = fullWidth ? "md:col-span-2" : "md:col-span-1";

          const sharedClasses =
            "w-full bg-[#050505] border border-[#D4AF37]/20 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/30 text-white rounded-lg px-3 py-2.5 text-xs md:text-sm transition-all duration-200 placeholder:text-gray-500";

          return (
            <div key={name} className={containerClass}>
              <label
                htmlFor={name}
                className="block text-xs font-semibold text-white mb-1.5">
                {label}
                {required && <span className="text-[#D4AF37]"> *</span>}
              </label>

              {type === "textarea" ? (
                <textarea
                  id={name}
                  name={name}
                  value={formData[name] || ""}
                  onChange={handleChange}
                  rows={rows}
                  placeholder={placeholder}
                  required={required}
                  autoComplete={autoComplete}
                  className={`${sharedClasses} resize-none`}></textarea>
              ) : type === "select" ? (
                <select
                  id={name}
                  name={name}
                  value={formData[name] || ""}
                  onChange={handleChange}
                  required={required}
                  autoComplete={autoComplete}
                  className={`${sharedClasses} appearance-none pr-7 bg-[url('data:image/svg+xml;utf8,<svg fill=\'white\' height=\'14\' viewBox=\'0 0 20 20\' width=\'14\' xmlns=\'http://www.w3.org/2000/svg\'><polygon points=\'0,0 20,0 10,8\'/></svg>')] bg-[length:11px] bg-no-repeat bg-[right_0.85rem_center]`}>
                  <option value="">{placeholder || `Select ${label}`}</option>
                  {options.map((option) => {
                    const value =
                      typeof option === "string" ? option : option.value;
                    const text =
                      typeof option === "string" ? option : option.label;
                    return (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    );
                  })}
                </select>
              ) : type === "file" ? (
                <input
                  id={name}
                  name={name}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Store file object in formData
                      setFormData((prev) => ({ ...prev, [name]: file }));
                    }
                  }}
                  accept={field.accept}
                  required={required}
                  className={sharedClasses}
                />
              ) : (
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={formData[name] || ""}
                  onChange={handleChange}
                  placeholder={placeholder}
                  required={required}
                  autoComplete={autoComplete}
                  className={sharedClasses}
                />
              )}

              {help && (
                <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
                  {help}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-1 space-y-3">
        <motion.button
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] text-black font-semibold px-5 py-2.5 rounded-lg text-xs md:text-sm transition-all duration-200 hover:bg-[#E5C158] disabled:opacity-70 disabled:cursor-not-allowed">
          {isSubmitting ? "Sending..." : submitLabel}
        </motion.button>

        {disclaimer && (
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {disclaimer}
          </p>
        )}
      </div>
    </motion.form>
  );
};

export default ContactForm;
