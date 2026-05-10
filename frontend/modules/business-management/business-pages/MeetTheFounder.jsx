import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import founderImage from "../../../src/assets/meetTheLeader.jpg";
import TranslatedText from "../../../src/components/TranslatedText";
import LazyImage from "../../../src/components/LazyImage";

import englishGrammarBook1 from "../../../src/assets/EnglishGrammarBook1.png";
import spokenBook2 from "../../../src/assets/SpokenBook2.png";
import dictionaryBook3 from "../../../src/assets/DictionaryBook3.png";

const MeetTheFounder = () => {
  // WhatsApp integration
  const whatsappNumber = "+971545454982";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'd like to connect regarding Digital AELA."
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
        className="relative pt-[110px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none text-center">
            <TranslatedText>Meet the Founder –</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Imran Khan</TranslatedText></span>
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
                <span className="text-[#D4AF37]"><TranslatedText>Imran Khan</TranslatedText></span>
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-xl md:text-2xl font-semibold text-[#D4AF37] mb-2">
                <TranslatedText>Founder & CEO, Digital AELA</TranslatedText>
              </motion.p>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="text-lg text-gray-300 mb-6">
                <TranslatedText>Author of 3 Best-Selling English Learning Books</TranslatedText>
              </motion.p>

              <motion.blockquote
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="border-l-4 border-[#D4AF37] pl-4 mb-8 italic text-lg text-gray-200">
                <TranslatedText>"Education changed my life, so I dedicated my life to changing others." — Imran Khan</TranslatedText>
              </motion.blockquote>
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
                  className="h-auto w-full max-w-xs rounded-2xl object-cover"
                  loading="eager"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-12 bg-black relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="space-y-6">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-base md:text-lg text-gray-300 leading-relaxed">
              <TranslatedText>
                My teaching journey began in 2015, not with an institute or business plan — but with a simple intention to help students who had dreams bigger than their circumstances.
              </TranslatedText>
            </motion.p>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-base md:text-lg text-gray-300 leading-relaxed">
              <TranslatedText>
                I started my work by teaching completely free, guiding learners in communication and helping them secure jobs in corporate companies. Seeing my students grow gave me a purpose far greater than anything a corporate salary could offer.
              </TranslatedText>
            </motion.p>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-base md:text-lg text-[#D4AF37] font-semibold leading-relaxed">
              <TranslatedText>The love, trust, and success stories of my students changed my life.</TranslatedText>
            </motion.p>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="text-base md:text-lg text-gray-300 leading-relaxed">
              <TranslatedText>
                Their confidence inspired me to leave my corporate career behind and, in 2019, I launched my first English academy — a space created to uplift learners from every background and prepare them for real success.
              </TranslatedText>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Books Section */}
      <section className="py-12 bg-[#141414] relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}>
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-white mb-6 font-display">
              <TranslatedText>As my teaching expanded, I wanted to create resources that could reach people beyond my classroom.</TranslatedText>
            </motion.h3>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-lg md:text-xl text-[#D4AF37] mb-8 font-semibold">
              <TranslatedText>This led to the publication of three books:</TranslatedText>
            </motion.p>

            <div className="space-y-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-20 rounded-md overflow-hidden border border-[#D4AF37]/30 shadow-sm">
                    <LazyImage
                      src={englishGrammarBook1}
                      alt="Master English Grammar Book"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2 font-display">
                      <TranslatedText>2021 — Master English Grammar (From School to Competitive)</TranslatedText>
                    </h4>
                    <p className="text-gray-300 mb-3">
                      <TranslatedText>A bestseller that strengthened grammar foundations for thousands.</TranslatedText>
                    </p>
                    <Link
                      to="/books/69a043cb6577f6ac2a6df5c1"
                      className="inline-block bg-[#D4AF37] text-black px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-[#E5C158] transition-colors duration-200"
                    >
                      <TranslatedText>Buy Now</TranslatedText>
                    </Link>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-20 rounded-md overflow-hidden border border-[#D4AF37]/30 shadow-sm">
                    <LazyImage
                      src={spokenBook2}
                      alt="5000 Advanced English Structures Book"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2 font-display">
                      <TranslatedText>2022 — 5000 Advanced English Structures</TranslatedText>
                    </h4>
                    <p className="text-gray-300 mb-3">
                      <TranslatedText>A breakthrough book that helped learners move from basic to advanced English fluently.</TranslatedText>
                    </p>
                    <Link
                      to="/books/69a046c46577f6ac2a6df9de"
                      className="inline-block bg-[#D4AF37] text-black px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-[#E5C158] transition-colors duration-200"
                    >
                      <TranslatedText>Buy Now</TranslatedText>
                    </Link>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-20 rounded-md overflow-hidden border border-[#D4AF37]/30 shadow-sm">
                    <LazyImage
                      src={dictionaryBook3}
                      alt="5000 Hindi to English Dictionary"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2 font-display">
                      <TranslatedText>2023 — 5000 Hindi to English Dictionary</TranslatedText>
                    </h4>
                    <p className="text-gray-300 mb-3">
                      <TranslatedText>A complete vocabulary guide designed to remove the fear of English words forever.</TranslatedText>
                    </p>
                    <Link
                      to="/books/69a081cf6577f6ac2a6e09e6"
                      className="inline-block bg-[#D4AF37] text-black px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-[#E5C158] transition-colors duration-200"
                    >
                      <TranslatedText>Buy Now</TranslatedText>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Global Expansion Section */}
      <section className="py-12 bg-black relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="space-y-6">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-base md:text-lg text-gray-300 leading-relaxed">
              <TranslatedText>
                But my vision was bigger — I wanted to take my communication skills, teaching expertise, and student impact to a global level.
              </TranslatedText>
            </motion.p>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-base md:text-lg text-gray-300 leading-relaxed">
              <TranslatedText>
                In 2025, I moved to Dubai, expanding Digital AELA across 6 countries, empowering students through books, live classes, and digital learning.
              </TranslatedText>
            </motion.p>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-base md:text-lg text-[#D4AF37] font-semibold leading-relaxed">
              <TranslatedText>
                Today, Alhamdulillah, thousands of learners are improving their English, upgrading their careers, and changing their future — all through the ecosystem of Digital AELA.
              </TranslatedText>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="py-12 bg-[#141414] relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="bg-[#1a1a1a] rounded-xl p-8 md:p-10 border border-[#D4AF37]/20 shadow-lg">
            <motion.blockquote
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-center">
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-4 italic">
                <TranslatedText>"My mission is simple:</TranslatedText>
              </p>
              <p className="text-xl md:text-2xl text-[#D4AF37] leading-relaxed mb-6 font-semibold">
                <TranslatedText>
                  To make world-class English education accessible, affordable, and life-changing for every learner — from a small town student to a global professional."
                </TranslatedText>
              </p>
              <footer className="text-base md:text-lg text-gray-400 font-semibold font-display">
                — <TranslatedText>Imran Khan, Founder</TranslatedText>
              </footer>
            </motion.blockquote>
          </motion.div>
        </div>
      </section>

      {/* Closing Statement */}
      <section className="py-12 bg-black relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-xl md:text-2xl text-[#D4AF37] font-semibold font-display">
            <TranslatedText>The journey continues… and this is just the beginning.</TranslatedText>
          </motion.p>
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
              <TranslatedText>Want to Know More?</TranslatedText>
            </h2>
            <p className="text-sm md:text-base text-gray-300 mb-5 max-w-2xl mx-auto">
              <TranslatedText>
                Connect with us to learn more about Digital AELA's mission, courses,
                and how we can help you achieve your learning and career goals.
              </TranslatedText>
            </p>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#D4AF37] text-black px-6 py-2.5 rounded-lg font-bold text-sm md:text-base hover:bg-[#E5C158] transition-colors duration-200">
              <TranslatedText>Know More</TranslatedText>
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MeetTheFounder;

