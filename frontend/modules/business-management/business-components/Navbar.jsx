import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPhone,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { useLanguage } from "../../../src/contexts/LanguageContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import { toast } from "react-toastify";
import logo from "../../../src/assets/MainLogo.png";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [showSubNav, setShowSubNav] = useState(true);
  const [navbarOffset, setNavbarOffset] = useState(0);
  const [logoOffset, setLogoOffset] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { language, languages, changeLanguage } = useLanguage();
  const currentLanguage = languages[language] || languages["en"];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const shouldShow = currentScrollY < 40;
      setShowSubNav(shouldShow);
      
      // Bottom navbar should move only 1px up when scrolling
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - move bottom navbar up by 1px only
        setNavbarOffset(1);
        // Logo should move up 45px when scrolling down
        setLogoOffset(1);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - move bottom navbar back down
        setNavbarOffset(0);
      }
      
      // Logo should only come back down when scrolling to top
      if (currentScrollY <= 100) {
        setLogoOffset(0);
      }
      
      setLastScrollY(currentScrollY);
      
      if (!shouldShow) {
        setLanguageDropdownOpen(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const { user, logout, getRoleLabel, getRoleHome } = useAuth();

  const baseNavItems = [
    {
      label: "Home",
      path: "/",
    },
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
        {
          label: "YouTube",
          external: true,
          href: "https://www.youtube.com/@digitalaela_dubai",
        },
        { label: "Free Library", path: "/free-library" },
        { label: "Books", path: "/books" },
      ],
    },
    {
      label: "Join Us",
      path: "/join-us",
      dropdown: [
        { label: "As Teacher", path: "/join-us/teacher" },
        { label: "Influencer / Freelancer", path: "/join-us/influencer" },
        { label: "Build Your Afterlife", path: "/join-us/afterlife" },
      ],
    },
    {
      label: "About",
      path: "/about",
      dropdown: [
        { label: "Our Story", path: "/about/our-story" },
        { label: "Mission & Vision", path: "/about/mission-vision" },
        { label: "Meet the Founder", path: "/about/founder" },
        { label: "Our Achievement", path: "/about/success-stories" },
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
  ];

  if (user?.role === "teacher") {
    baseNavItems.splice(1, 0, {
      label: "Teaching",
      path: "/teacher/dashboard",
    });
  }

  if (user?.role === "super-admin") {
    baseNavItems.splice(1, 0, {
      label: "Admin",
      path: "/super-admin",
    });
  }

  const handleLogout = useCallback(() => {
    logout();
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    toast.info("You’ve been signed out.", { toastId: "navbar-logout" });
  }, [logout]);

  const authNavItem = useMemo(() => {
    if (!user) {
      return {
        label: "Login",
        path: "/login",
        dropdown: [
          { label: "Teacher Login", path: "/login/teacher" },
          { label: "Student Login", path: "/login/student" },
          { label: "Recruiter Login", path: "/login/recruiter" },
          { label: "Branch Owner Login", path: "/login/branch-owner" },
        ],
      };
    }

    const displayName = user.fullName
      ? user.fullName.split(" ")[0]
      : user.email;
    const roleLabel = getRoleLabel(user.role);
    const defaultLanding = getRoleHome(user.role);

    return {
      label: displayName || "Account",
      dropdown: [
        { label: `${roleLabel} Dashboard`, path: defaultLanding },
        { label: `Signed in as ${roleLabel}`, disabled: true },
        { label: "Logout", onClick: handleLogout },
      ],
    };
  }, [user, getRoleLabel, getRoleHome, handleLogout]);

  const navItems = [...baseNavItems, authNavItem];

  const handleMouseEnter = (index) => {
    if (navItems[index].dropdown) {
      setActiveDropdown(index);
    }
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ 
        y: -navbarOffset,
        opacity: 1
      }}
      transition={{ 
        duration: 0.3, 
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="w-full fixed top-0 z-[60]">
      {/* Logo Layer - Positioned on top of navbar */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: -logoOffset * 45
        }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="absolute left-[132px] top-[43px] z-[70] pointer-events-auto">
        <Link
          to="/"
          className="block">
          <motion.div
            whileHover={{ scale: 1.05, rotate: [0, -3, 3, -3, 0] }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative drop-shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
            <img
              src={logo}
              alt="logo"
              className="h-[80px] w-auto object-contain"
              style={{ maxHeight: '80px', width: '250px', objectFit: 'contain' }}
            />
            <motion.div
              className="absolute bottom-1 left-0 w-0 h-0.5 bg-[#D4AF37]"
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </motion.div>
        </Link>
      </motion.div>

      <motion.div
        className="relative">
        <AnimatePresence>
          {showSubNav && (
            <motion.div
              key="sub-nav"
              initial={{ y: -40, opacity: 0 }}
              animate={{ 
                y: showSubNav ? -navbarOffset : -40 - navbarOffset,
                opacity: showSubNav ? 1 : 0
              }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="hidden md:block relative z-60 border-b border-[#D4AF37]/20 bg-[#0a0a0a]/80 px-1.5 py-0.5 backdrop-blur-2xl supports-backdrop-filter:bg-[#0a0a0a]/70 sm:px-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="layout-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 text-xs text-[#F5D26A]/90 sm:flex-row sm:items-center sm:text-sm">
                  <a
                    href="mailto:info@digitalaela.com"
                    className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 font-semibold text-[#F5D26A] transition hover:border-[#F5D26A]/60 hover:bg-[#D4AF37]/20 hover:text-[#FFE28A]">
                    <FaEnvelope className="h-3.5 w-3.5" />
                    info@digitalaela.com
                  </a>
                  <span className="hidden h-4 w-px bg-white/15 sm:block" />
                  <a
                    href="tel:+971508185690"
                    className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 font-semibold text-[#F5D26A] transition hover:border-[#F5D26A]/60 hover:bg-[#D4AF37]/20 hover:text-[#FFE28A]">
                    <FaPhone className="h-3.5 w-3.5" />
                    0508185690
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center gap-2 text-[#F5D26A]">
                    <a
                      href="https://www.facebook.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-all duration-300 hover:border-blue-500/70 hover:bg-blue-500/20 hover:text-blue-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                      <FaFacebookF className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href="https://wa.me/971508185690"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-all duration-300 hover:border-green-500/70 hover:bg-green-500/20 hover:text-green-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                      <FaWhatsapp className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-all duration-300 hover:border-pink-500/70 hover:bg-pink-500/20 hover:text-pink-300 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)]">
                      <FaInstagram className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href="https://www.linkedin.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-all duration-300 hover:border-blue-500/70 hover:bg-blue-500/20 hover:text-blue-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                      <FaLinkedinIn className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href="https://www.youtube.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-all duration-300 hover:border-red-500/70 hover:bg-red-500/20 hover:text-red-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                      <FaYoutube className="h-3.5 w-3.5" />
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
                      className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2 py-1.5 text-[#F5D26A] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] transition duration-300 hover:border-[#F5D26A]/40 hover:bg-white/15 hover:text-[#FFE28A]">
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
                      <span className="flex items-center gap-2 text-base font-semibold font-accent">
                        <span className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
                          {currentLanguage?.flagSrc ? (
                            <img
                              src={currentLanguage.flagSrc}
                              alt={currentLanguage.flagAlt}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-lg leading-none">
                              {currentLanguage?.flag}
                            </span>
                          )}
                        </span>
                        <span>{currentLanguage?.label}</span>
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
                          className="absolute right-0 top-full z-65 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-[0_18px_60px_rgba(212,175,55,0.2)]">
                          {Object.entries(languages).map(
                            ([code, option], index) => (
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
                                className={`w-full border-b border-[#D4AF37]/20 px-4 py-2.5 text-left text-base font-semibold transition-colors duration-200 last:border-b-0 ${
                                  language === code
                                    ? "bg-[#D4AF37]/20 text-[#FFE28A]"
                                    : "text-[#F5D26A] hover:bg-[#D4AF37]/10 hover:text-[#FFE28A]"
                                }`}>
                                <span className="flex items-center gap-2.5">
                                  <span className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5">
                                    {option.flagSrc ? (
                                      <img
                                        src={option.flagSrc}
                                        alt={option.flagAlt}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <span className="text-lg leading-none">
                                        {option.flag}
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-sm font-semibold tracking-wide">
                                    {option.label}
                                  </span>
                                </span>
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
          animate={{ 
            y: -navbarOffset,
            opacity: 1
          }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1]
          }}
          className="relative overflow-visible border-b border-[#D4AF37]/20 bg-[#0a0a0a]/80 px-0 py-3 backdrop-blur-2xl supports-backdrop-filter:bg-[#0a0a0a]/70 sm:px-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.15),transparent_55%)] opacity-80" />
          <div className="pointer-events-none absolute inset-x-3 top-1/2 h-4 -translate-y-1/2 rounded-[36px] border border-[#D4AF37]/20 bg-[#D4AF37]/5 blur-2xl" />
          <div className="layout-container relative z-10 flex items-center justify-between gap-2 py-2">
            {/* Navigation Links - Right Side */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-5">
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
                  ) : item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group">
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
                    </a>
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
                          className="absolute top-full left-0 mt-2 min-w-[230px] overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-[0_18px_60px_rgba(212,175,55,0.2)]">
                          {item.dropdown.map((dropdownItem, dropIndex) => {
                            if (dropdownItem.disabled) {
                              return (
                                <div
                                  key={dropdownItem.label}
                                  className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#FFE28A]/70 last:border-b-0">
                                  {dropdownItem.label}
                                </div>
                              );
                            }

                            if (dropdownItem.onClick) {
                              return (
                                <button
                                  key={dropdownItem.label}
                                  type="button"
                                  onClick={() => {
                                    dropdownItem.onClick();
                                  }}
                                  className="block w-full text-left">
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
                                </button>
                              );
                            }

                            if (dropdownItem.external) {
                              return (
                                <a
                                  key={dropdownItem.label}
                                  href={dropdownItem.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
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
                                </a>
                              );
                            }

                            return (
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
                            );
                          })}
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
              className="lg:hidden mt-4 overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-[0_25px_80px_rgba(212,175,55,0.2)]">
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
                    ) : item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
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
                      </a>
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
                        {item.dropdown.map((dropdownItem) => {
                          if (dropdownItem.disabled) {
                            return (
                              <span
                                key={dropdownItem.label}
                                className="block text-[#FFE28A]/70 text-[11px] uppercase tracking-[0.28em] py-1">
                                {dropdownItem.label}
                              </span>
                            );
                          }

                          if (dropdownItem.onClick) {
                            return (
                              <button
                                key={dropdownItem.label}
                                type="button"
                                onClick={() => {
                                  dropdownItem.onClick();
                                  setMobileMenuOpen(false);
                                }}
                                className="block text-left text-[#F5D26A] text-sm hover:text-[#FFE28A] transition-colors duration-200 py-1 w-full">
                                {dropdownItem.label}
                              </button>
                            );
                          }

                          if (dropdownItem.external) {
                            return (
                              <a
                                key={dropdownItem.label}
                                href={dropdownItem.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-[#F5D26A] text-sm hover:text-[#FFE28A] transition-colors duration-200 py-1">
                                {dropdownItem.label}
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={dropdownItem.label}
                              to={dropdownItem.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-[#F5D26A] text-sm hover:text-[#FFE28A] transition-colors duration-200 py-1">
                              {dropdownItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Language Selection in Mobile Menu */}
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-[#B8831A] text-sm font-semibold mb-2 font-accent px-2">
                    Language
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(languages).map(([code, option]) => (
                      <button
                        key={code}
                        onClick={() => {
                          changeLanguage(code);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${
                          language === code
                            ? "bg-[#D4AF37] text-[#0a0a0a] border-[#D4AF37]"
                            : "bg-[#D4AF37]/10 text-[#F5D26A] border-[#D4AF37]/40 hover:border-[#D4AF37]/70"
                        }`}>
                        <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-[#D4AF37]/40 bg-white/10">
                          {option.flagSrc ? (
                            <img
                              src={option.flagSrc}
                              alt={option.flagAlt}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-lg leading-none">
                              {option.flag}
                            </span>
                          )}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.header>
  );
};

export default Navbar;
