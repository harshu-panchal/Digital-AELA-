import { motion } from "framer-motion";

const AccessAuthLayout = ({
  badge,
  title,
  description,
  children,
  highlights = [],
}) => {
  return (
    <div className="min-h-screen bg-black">
      <motion.section
        className="relative pt-[140px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <motion.div
          className="absolute top-[-140px] right-[-140px] w-[320px] h-[320px] md:w-[420px] md:h-[420px] bg-[#D4AF37]/10 rounded-full blur-xl"></motion.div>

        <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {badge && (
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/40 bg-[#1a1a1a]/80 text-[#D4AF37] text-[11px] md:text-xs font-semibold uppercase tracking-[0.3em] font-display">
              {badge}
            </motion.span>
          )}

          <motion.h1
            className="clamp-heading font-bold text-white mb-4 font-display tracking-tight leading-tight text-balance">
            {title}
          </motion.h1>

          {description && (
            <motion.p
              className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed text-balance">
              {description}
            </motion.p>
          )}
        </div>
      </motion.section>

      <section className="py-12 md:py-14 bg-[#111111] relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-2xl -top-6 right-6"></div>
          <div className="absolute w-28 h-28 bg-[#D4AF37]/10 rounded-full blur-2xl bottom-0 left-12"></div>
        </div>
        <div className="relative layout-container max-w-6xl">
          {children}
          {highlights.length > 0 && (
            <motion.div
              className="mt-10 auto-grid-sm md:grid-cols-3">
              {highlights.map((item, index) => (
                <div
                  key={index}
                  className="bg-[#0b0b0b] border border-[#D4AF37]/15 rounded-2xl px-4 py-5 text-xs md:text-sm text-gray-300 leading-relaxed">
                  {item}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AccessAuthLayout;
