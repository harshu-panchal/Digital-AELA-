import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSocialMedia } from "../../../src/hooks/useSocialMedia";
import logo from "../../../src/assets/MainLogo.png";
import googlePlay from "../../../src/assets/googlePlay.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { socialLinks } = useSocialMedia();

  const footerColumns = [
    {
      title: "Explore",
      links: [{ label: "Learn & Earn", to: "/learn-earn" }],
    },
    {
      title: "Courses",
      links: [
        { label: "Corporate Training", to: "/courses/corporate-training" },
        { label: "Digital Marketing", to: "/courses/digital-marketing" },
        { label: "English Language", to: "/courses/english-language" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "AELA Blogs", to: "/blogs" },
        { label: "YouTube", to: "/resources/youtube" },
        { label: "Free Downloads", to: "/resources/downloads" },
        { label: "Books", to: "/books" },
      ],
    },
    {
      title: "About Digital AELA",
      links: [
        { label: "Our Story", to: "/about/our-story" },
        { label: "Mission & Vision", to: "/about/mission-vision" },
        { label: "Meet the Founder", to: "/about/founder" },
        {
          label: "Student Success Stories",
          to: "/about/success-stories",
        },
      ],
    },
    {
      title: "Contact",
      links: [
        { label: "Book a Demo Class", to: "/contact/book-demo" },
        {
          label: "Request Collaboration",
          to: "/contact/business-collaboration",
        },
        {
          label: "Franchise Inquiry",
          to: "/contact/franchise-partnership",
        },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Disclaimer", to: "/disclaimer" },
        { label: "Privacy Policy", to: "/privacy-policy" },
        {
          label: "Refund & Cancellation Policy",
          to: "/refund-cancellation-policy",
        },
        { label: "Terms & Conditions", to: "/terms-conditions" },
      ],
    },
  ];

  // Build social links array from dynamic settings
  const socialLinksArray = [
    { label: "LinkedIn", url: socialLinks.linkedin },
    { label: "Instagram", url: socialLinks.instagram },
    { label: "YouTube", url: socialLinks.youtube },
    { label: "Facebook", url: socialLinks.facebook },
  ].filter((link) => link.url); // Only show links that have URLs

  return (
    <footer className="relative bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-[#D4AF37]/20 text-[#F5D26A] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(212,175,55,0.1),transparent_55%)] opacity-60"></div>
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
                  className="h-12 md:h-14 w-auto"
                />
              </Link>
              <a
                href="https://play.google.com/store/apps/details?id=co.alexis.ynbij"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform duration-200 hover:scale-105">
                <img
                  src={googlePlay}
                  alt="Download on Google Play"
                  className="h-42 w-41"
                />
              </a>
            </div>
            <p className="text-xs md:text-sm text-white/80 leading-relaxed">
              Digital AELA is a leading educational platform dedicated to
              empowering learners worldwide through innovative digital courses,
              comprehensive training programs, and transformative learning
              experiences.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {socialLinksArray.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs md:text-sm text-[#F5D26A]/80 hover:text-[#FFE28A] transition-colors duration-200">
                  {social.label}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Footer Links Columns - Right Side */}
          <div className="flex-1 grid gap-12 md:gap-16 lg:gap-20 xl:gap-24 2xl:gap-28 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 lg:ml-0 xl:ml-0 2xl:ml-0 lg:min-w-0 lg:w-full xl:max-w-none">
            {footerColumns.map((column, columnIndex) => (
              <motion.div
                key={column.title}
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
                      key={link.label}
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
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] md:text-xs text-[#F5D26A]/60">
            © {currentYear} Digital AELA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
