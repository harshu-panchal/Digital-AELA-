import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const AccessAuthForm = ({
  fields,
  submitLabel,
  alternateAction,
  extraContent,
  infoText,
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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setStatus("success");
      setTimeout(() => setStatus(null), 3000);
    }, 800);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="bg-[#0b0b0b] border border-[#D4AF37]/20 rounded-2xl p-5 md:p-6 shadow-[0_0_22px_rgba(212,175,55,0.06)] space-y-5">
      {status === "success" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#4ade80]/30 bg-[#1a2e23] text-[#9ef6c5] px-3.5 py-2.5 rounded-xl text-xs">
          Submitted! Our team will be in touch shortly.
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
          const baseClasses =
            "w-full bg-[#050505] border border-[#D4AF37]/20 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/25 text-white rounded-lg px-3 py-2.5 text-xs md:text-sm transition-all duration-200 placeholder:text-gray-500";

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
                  className={`${baseClasses} resize-none`}></textarea>
              ) : type === "select" ? (
                <select
                  id={name}
                  name={name}
                  value={formData[name] || ""}
                  onChange={handleChange}
                  required={required}
                  autoComplete={autoComplete}
                  className={`${baseClasses} appearance-none pr-7 bg-[url('data:image/svg+xml;utf8,<svg fill=\'white\' height=\'14\' viewBox=\'0 0 20 20\' width=\'14\' xmlns=\'http://www.w3.org/2000/svg\'><polygon points=\'0,0 20,0 10,8\'/></svg>')] bg-[length:11px] bg-no-repeat bg-[right_0.85rem_center]`}>
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
              ) : type === "checkbox" ? (
                <div className="flex items-center gap-2">
                  <input
                    id={name}
                    name={name}
                    type="checkbox"
                    checked={formData[name] || false}
                    onChange={handleChange}
                    required={required}
                    className="h-4 w-4 rounded border-[#D4AF37]/30 bg-[#050505] text-[#D4AF37] focus:ring-[#D4AF37]/40"
                  />
                  <label htmlFor={name} className="text-xs text-gray-300">
                    {placeholder}
                  </label>
                </div>
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
                  className={baseClasses}
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
          className="w-full bg-[#D4AF37] text-black font-semibold px-5 py-2.5 rounded-lg text-xs md:text-sm transition-all duration-200 hover:bg-[#E5C158] disabled:opacity-70 disabled:cursor-not-allowed">
          {isSubmitting ? "Processing..." : submitLabel}
        </motion.button>

        {alternateAction && (
          <div className="text-[11px] text-gray-400 text-center">
            {alternateAction.prefix}{" "}
            <Link
              to={alternateAction.to}
              className="text-[#D4AF37] hover:text-[#E5C158]">
              {alternateAction.label}
            </Link>
          </div>
        )}

        {infoText && (
          <p className="text-[11px] text-gray-500 leading-relaxed text-center">
            {infoText}
          </p>
        )}
      </div>

      {extraContent}
    </motion.form>
  );
};

export default AccessAuthForm;
