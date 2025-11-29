import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSocialMedia } from "../../../src/hooks/useSocialMedia";
import logo from "../../../src/assets/MainLogo.png";
import googlePlay from "../../../src/assets/googlePlay.png";
import TranslatedText from "../../../src/components/TranslatedText";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { socialLinks } = useSocialMedia();

  const footerColumns = [
    {
      id: "explore",
      title: <TranslatedText>Explore</TranslatedText>,
      links: [{ id: "learn-earn", label: <TranslatedText>Learn & Earn</TranslatedText>, to: "/learn-earn" }],
    },
    {
      id: "courses",
      title: <TranslatedText>Courses</TranslatedText>,
      links: [
        { id: "corporate-training", label: <TranslatedText>Corporate Training</TranslatedText>, to: "/courses/corporate-training" },
        { id: "digital-marketing", label: <TranslatedText>Digital Marketing</TranslatedText>, to: "/courses/digital-marketing" },
        { id: "english-language", label: <TranslatedText>English Language</TranslatedText>, to: "/courses/english-language" },
      ],
    },
    {
      id: "resources",
      title: <TranslatedText>Resources</TranslatedText>,
      links: [
        { id: "aela-blogs", label: <TranslatedText>AELA Blogs</TranslatedText>, to: "/blogs" },
        { id: "youtube", label: <TranslatedText>YouTube</TranslatedText>, to: "/resources/youtube" },
        { id: "free-downloads", label: <TranslatedText>Free Downloads</TranslatedText>, to: "/resources/downloads" },
        { id: "books", label: <TranslatedText>Books</TranslatedText>, to: "/books" },
      ],
    },
    {
      id: "about",
      title: <TranslatedText>About Digital AELA</TranslatedText>,
      links: [
        { id: "our-story", label: <TranslatedText>Our Story</TranslatedText>, to: "/about/our-story" },
        { id: "mission-vision", label: <TranslatedText>Mission & Vision</TranslatedText>, to: "/about/mission-vision" },
        { id: "founder", label: <TranslatedText>Meet the Founder</TranslatedText>, to: "/about/founder" },
        {
          id: "success-stories",
          label: <TranslatedText>Student Success Stories</TranslatedText>,
          to: "/about/success-stories",
        },
      ],
    },
    {
      id: "contact",
      title: <TranslatedText>Contact</TranslatedText>,
      links: [
        { id: "book-demo", label: <TranslatedText>Book a Demo Class</TranslatedText>, to: "/contact/book-demo" },
        {
          id: "business-collaboration",
          label: <TranslatedText>Request Collaboration</TranslatedText>,
          to: "/contact/business-collaboration",
        },
        {
          id: "franchise",
          label: <TranslatedText>Franchise Inquiry</TranslatedText>,
          to: "/contact/franchise-partnership",
        },
      ],
    },
    {
      id: "legal",
      title: <TranslatedText>Legal</TranslatedText>,
      links: [
        { id: "disclaimer", label: <TranslatedText>Disclaimer</TranslatedText>, to: "/disclaimer" },
        { id: "privacy-policy", label: <TranslatedText>Privacy Policy</TranslatedText>, to: "/privacy-policy" },
        {
          id: "refund-policy",
          label: <TranslatedText>Refund & Cancellation Policy</TranslatedText>,
          to: "/refund-cancellation-policy",
        },
        { id: "terms", label: <TranslatedText>Terms & Conditions</TranslatedText>, to: "/terms-conditions" },
      ],
    },
  ];

  // Build social links array from dynamic settings
  const socialLinksArray = [
    { id: "linkedin", label: <TranslatedText>LinkedIn</TranslatedText>, url: socialLinks.linkedin },
    { id: "instagram", label: <TranslatedText>Instagram</TranslatedText>, url: socialLinks.instagram },
    { id: "youtube", label: <TranslatedText>YouTube</TranslatedText>, url: socialLinks.youtube },
    { id: "facebook", label: <TranslatedText>Facebook</TranslatedText>, url: socialLinks.facebook },
  ].filter((link) => link.url); // Only show links that have URLs

  return (
    <footer className="relative bg-white/5 backdrop-blur-xl border-t-2 border-[#D4AF37]/40 text-[#F5D26A] shadow-[0_-8px_32px_rgba(255,255,255,0.1)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"></div>

      <div className="layout-container py-1 sm:py-1 space-y-1 relative z-1">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-2 xl:gap-3 lg:items-start">
          {/* Logo and About Column - Left Side */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:max-w-[280px] space-y-1 lg:-ml-16 xl:-ml-20 2xl:-ml-24">
            <div className="flex items-center gap-3">
              <Link to="/" className="inline-block">
                <img
                  src={logo}
                  alt="Digital AELA Logo"
                  className="h-16 md:h-20 lg:h-24 w-auto"
                />
              </Link>
            </div>
            <p className="text-xs md:text-sm text-white/80 leading-relaxed">
              <TranslatedText>
                Digital AELA is a leading educational platform dedicated to
                empowering learners worldwide through innovative digital courses,
                comprehensive training programs, and transformative learning
                experiences.
              </TranslatedText>
            </p>
          </motion.div>

          {/* Footer Links Columns - Right Side */}
          <div className="flex-1 grid gap-12 md:gap-16 lg:gap-20 xl:gap-24 2xl:gap-28 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 lg:ml-0 xl:ml-0 2xl:ml-0 lg:min-w-0 lg:w-full xl:max-w-none">
            {footerColumns.map((column, columnIndex) => (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.3,
                  delay: 0.05 * columnIndex,
                  ease: "easeOut",
                }}
                className="space-y-2 mt-6 md:mt-8 lg:mt-10">
                <h3 className="text-sm md:text-base font-bold text-[#D4AF37] font-accent tracking-wide uppercase whitespace-nowrap">
                  {column.title}
                </h3>
                <ul className="space-y-1.5">
                  {column.links.map((link, linkIndex) => (
                    <motion.li
                      key={link.id || link.to || link.url}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: 0.05 * linkIndex }}
                      className="text-xs md:text-sm text-white hover:text-[#FFE28A] transition-colors duration-200">
                      {link.to ? (
                        <Link
                          to={link.to}
                          className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span className="h-[2px] w-2 rounded-full bg-[#D4AF37]/40"></span>
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span className="h-[2px] w-2 rounded-full bg-[#D4AF37]/40"></span>
                          {link.label}
                        </a>
                      )}
                    </motion.li>
                  ))}
                  {column.id === "explore" && (
                    <motion.li
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: 0.1 }}
                      className="-mt-[40px]">
                      <a
                        href="https://play.google.com/store/apps/details?id=co.alexis.ynbij"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block transition-transform duration-200 hover:scale-105">
                        <img
                          src={googlePlay}
                          alt="Download on Google Play"
                          className="h-40 w-auto max-w-[400px]"
                        />
                      </a>
                    </motion.li>
                  )}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] md:text-xs text-[#F5D26A]/60">
            © {currentYear} <TranslatedText>Digital AELA. All rights reserved.</TranslatedText>
          </p>
          <div className="flex flex-wrap items-center gap-3 justify-end">
            {socialLinksArray.length > 0 ? (
              socialLinksArray.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs md:text-sm text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200">
                  {social.label}
                </a>
              ))
            ) : (
              <>
                <a
                  href={socialLinks.linkedin || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs md:text-sm text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200">
                  <TranslatedText>LinkedIn</TranslatedText>
                </a>
                <a
                  href={socialLinks.instagram || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs md:text-sm text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200">
                  <TranslatedText>Instagram</TranslatedText>
                </a>
                <a
                  href={socialLinks.youtube || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs md:text-sm text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200">
                  <TranslatedText>YouTube</TranslatedText>
                </a>
                <a
                  href={socialLinks.facebook || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs md:text-sm text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200">
                  <TranslatedText>Facebook</TranslatedText>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
