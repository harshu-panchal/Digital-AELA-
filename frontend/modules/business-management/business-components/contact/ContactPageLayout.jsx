import { motion } from "framer-motion";

const ContactPageLayout = ({ badge, title, subtitle, description, children }) => {
  return (
    <div className="min-h-screen bg-black">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="absolute top-[-120px] right-[-120px] w-[320px] h-[320px] md:w-[420px] md:h-[420px] bg-[#D4AF37]/10 rounded-full blur-3xl"
        ></motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-[-160px] left-[-160px] w-[360px] h-[360px] md:w-[460px] md:h-[460px] bg-[#D4AF37]/10 rounded-full blur-3xl"
        ></motion.div>

        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {badge && (
            <motion.span
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/40 bg-[#1a1a1a]/80 text-[#D4AF37] text-xs md:text-sm font-semibold uppercase tracking-[0.2em] font-display"
            >
              {badge}
            </motion.span>
          )}

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="clamp-heading font-bold text-white mb-4 font-display tracking-tight leading-tight text-balance"
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-base sm:text-lg md:text-xl text-[#D4AF37] font-semibold mb-4 text-balance"
            >
              {subtitle}
            </motion.h2>
          )}

          {description && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed text-balance"
            >
              {description}
            </motion.p>
          )}
        </div>
      </motion.section>

      <section className="py-12 md:py-16 bg-[#111111] relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D4AF37]/40 to-transparent"></div>
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute w-44 h-44 bg-[#D4AF37]/10 rounded-full blur-2xl -top-10 right-10"></div>
          <div className="absolute w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl bottom-0 left-16"></div>
        </div>
        <div className="relative layout-container">
          {children}
        </div>
      </section>
    </div>
  );
};

export default ContactPageLayout;

