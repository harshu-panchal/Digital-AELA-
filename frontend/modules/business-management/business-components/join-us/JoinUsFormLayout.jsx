import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

const JoinUsFormLayout = ({
  title,
  subtitle,
  image,
  imageAlt,
  formConfig,
  ctaLabel = "Submit",
  disclaimer,
}) => {
  const initialValues = useMemo(
    () =>
      formConfig.reduce((acc, field) => {
        acc[field.name] = field.defaultValue ?? "";
        return acc;
      }, {}),
    [formConfig]
  );

  const [formData, setFormData] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    for (const field of formConfig) {
      const value = formData[field.name];
      if (field.required && String(value ?? "").trim().length === 0) {
        toast.error(`Please enter ${field.label.toLowerCase()}.`, {
          toastId: `join-us-${field.name}-error`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Thanks for reaching out! Our team will contact you soon.", {
        toastId: "join-us-success",
      });
      setFormData(initialValues);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <section className="relative overflow-hidden bg-[#050505] pb-20 pt-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(17,24,39,0.55),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/80" />

      <div className="layout-container relative grid gap-12 lg:grid-cols-[1fr,1.05fr] xl:gap-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-3xl supports-[backdrop-filter]:bg-white/8">
            <div className="absolute inset-0 bg-gradient-to-br from-[#111827]/60 via-transparent to-[#02050b]/80" />
            <img
              src={image}
              alt={imageAlt}
              className="h-72 w-full object-cover sm:h-80 lg:h-[22rem]"
              loading="lazy"
            />
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="relative rounded-3xl border border-white/10 bg-white/8 p-6 shadow-[0_24px_80px_rgba(8,11,20,0.55)] backdrop-blur-3xl supports-[backdrop-filter]:bg-white/12 sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/5" />
          <div className="relative">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-300/90 sm:text-base">{subtitle}</p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              {formConfig.map((field) => {
                const commonProps = {
                  id: field.name,
                  name: field.name,
                  value: formData[field.name],
                  onChange: handleChange,
                  required: field.required,
                  placeholder: field.placeholder,
                  className:
                    "w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/30 backdrop-blur supports-[backdrop-filter]:bg-white/15",
                };

                return (
                  <label key={field.name} htmlFor={field.name} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-100">{field.label}</span>
                    {field.type === "select" ? (
                      <select {...commonProps}>
                        <option value="">Select an option</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        {...commonProps}
                        rows={field.rows ?? 4}
                        className={`${commonProps.className} resize-none`}
                      />
                    ) : (
                      <input {...commonProps} type={field.type ?? "text"} />
                    )}
                    {field.helperText && (
                      <span className="block text-xs text-slate-400">{field.helperText}</span>
                    )}
                  </label>
                );
              })}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-6 py-3 text-sm font-semibold text-black shadow-[0_8px_35px_rgba(245,210,106,0.35)] transition focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 disabled:cursor-not-allowed disabled:opacity-80">
                {isSubmitting ? "Sending..." : ctaLabel}
              </motion.button>

              {disclaimer && (
                <p className="text-xs text-slate-400/80">
                  {disclaimer}
                </p>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default JoinUsFormLayout;

