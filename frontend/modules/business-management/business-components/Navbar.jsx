import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPhone,
  FaYoutube,
} from "react-icons/fa";
import { useLanguage } from "../../../src/contexts/LanguageContext";
import logo from "../../../src/assets/MainLogo.png";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [showSubNav, setShowSubNav] = useState(true);
  const { language, languages, changeLanguage } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY < 40;
      setShowSubNav(shouldShow);
      if (!shouldShow) {
        setLanguageDropdownOpen(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    {
      label: "Courses",
      path: "/courses",
      dropdown: [
        { label: "English Language", path: "/courses/english-language" },
        { label: "Digital Marketing", path: "/courses/digital-marketing" },
        { label: "Corporate Training", path: "/courses/corporate-training" },
      ],
    },
    {
      label: "Learn & Earn",
      path: "/learn-earn",
    },
    {
      label: "Resources",
      path: "/resources",
      dropdown: [
        { label: "AELA Blogs", path: "/blogs" },
        { label: "YouTube", path: "/resources/youtube" },
        { label: "Free Library", path: "/resources/downloads" },
        { label: "Books", path: "/books" },
      ],
    },
    {
      label: "Join Us",
      path: "/join-us",
      dropdown: [
        { label: "As Teacher", path: "/join-us/teacher" },
        { label: "Influencer", path: "/join-us/influencer" },
        { label: "Freelancer", path: "/join-us/freelancer" },
        { label: "Build Your After Life", path: "/join-us/after-life" },
      ],
    },
    {
      label: "About",
      path: "/about",
      dropdown: [
        { label: "Our Story", path: "/about/our-story" },
        { label: "Mission & Vision", path: "/about/mission-vision" },
        { label: "Meet the Founder", path: "/about/founder" },
        { label: "Student Success Stories", path: "/about/success-stories" },
      ],
    },
    {
      label: "Contact",
      path: "/contact",
      dropdown: [
        { label: "Book a Demo Class", path: "/contact/book-demo" },
        {
          label: "Request Business Collaboration",
          path: "/contact/business-collaboration",
        },
        {
          label: "Franchise Partnership Inquiry",
          path: "/contact/franchise-partnership",
        },
      ],
    },
    {
      label: "Login",
      path: "/login",
      dropdown: [
        { label: "Teacher Login", path: "/login/teacher" },
        { label: "Student Login", path: "/login/student" },
        { label: "Recruiter Login", path: "/login/recruiter" },
        { label: "Branch Owner Login", path: "/login/branch-owner" },
      ],
    },
  ];

  const handleMouseEnter = (index) => {
    if (navItems[index].dropdown) {
      setActiveDropdown(index);
    }
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <header className="w-full fixed top-0 z-50">
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative">
        <AnimatePresence>
          {showSubNav && (
            <motion.div
              key="sub-nav"
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative z-60 border-b border-white/10 bg-white/10 px-3 py-2 backdrop-blur-lg supports-backdrop-filter:bg-white/15 sm:px-4">
              <div className="layout-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 text-xs text-slate-100/85 sm:flex-row sm:items-center sm:text-sm">
                  <a
                    href="mailto:hello@digitalaela.com"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold transition hover:border-[#F5D26A]/40 hover:bg-white/10 hover:text-[#FFE28A]">
                    <FaEnvelope className="h-3.5 w-3.5" />
                    hello@digitalaela.com
                  </a>
                  <span className="hidden h-4 w-px bg-white/15 sm:block" />
                  <a
                    href="tel:+971501234567"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold transition hover:border-[#F5D26A]/40 hover:bg-white/10 hover:text-[#FFE28A]">
                    <FaPhone className="h-3.5 w-3.5" />
                    +971 50 123 4567
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center gap-3 text-[#F5D26A]">
                    <a
                      href="https://www.facebook.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition duration-300 hover:border-[#F5D26A]/60 hover:bg-white/15 hover:text-[#FFE28A]">
                      <FaFacebookF className="h-4 w-4" />
                    </a>
                    <a
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition duration-300 hover:border-[#F5D26A]/60 hover:bg-white/15 hover:text-[#FFE28A]">
                      <FaInstagram className="h-4 w-4" />
                    </a>
                    <a
                      href="https://www.linkedin.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition duration-300 hover:border-[#F5D26A]/60 hover:bg-white/15 hover:text-[#FFE28A]">
                      <FaLinkedinIn className="h-4 w-4" />
                    </a>
                    <a
                      href="https://www.youtube.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition duration-300 hover:border-[#F5D26A]/60 hover:bg-white/15 hover:text-[#FFE28A]">
                      <FaYoutube className="h-4 w-4" />
                    </a>
                  </div>

                  <div className="hidden h-6 w-px bg-white/15 sm:block" />

                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.2,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className="relative"
                    onMouseEnter={() => setLanguageDropdownOpen(true)}
                    onMouseLeave={() => setLanguageDropdownOpen(false)}>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      onClick={() =>
                        setLanguageDropdownOpen(!languageDropdownOpen)
                      }
                      className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[#F5D26A] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] transition duration-300 hover:border-[#F5D26A]/40 hover:bg-white/15 hover:text-[#FFE28A]">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                        />
                      </svg>
                      <span className="text-base font-semibold font-accent">
                        {languages[language]}
                      </span>
                      <svg
                        className={`h-3 w-3 transition-transform duration-200 ${
                          languageDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </motion.button>

                    <AnimatePresence>
                      {languageDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute right-0 top-full z-65 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-white/15 bg-black/95 shadow-[0_18px_60px_rgba(6,9,18,0.55)]">
                          {Object.entries(languages).map(
                            ([code, name], index) => (
                              <motion.button
                                key={code}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.2,
                                  delay: index * 0.03,
                                }}
                                onClick={() => {
                                  changeLanguage(code);
                                  setLanguageDropdownOpen(false);
                                }}
                                whileHover={{
                                  backgroundColor: "rgba(212,175,55,0.08)",
                                  x: 5,
                                }}
                                className={`w-full border-b border-white/10 px-4 py-3 text-left text-base font-semibold transition-colors duration-200 last:border-b-0 ${
                                  language === code
                                    ? "bg-white/20 text-[#FFE28A]"
                                    : "text-slate-100 hover:bg-white/10 hover:text-[#FFE28A]"
                                }`}>
                                {name}
                              </motion.button>
                            )
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.nav
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.45,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.05,
          }}
          className="relative overflow-visible border-b border-white/10 bg-white/10 px-3 py-1 backdrop-blur-xl supports-backdrop-filter:bg-white/15 sm:px-4 sm:py-1.5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(226,232,255,0.35),transparent_55%)] opacity-70" />
          <div className="pointer-events-none absolute inset-x-4 top-1/2 h-24 -translate-y-1/2 rounded-[48px] border border-white/15 bg-white/5 blur-3xl" />
          <div className="layout-container relative z-10 flex items-center justify-between gap-4">
            {/* Brand Name - Left Side */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}>
              <Link
                to="/"
                className="text-[#D4AF37] font-bold text-lg md:text-xl font-display tracking-tight relative group block">
                <motion.span
                  whileHover={{ scale: 1.08, rotate: [0, -3, 3, -3, 0] }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="inline-block relative">
                  <img src={logo} alt="logo" className="w-14 h-14" />
                  <motion.div
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4AF37]"
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </motion.span>
              </Link>
            </motion.div>

            {/* Navigation Links - Right Side */}
            <div className="hidden lg:flex items-center gap-6">
              {navItems.map((item, index) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}>
                  {item.dropdown ? (
                    <span className="relative group cursor-pointer">
                      <motion.span
                        whileHover={{ y: -2, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative inline-block text-[#F5D26A] font-semibold text-base tracking-wide transition-colors duration-300 hover:text-[#FFE28A] font-accent">
                        {item.label}
                        <motion.div
                          className="absolute bottom-0 left-0 h-px w-0 bg-linear-to-r from-[#F5D26A] via-[#E7C35D] to-transparent"
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </motion.span>
                    </span>
                  ) : (
                    <Link to={item.path} className="relative group">
                      <motion.span
                        whileHover={{ y: -2, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative inline-block text-[#F5D26A] font-semibold text-base tracking-wide transition-colors duration-300 hover:text-[#FFE28A] font-accent">
                        {item.label}
                        <motion.div
                          className="absolute bottom-0 left-0 h-px w-0 bg-linear-to-r from-[#F5D26A] via-[#E7C35D] to-transparent"
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </motion.span>
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {item.dropdown && (
                    <AnimatePresence>
                      {activeDropdown === index && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-0 mt-2 min-w-[230px] overflow-hidden rounded-2xl border border-white/15 bg-black/95 shadow-[0_18px_60px_rgba(6,9,18,0.55)]">
                          {item.dropdown.map((dropdownItem, dropIndex) => (
                            <Link
                              key={dropdownItem.label}
                              to={dropdownItem.path}
                              className="block">
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.2,
                                  delay: dropIndex * 0.03,
                                }}
                                whileHover={{
                                  backgroundColor: "rgba(212,175,55,0.08)",
                                  x: 5,
                                }}
                                className="border-b border-white/10 px-4 py-3 text-sm font-medium text-[#F5D26A] transition-colors duration-200 last:border-b-0 hover:bg-white/10 hover:text-[#FFE28A]">
                                {dropdownItem.label}
                              </motion.div>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-[#B8831A] hover:text-[#8A6611] transition-colors duration-300">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <motion.path
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <motion.path
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </motion.button>
          </div>
        </motion.nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="lg:hidden mt-4 border-t border-[#D4AF37]/40 pt-4">
              <div className="flex max-h-[calc(100vh-160px)] flex-col gap-2 overflow-y-auto px-2 pr-1 sm:px-4 sm:pr-2">
                {navItems.map((item) => (
                  <div key={item.label}>
                    {item.dropdown ? (
                      <span className="text-[#B8831A] font-semibold text-base tracking-wide hover:text-[#8A6611] transition-colors duration-300 font-accent relative group block py-2 cursor-pointer">
                        <motion.span
                          whileHover={{ x: 5, scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-block">
                          {item.label}
                        </motion.span>
                        <motion.div
                          className="absolute bottom-0 left-0 w-0 h-px bg-[#B8831A]"
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </span>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={() => {
                          setMobileMenuOpen(false);
                        }}
                        className="text-[#B8831A] font-semibold text-base tracking-wide hover:text-[#8A6611] transition-colors duration-300 font-accent relative group block py-2">
                        <motion.span
                          whileHover={{ x: 5, scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-block">
                          {item.label}
                        </motion.span>
                        <motion.div
                          className="absolute bottom-0 left-0 w-0 h-px bg-[#B8831A]"
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </Link>
                    )}
                    {item.dropdown && (
                      <div className="ml-4 mt-2 space-y-1">
                        {item.dropdown.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.label}
                            to={dropdownItem.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-[#F5D26A] text-sm hover:text-[#FFE28A] transition-colors duration-200 py-1">
                            {dropdownItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Language Selection in Mobile Menu */}
                <div className="mt-4 pt-4 border-t border-[#D4AF37]/30">
                  <p className="text-[#B8831A] text-sm font-semibold mb-2 font-accent px-2">
                    Language
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(languages).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          changeLanguage(code);
                          setMobileMenuOpen(false);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 border ${
                          language === code
                            ? "bg-[#D4AF37] text-white border-[#D4AF37]"
                            : "bg-white text-[#B8831A] border-[#D4AF37]/40 hover:border-[#D4AF37]/70"
                        }`}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
};

export default Navbar;
