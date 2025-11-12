// eslint-disable-next-line no-unused-vars
import { useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import founderImage from "../../../src/assets/Founder.png";

const MeetTheFounder = () => {
  // WhatsApp integration
  const whatsappNumber = "+971508185690";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in learning more about Digital AELA."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Force scroll to top and ensure content loads on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    // Force a reflow to ensure animations trigger
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Meet Our Founder – Imran Khan | Digital AELA"
        description="Meet Imran Khan, the founder of Digital AELA - an educator, author, and entrepreneur dedicated to making education practical, accessible, and financially rewarding."
        keywords="Imran Khan, Digital AELA founder, educator, author, entrepreneur, English learning, digital marketing courses, education platform"
        url="https://digitalaela.com/about/founder"
      />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-center mb-6">
            <span className="inline-block border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg text-xs md:text-sm font-semibold font-display uppercase tracking-wide">
              From Learning To Earning
            </span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none text-center">
            Meet Our <span className="text-[#D4AF37]">Founder</span>
          </motion.h1>
        </div>
      </motion.section>

      {/* Founder Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 items-center gap-8 md:gap-12 lg:grid-cols-2">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="order-2 text-center lg:order-1 lg:text-left">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-2xl md:text-4xl font-bold text-white mb-4 font-display">
                <span className="text-[#D4AF37]">Imran Khan</span>
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
                Digital AELA was founded by Imran Khan, an educator, author, and
                entrepreneur with a mission to make education practical, accessible,
                and financially rewarding. From writing books on English learning to
                designing digital marketing courses, he has dedicated his life to
                building a platform that does not just promise education but delivers
                results in careers and earnings.
              </motion.p>
            </motion.div>
            {/* Right Side - Founder Image */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="order-1 flex justify-center lg:order-2 lg:justify-end">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative">
                <img
                  src={founderImage}
                  alt="Imran Khan - Founder of Digital AELA, Educator, Author, and Entrepreneur"
                  className="h-auto w-full max-w-md rounded-2xl object-cover"
                  loading="eager"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision Quote Section */}
      <section className="py-10 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 font-display">
                His Vision
              </h3>
            </div>
            <blockquote className="text-center">
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-4 italic">
                "If education cannot help you grow financially, it is incomplete.
                At Digital AELA, every learner is not just a student but a future
                success story."
              </p>
              <footer className="text-base md:text-lg text-[#D4AF37] font-semibold font-display">
                — Imran Khan, Founder
              </footer>
            </blockquote>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 border border-[#D4AF37]/20 shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 font-display">
              Want to Know More?
            </h2>
            <p className="text-sm md:text-base text-gray-300 mb-5 max-w-2xl mx-auto">
              Connect with us to learn more about Digital AELA's mission, courses,
              and how we can help you achieve your learning and career goals.
            </p>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#D4AF37] text-black px-6 py-2.5 rounded-lg font-bold text-sm md:text-base hover:bg-[#E5C158] transition-colors duration-200">
              Know More
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MeetTheFounder;

