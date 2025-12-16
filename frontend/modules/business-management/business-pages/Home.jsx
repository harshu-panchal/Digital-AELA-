import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../../../src/components/SEO";
import {
  FaStar,
  FaBook,
  FaDownload,
  FaArrowLeft,
  FaArrowRight,
  FaCalendarCheck,
  FaCheckCircle,
  FaPlayCircle,
  FaCertificate,
  FaGlobe,
} from "react-icons/fa";
import founderImage from "../../../src/assets/Founder.png";
import slideOurMission from "../../../src/assets/images/slide-images/our mission.jpg";
import slideFreeLibrary from "../../../src/assets/images/slide-images/free library.jpg";
import slideDonateEducation from "../../../src/assets/images/slide-images/donate education.png";
import slideCollaboration from "../../../src/assets/images/slide-images/collaboration.jpg";
import slideLearnAndEarn from "../../../src/assets/images/slide-images/learn and earn.png";
import { useBlogs } from "../../../src/contexts/BlogContext";
import GiftButton from "../common/GiftButton";
import { buildCoursePaymentLink } from "../utils/paymentLinks";
import { useAuth } from "../../../src/contexts/AuthContext";
import { redirectToRazorpay } from "../utils/directRazorpayPayment";
import { fetchPublishedCourses } from "../../../src/services/api/courses";
import { fetchEbooks } from "../../../src/services/api/resources";
import { getGalleryImages } from "../../../src/services/api/gallery";
import { getTestimonialsBySection } from "../../../src/services/api/testimonials";
import { useDynamicTranslation } from "../../../src/hooks/useDynamicTranslation";
import { useLanguage } from "../../../src/contexts/LanguageContext";
import { normalizeLanguageCode } from "../../../src/utils/languageUtils";
import TranslatedText from "../../../src/components/TranslatedText";
import { getMediaUrl } from "../../../src/utils/mediaUrl";

const MotionLink = motion.create(Link);

const Home = () => {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState(0);
  const [isCourseRibbonPaused, setIsCourseRibbonPaused] = useState(false);
  const courseRibbonRef = useRef(null);
  const { trendingBlogs, refreshBlogs } = useBlogs();
  const topBlogs = trendingBlogs.slice(0, 3);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [premiumCourses, setPremiumCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  // Translation hooks
  const { language } = useLanguage();
  const { translateObject } = useDynamicTranslation();
  const [translatedCourses, setTranslatedCourses] = useState([]);
  const [translatedBooks, setTranslatedBooks] = useState([]);

  // Get neon light color based on active slide
  const getNeonTextShadow = (slideId) => {
    switch (slideId) {
      case "ambition-action":
        // Golden/Yellow
        return `
          0 0 5px rgba(255, 255, 255, 0.4),
          0 0 10px rgba(255, 255, 255, 0.3),
          0 0 15px rgba(245, 210, 106, 0.25),
          0 0 25px rgba(245, 210, 106, 0.2)
        `;
      case "gift-future":
        // Green
        return `
          0 0 5px rgba(255, 255, 255, 0.4),
          0 0 10px rgba(255, 255, 255, 0.3),
          0 0 15px rgba(110, 231, 183, 0.25),
          0 0 25px rgba(110, 231, 183, 0.2)
        `;
      case "read-grow":
        // Pink/Rose
        return `
          0 0 5px rgba(255, 255, 255, 0.4),
          0 0 10px rgba(255, 255, 255, 0.3),
          0 0 15px rgba(244, 114, 182, 0.25),
          0 0 25px rgba(244, 114, 182, 0.2)
        `;
      case "learn-earn":
        // Blue
        return `
          0 0 5px rgba(255, 255, 255, 0.4),
          0 0 10px rgba(255, 255, 255, 0.3),
          0 0 15px rgba(122, 184, 255, 0.25),
          0 0 25px rgba(122, 184, 255, 0.2)
        `;
      case "learn-earn-opportunity":
        // White
        return `
          0 0 5px rgba(255, 255, 255, 0.4),
          0 0 10px rgba(255, 255, 255, 0.3),
          0 0 15px rgba(255, 255, 255, 0.25),
          0 0 25px rgba(255, 255, 255, 0.2)
        `;
      default:
        // Default golden
        return `
          0 0 5px rgba(255, 255, 255, 0.4),
          0 0 10px rgba(255, 255, 255, 0.3),
          0 0 15px rgba(212, 175, 55, 0.25),
          0 0 25px rgba(212, 175, 55, 0.2)
        `;
    }
  };

  // Rate limiting refs
  const isLoadingCoursesRef = useRef(false);
  const isLoadingBooksRef = useRef(false);
  const isLoadingGalleryRef = useRef(false);
  const lastLoadTimeRef = useRef({ courses: 0, books: 0, gallery: 0 });
  const MIN_LOAD_INTERVAL = 10000; // 10 seconds minimum between loads

  // Fetch premium courses from backend
  useEffect(() => {
    const loadPremiumCourses = async () => {
      // Prevent duplicate concurrent requests
      if (isLoadingCoursesRef.current) {
        return;
      }

      // Prevent requests too close together
      const now = Date.now();
      if (now - lastLoadTimeRef.current.courses < MIN_LOAD_INTERVAL) {
        return;
      }

      try {
        isLoadingCoursesRef.current = true;
        setLoadingCourses(true);
        const response = await fetchPublishedCourses({ premium: true });

        if (!response || !response.courses) {
          console.warn("No premium courses data received from API");
          setPremiumCourses([]);
          return;
        }

        // Transform backend courses to match expected format
        const transformedCourses = (response.courses || [])
          .map((course) => ({
            ...course,
            id: course._id,
            slug: course._id,
            title: course.title || "Untitled Course",
            description:
              course.description ||
              course.metadata?.subtitle ||
              course.subtitle ||
              "",
            image:
              course.thumbnailUrl ||
              course.thumbnail ||
              course.image ||
              course.coverImage ||
              "",
            rawPrice: course.price, // Store original numeric price for payment logic
            price:
              course.price === 0
                ? "Free"
                : course.price
                  ? `AED ${course.price}`
                  : "On Request",
            duration: course.duration
              ? `${course.duration} hours`
              : course.metadata?.duration || "",
            format:
              course.metadata?.deliveryMode ||
              course.deliveryMode ||
              course.format ||
              "",
            features: course.metadata?.tags || course.tags || [],
            category: course.category || course.metadata?.category || "General",
          }))
          .slice(0, 6); // Limit to 6 courses for home page

        setPremiumCourses(transformedCourses);
        lastLoadTimeRef.current.courses = Date.now();
      } catch (error) {
        // Suppress 429 rate limit errors
        if (error?.status !== 429) {
          console.error("Failed to load premium courses:", error);
        }
        setPremiumCourses([]);
      } finally {
        isLoadingCoursesRef.current = false;
        setLoadingCourses(false);
      }
    };

    loadPremiumCourses();
  }, []);

  // Fetch featured books from backend
  useEffect(() => {
    const loadFeaturedBooks = async () => {
      // Prevent duplicate concurrent requests
      if (isLoadingBooksRef.current) {
        return;
      }

      // Prevent requests too close together
      const now = Date.now();
      if (now - lastLoadTimeRef.current.books < MIN_LOAD_INTERVAL) {
        return;
      }

      try {
        isLoadingBooksRef.current = true;
        setLoadingBooks(true);
        const response = await fetchEbooks({ featured: true, pageSize: 4 });

        if (!response || !response.data) {
          console.warn("No featured books data received from API");
          setFeaturedBooks([]);
          return;
        }

        // Transform backend books to match expected format
        const transformedBooks = (response.data || [])
          .slice(0, 4) // Limit to 4 books
          .map((book) => {
            const price =
              book.metadata?.price !== undefined &&
                book.metadata.price !== null &&
                book.metadata.price !== ""
                ? Number(book.metadata.price)
                : 0;
            const originalPrice = price > 0 ? Math.round(price * 1.4) : 0;

            return {
              id: book._id,
              title: book.title || "Untitled Book",
              author: book.metadata?.author || "Digital AELA",
              price: price,
              rawPrice: price, // Store original numeric price
              originalPrice: originalPrice,
              rating: 4.5, // Default rating
              reviews: 0,
              category:
                book.categories?.[0] || book.metadata?.category || "General",
              badge: "E-Book", // Can be determined from metadata if needed
              image: book.metadata?.coverImage || book.coverImage || "",
              imageAlt: `${book.title || "Book"} cover`,
              description: book.description || "",
            };
          });

        setFeaturedBooks(transformedBooks);
        lastLoadTimeRef.current.books = Date.now();
      } catch (error) {
        // Suppress 429 rate limit errors
        if (error?.status !== 429) {
          console.error("Failed to load featured books:", error);
        }
        setFeaturedBooks([]);
      } finally {
        isLoadingBooksRef.current = false;
        setLoadingBooks(false);
      }
    };

    loadFeaturedBooks();
  }, []);

  // Fetch gallery images from backend
  useEffect(() => {
    const loadGalleryImages = async () => {
      // Prevent duplicate concurrent requests
      if (isLoadingGalleryRef.current) {
        return;
      }

      // Prevent requests too close together
      const now = Date.now();
      if (now - lastLoadTimeRef.current.gallery < MIN_LOAD_INTERVAL) {
        return;
      }

      try {
        isLoadingGalleryRef.current = true;
        setLoadingGallery(true);
        const response = await getGalleryImages();

        if (!response || !response.data) {
          console.warn("No gallery images data received from API");
          setGalleryItems([]);
          return;
        }

        // Transform backend images to match expected format
        const transformedImages = (response.data || []).map((img) => ({
          id: img.id,
          image: img.image,
        }));

        setGalleryItems(transformedImages);
        lastLoadTimeRef.current.gallery = Date.now();
      } catch (error) {
        // Suppress 429 rate limit errors
        if (error?.status !== 429) {
          console.error("Failed to load gallery images:", error);
        }
        setGalleryItems([]);
      } finally {
        isLoadingGalleryRef.current = false;
        setLoadingGallery(false);
      }
    };

    loadGalleryImages();
  }, []);

  // Translate courses when language changes
  useEffect(() => {
    const translateCourses = async () => {
      if (premiumCourses.length === 0) {
        setTranslatedCourses([]);
        return;
      }

      if (normalizeLanguageCode(language) === "en") {
        setTranslatedCourses(premiumCourses);
        return;
      }

      try {
        // Translate each course individually
        const translatedCoursesList = await Promise.all(
          premiumCourses.map(async (course) => {
            try {
              const translated = await translateObject(
                { title: course.title, description: course.description },
                ["title", "description"]
              );
              return {
                ...course,
                title: translated.title || course.title,
                description: translated.description || course.description,
              };
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error("[Home] Error translating course:", error);
              return course;
            }
          })
        );

        setTranslatedCourses(translatedCoursesList);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Home] Error translating courses:", error);
        setTranslatedCourses(premiumCourses);
      }
    };

    translateCourses();
  }, [premiumCourses, language, translateObject]);

  // Translate books when language changes
  useEffect(() => {
    const translateBooks = async () => {
      if (featuredBooks.length === 0) {
        setTranslatedBooks([]);
        return;
      }

      if (normalizeLanguageCode(language) === "en") {
        setTranslatedBooks(featuredBooks);
        return;
      }

      try {
        // Translate each book individually
        const translatedBooksList = await Promise.all(
          featuredBooks.map(async (book) => {
            try {
              const translated = await translateObject(
                { title: book.title, description: book.description, author: book.author },
                ["title", "description", "author"]
              );
              return {
                ...book,
                title: translated.title || book.title,
                description: translated.description || book.description,
                author: translated.author || book.author,
              };
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error("[Home] Error translating book:", error);
              return book;
            }
          })
        );

        setTranslatedBooks(translatedBooksList);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Home] Error translating books:", error);
        setTranslatedBooks(featuredBooks);
      }
    };

    translateBooks();
  }, [featuredBooks, language, translateObject]);

  // Define home courses - use translated courses
  const homeCourses = useMemo(() => {
    return translatedCourses.length > 0 ? translatedCourses : premiumCourses;
  }, [translatedCourses, premiumCourses]);

  // Duplicate courses for seamless infinite scroll
  const duplicatedCourses = useMemo(() => {
    // Duplicate the courses array multiple times for seamless scrolling
    return [...homeCourses, ...homeCourses, ...homeCourses];
  }, [homeCourses]);

  // Refresh blogs when home page mounts to ensure we have latest data
  useEffect(() => {
    refreshBlogs();
  }, [refreshBlogs]);

  // Auto-scroll courses section
  useEffect(() => {
    if (!courseRibbonRef.current || isCourseRibbonPaused) return;

    const scrollContainer = courseRibbonRef.current;
    const scrollSpeed = 1; // pixels per frame
    let animationFrameId;

    const autoScroll = () => {
      if (scrollContainer && !isCourseRibbonPaused) {
        scrollContainer.scrollLeft += scrollSpeed;
        // Reset to beginning when reaching the end (one-third of total width for seamless loop)
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 3) {
          scrollContainer.scrollLeft = 0;
        }
        animationFrameId = requestAnimationFrame(autoScroll);
      }
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCourseRibbonPaused]);

  // Helper function to check if course is free
  const isFreeCourse = (course) => {
    if (!course) return false;
    const price = course.rawPrice !== undefined ? course.rawPrice : course.price; // Check rawPrice first

    // Check various formats
    if (price === 0 || price === "Free" || price === "free") return true;
    if (typeof price === 'string') {
      if (price.toLowerCase().includes('free')) return true;
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      if (isNaN(numericPrice) || numericPrice === 0) return true;
    }
    if (typeof price === 'number' && price === 0) return true;

    return false;
  };

  const redirectToCoursePayment = async (course, extra = {}) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/login/student", {
        state: { from: location.pathname },
      });
      return;
    }

    const payload = {
      ...course,
      ...extra,
    };

    // Extract price - prioritize rawPrice
    let priceValue = 0;

    if (course.rawPrice !== undefined && course.rawPrice !== null) {
      priceValue = parseFloat(course.rawPrice) || 0;
    } else if (typeof course.price === 'number') {
      priceValue = course.price;
    } else if (typeof course.price === 'string') {
      if (course.price.toLowerCase().includes('free')) {
        priceValue = 0;
      } else {
        // Strip non-numeric characters (except dot) to handle strings like "AED 100"
        priceValue = parseFloat(course.price.replace(/[^0-9.]/g, '')) || 0;
      }
    }

    // Redirect directly to Razorpay
    await redirectToRazorpay({
      courseId: course._id || course.id || null,
      amount: priceValue,
      currency: "AED",
      description: `Payment for ${course.title || "course"}`,
      userName: user?.fullName || "",
      userEmail: user?.email || "",
      userPhone: user?.phone || "",
      quantity: 1,
    });
  };

  // Manual scroll functions for courses section
  const scrollCoursesLeft = () => {
    if (courseRibbonRef.current) {
      setIsCourseRibbonPaused(true);
      const scrollAmount = 400; // Adjust scroll amount as needed
      courseRibbonRef.current.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
      // Resume auto-scroll after a delay
      setTimeout(() => {
        setIsCourseRibbonPaused(false);
      }, 3000);
    }
  };

  const scrollCoursesRight = () => {
    if (courseRibbonRef.current) {
      setIsCourseRibbonPaused(true);
      const scrollAmount = 400; // Adjust scroll amount as needed
      courseRibbonRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
      // Resume auto-scroll after a delay
      setTimeout(() => {
        setIsCourseRibbonPaused(false);
      }, 3000);
    }
  };

  const ribbonStats = useMemo(
    () => [
      { value: 5000, suffix: "+", label: "Students Enrolled" },
      { value: 4000, suffix: "+", label: "Successful Placements" },
      { value: 4.9, decimals: 1, label: "Average Learner Rating" },
      { value: 15, suffix: "+", label: "Corporate Collaborations" },
      { value: 200, suffix: "+", label: "Workshops & Webinars Conducted" },
      { value: 6, suffix: "+", label: "Countries Reached" },
      { value: 100, suffix: "+", label: "Job Sectors Targeted" },
    ],
    [language]
  );

  const [ribbonCounts, setRibbonCounts] = useState(() =>
    ribbonStats.map(() => 0)
  );
  const [ribbonInView, setRibbonInView] = useState(false);
  const ribbonRef = useRef(null);

  // Benefits for Why Choose Digital AELA section
  const benefits = useMemo(
    () => [
      {
        id: 1,
        title: "24/7 Support for Every Learner",
        seoKeyword: "24/7 online learning support South Asia Gulf",
        description:
          "Education ka safar raat-din nahi dekhta, aur hum bhi nahi. With round-the-clock student support, you are never alone in your journey. Whether you are in India, Pakistan, Bangladesh, Nepal, or the Gulf countries, help is always one click away.",
        icon: "clock",
      },
      {
        id: 2,
        title: "Live + Recorded Classes for Flexibility",
        seoKeyword: "live and recorded online classes India Pakistan Gulf",
        description:
          "We understand every learner has a different routine. That's why Digital AELA offers live interactive sessions plus recorded lessons. You can learn in real-time with mentors or revise at your own pace — anytime, anywhere.",
        icon: "video",
      },
      {
        id: 3,
        title: "100% Placement Assistance",
        seoKeyword: "job placement training India Pakistan Bangladesh Nepal Gulf",
        description:
          "Our commitment doesn't end with teaching. Digital AELA provides resume building, interview preparation, job portal access, and recruiter connections to ensure that you don't just learn, but you also earn.",
        icon: "briefcase",
      },
      {
        id: 4,
        title: "Expert Trainers & Mentors",
        seoKeyword: "expert online trainers South Asia Gulf",
        description:
          "Our trainers are not just teachers, they are industry professionals who know what works in the real world. They bring practical knowledge, global experience, and personal mentorship that transforms learners into professionals.",
        icon: "teacher",
      },
      {
        id: 5,
        title: "Equal Opportunity for All",
        seoKeyword: "equal opportunity education learning to earning platform",
        description:
          "At Digital AELA, we believe education should be free of age, degree, and gender discrimination. Whether you are a student, homemaker, working professional, or retired individual — we provide equal opportunities to learn, grow, and earn.",
        icon: "handshake",
      },
      {
        id: 6,
        title: "Affordable & Accessible Globally",
        seoKeyword:
          "affordable online courses India Pakistan Bangladesh Nepal Gulf",
        description:
          "High-quality education should not be limited to the rich. Digital AELA ensures affordable learning solutions so that anyone from South Asia to the Gulf can access top-class training and career opportunities.",
        icon: "globe",
      },
    ],
    [language]
  );

  // Icon component renderer
  const renderIcon = (iconName) => {
    const iconClass = "w-12 h-12 text-[#D4AF37]";
    switch (iconName) {
      case "clock":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "video":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      case "briefcase":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "teacher":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        );
      case "handshake":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        );
      case "globe":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const heroSlides = useMemo(
    () => [
      {
        id: "ambition-action",
        badge: "Our Mission",
        title: (
          <>
            <TranslatedText>Affordable & Global Education</TranslatedText>
            <br />
            <TranslatedText>(Har Ghar Shiksha)</TranslatedText>
          </>
        ),
        highlight: "India . Pakistan . Bangladesh . Nepal . UAE . Saudi Arabia",
        description:
          "Digital AELA is committed to providing quality education to learners across South Asia and the Middle East. Our mission is to make learning affordable, accessible, and life-changing for every student-regardless of their background or country.",
        primaryCta: null, // Removed "Start Your Journey"
        primaryLink: "/join-us/afterlife",
        secondaryCta: "Start Learning",
        secondaryLink: "/courses/english-language",
        image: slideOurMission,
      },
      {
        id: "learn-earn",
        badge: "Free Online Library – Open for Everyone",
        title: "A Free Digital Library for All Learners",
        highlight: "Unlimited Books Free Access Anytime, Anywhere",
        description:
          "Digital AELA offers an open online library where anyone can read thousands of books for free. We believe knowledge should be available to everyone-without barriers, limits, or cost.",
        primaryCta: null,
        primaryLink: "/free-library",
        secondaryCta: "Explore the Free Library",
        secondaryLink: "/free-library",
        image: slideFreeLibrary,
      },
      {
        id: "gift-future",
        badge: "Build Your Legacy – Donate Education & gift a Future",
        title: "Create a Lasting Impact Through Education",
        highlight: "Donate a Course Gift a Book Support a Student",
        description:
          "The most meaningful donation is the one that transforms lives for generations. By gifting a book or sponsoring a course through Digital AELA, you help someone learn today and empower many more in the future. Your contribution becomes a legacy that continues to benefit long after you.",
        primaryCta: null,
        primaryLink: "/gift/payment?type=anyone",
        secondaryCta: "Donate Education",
        secondaryLink: "/join-us/afterlife",
        image: slideDonateEducation,
      },
      {
        id: "read-grow",
        badge: "Collaboration & Franchise Opportunities",
        title: "Partner With Digital AELA",
        highlight: "Collaboration Franchise Global Partnerships",
        description:
          "We welcome individuals and institutions who want to expand education and create global impact. Whether you want to collaborate, become a franchise partner, or build a joint project-Digital AELA is ready to work with you.",
        primaryCta: null,
        primaryLink: "/contact",
        secondaryCta: "Apply for Partnership",
        secondaryLink: "/contact/business-collaboration",
        image: slideCollaboration,
      },
      {
        id: "learn-earn-opportunity",
        badge: "Learn & Earn Opportunity – For Everyone",
        title: "Learn New Skills and Earn from Anywhere",
        highlight: "No Age Limit No Religion or Caste Bar 100% Free Opportunity",
        description:
          "Digital AELA Dubai provides a unique platform where anyone can learn valuable skills and earn money at the same time. This opportunity is open to everyone-students, professionals, homemakers, beginners, and anyone who wants to grow. No restrictions. No boundaries. Just one mission: Learn and Earn together-completely free.",
        primaryCta: "Start Learning",
        primaryLink: "/courses/english-language",
        secondaryCta: "Start Earning",
        secondaryLink: "/learn-earn",
        image: slideLearnAndEarn,
      },
    ],
    [language]
  );

  const getPrimaryCtaClasses = (label) => {
    switch (label) {
      case "Start Learning":
        return "inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:brightness-105";
      default:
        return "inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:brightness-105";
    }
  };

  const getSecondaryCtaClasses = (label) => {
    switch (label) {
      case "Start Learning":
        return "inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:brightness-105";
      case "Explore the Free Library":
        return "inline-flex items-center justify-center rounded-full border border-blue-400/70 bg-blue-500/20 px-6 py-3 text-sm font-semibold text-blue-100 shadow-[0_10px_30px_rgba(59,130,246,0.35)] transition hover:bg-blue-500/30 hover:border-blue-300";
      case "Apply for Partnership":
        return "inline-flex items-center justify-center rounded-full border border-red-400/70 bg-red-500/20 px-6 py-3 text-sm font-semibold text-red-100 shadow-[0_10px_30px_rgba(248,113,113,0.35)] transition hover:bg-red-500/30 hover:border-red-300";
      case "Donate Education":
        return "inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500/20 px-6 py-3 text-sm font-semibold text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.35)] transition hover:bg-emerald-500/30 hover:border-emerald-300";
      case "Start Earning":
        return "inline-flex items-center justify-center rounded-full border border-white/70 bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,255,255,0.45)] transition hover:bg-slate-100 hover:border-white";
      default:
        return "inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10";
    }
  };

  useEffect(() => {
    if (heroSlides.length <= 1 || isHeroPaused) return undefined;
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroSlides.length, isHeroPaused]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  useEffect(() => {
    if (!ribbonRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRibbonInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(ribbonRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ribbonInView) return;

    const duration = 2000;
    const startTime = performance.now();
    let animationFrameId = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setRibbonCounts(
        ribbonStats.map((stat) => {
          const target = stat.value;
          if (stat.decimals) {
            const current = target * progress;
            return Number(current.toFixed(stat.decimals));
          }
          return Math.round(target * progress);
        })
      );

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setRibbonCounts(
          ribbonStats.map((stat) =>
            stat.decimals
              ? Number(stat.value.toFixed(stat.decimals))
              : stat.value
          )
        );
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [ribbonInView, ribbonStats]);

  // WhatsApp integration
  const whatsappNumber = "+971502270625";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in learning more about your English courses."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const handleViewCourseDetail = (course, origin = "home-featured") => {
    const payload = {
      ...course,
      origin,
    };
    // If course has _id (backend course), use ID route, otherwise use slug (catalog course)
    if (course._id) {
      navigate(`/courses/id/${course._id}`, {
        state: {
          course: payload,
        },
      });
    } else if (course.slug) {
      navigate(`/courses/${course.slug}`, {
        state: {
          course: payload,
        },
      });
    } else {
      console.error("Course missing both _id and slug:", course);
    }
  };

  // Fetch testimonials from API
  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        setLoadingTestimonials(true);
        const response = await getTestimonialsBySection("home");
        if (response && response.testimonials) {
          // Map API response to match existing structure
          const mappedTestimonials = response.testimonials.map((testimonial, index) => ({
            id: testimonial._id || index + 1,
            name: testimonial.name,
            role: testimonial.role,
            avatar: testimonial.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
            text: testimonial.text,
            rating: testimonial.rating || 5,
          }));
          setTestimonials(mappedTestimonials);
        }
      } catch (error) {
        console.error("Failed to load testimonials:", error);
        // Fallback to empty array on error
        setTestimonials([]);
      } finally {
        setLoadingTestimonials(false);
      }
    };
    loadTestimonials();
  }, []);

  const visibleTestimonials = useMemo(() => {
    const count = 3;
    if (!Array.isArray(testimonials) || testimonials.length === 0) return [];
    if (testimonials.length <= count) return testimonials;

    return Array.from({ length: count }, (_, index) => {
      const testimonialIndex =
        (currentTestimonial + index) % testimonials.length;
      return testimonials[testimonialIndex];
    });
  }, [testimonials, currentTestimonial]);

  const storyVideos = [
    {
      id: "story-1",
      title: "How Digital AELA Transforms Careers",
      youtubeId: "I9_RD7b2oz4",
      thumbnail: "https://img.youtube.com/vi/I9_RD7b2oz4/hqdefault.jpg",
    },
    {
      id: "story-2",
      title: "Learner Spotlight: Speak with Confidence",
      youtubeId: "ItgBWtaLSVQ",
      thumbnail: "https://img.youtube.com/vi/ItgBWtaLSVQ/hqdefault.jpg",
    },
    {
      id: "story-3",
      title: "Inside Our English Labs",
      youtubeId: "GaKTXGdmahI",
      thumbnail: "https://img.youtube.com/vi/GaKTXGdmahI/hqdefault.jpg",
    },
    {
      id: "story-4",
      title: "Mentors Inspiring The Afterlife Movement",
      youtubeId: "DMLVWteuQJI",
      thumbnail: "https://img.youtube.com/vi/DMLVWteuQJI/hqdefault.jpg",
    },
  ];

  // Auto-slide testimonials every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const faqItems = useMemo(
    () => [
      {
        question: "What courses does Digital AELA offer?",
        answer: (
          <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
            <TranslatedText>We offer comprehensive English language courses including Beginner, Intermediate, Advanced, Spoken English, IELTS & TOEFL preparation, Corporate Training, and Teacher Training programs. All courses are designed to be practical, career-focused, and accessible to learners across South Asia and the Gulf.</TranslatedText>
          </p>
        ),
      },
      {
        question: "How does the Learn & Earn program work?",
        answer: (
          <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
            <TranslatedText>Our Learn & Earn platform allows you to earn points (AELA Coins) by completing quizzes, participating in activities, and engaging with the community. These coins can be redeemed for rewards, courses, or cash. It's our way of making learning rewarding while you build valuable skills.</TranslatedText>
          </p>
        ),
      },
      {
        question: "What certification will I receive after completing a course?",
        answer: (
          <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
            <TranslatedText>Upon successful completion, you receive an internationally recognized ISO Certified certificate that boosts your credibility for job applications, interviews, and career advancement.</TranslatedText>
          </p>
        ),
      },
      {
        question: "What is the Job Portal and how does it work?",
        answer: (
          <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
            <TranslatedText>Our Job Portal links learners with top recruiters. Upload your resume, browse curated openings, apply instantly, and receive dedicated placement support.</TranslatedText>
          </p>
        ),
      },
      {
        question: "Do you offer demo classes before enrollment?",
        answer: (
          <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
            <TranslatedText>Absolutely. Join our free demo sessions to experience the teaching style, curriculum, and trainer interaction before you commit.</TranslatedText>
          </p>
        ),
      },
      {
        question: "What makes Digital AELA different from other institutes?",
        answer: (
          <div className="text-gray-300 leading-relaxed space-y-3">
            <p>
              <TranslatedText>We combine practical learning with career outcomes. Alongside expert-led training, you benefit from: Job assistance through our talent portal, Interview preparation & mock tests, Personalised study plans, Courses delivered in Hindi & English</TranslatedText>
            </p>
          </div>
        ),
      },
      {
        question: "How can I buy your English learning books?",
        answer: (
          <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
            <TranslatedText>Explore the Books section on our website to order titles covering grammar, vocabulary, and English structures. They are also available on Amazon, Flipkart, or directly from the institute.</TranslatedText>
          </p>
        ),
      },
      {
        question: "Do you provide career counselling services?",
        answer: (
          <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
            <TranslatedText>Yes, our experts conduct one-on-one counselling sessions to help you select the right course, elevate your interview skills, and map a clear career roadmap.</TranslatedText>
          </p>
        ),
      },
    ],
    [language]
  );


  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Digital AELA - Learn English & Skills Online | India Pakistan Bangladesh Nepal"
        description="Learn English, Digital Marketing, Corporate Training, and Career Skills with Digital AELA. Online courses for India, Pakistan, Bangladesh, Nepal, and Gulf countries. 24/7 support, live & recorded classes, 100% placement assistance."
        keywords="English courses online, Digital Marketing training, Corporate Training, Online learning India, Pakistan, Bangladesh, Nepal, Gulf countries, IELTS preparation, Career counselling, Skill development, English speaking course, Online education South Asia"
        url="https://digitalaela.com/"
      />
      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center pt-[130px] pb-20 md:pt-[180px] md:pb-28 overflow-hidden"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}>
        <div className="absolute inset-0 bg-black" />
        {heroSlides[activeHeroSlide].id === "ambition-action" && (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0">
              <div className="absolute top-10 left-1/2 h-112 w-md -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,#F5D26A_0%,rgba(245,210,106,0.1)_55%,transparent_100%)] blur-[140px]" />
              <div className="absolute top-1/3 left-[8%] h-80 w-80 rounded-full border border-[#F5D26A]/20 bg-[#F5D26A]/12 blur-[120px] mix-blend-screen" />
              <div className="absolute bottom-1/4 right-[12%] h-72 w-72 rounded-full border border-[#FFE28A]/25 bg-[#FFE28A]/10 blur-[140px] mix-blend-screen" />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className="mx-auto h-[420px] w-[420px] max-w-[80vw] rounded-[160px] border border-[#F5D26A]/35 bg-[radial-gradient(circle,#F5D26A/18_0%,rgba(245,210,106,0.05)_35%,transparent_75%)] blur-[90px]" />
            </motion.div>
          </>
        )}
        {heroSlides[activeHeroSlide].id === "gift-future" && (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0">
              <div className="absolute top-14 right-[18%] h-104 w-104 rounded-full bg-[radial-gradient(circle,#4ADE80_0%,rgba(74,222,128,0.08)_60%,transparent_100%)] blur-[160px]" />
              <div className="absolute bottom-[18%] left-[14%] h-96 w-96 rounded-full border border-[#6EE7B7]/25 bg-[#6EE7B7]/12 blur-[160px] mix-blend-screen" />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className="mx-auto h-[420px] w-[420px] max-w-[80vw] rounded-[160px] border border-[#6EE7B7]/30 bg-[radial-gradient(circle,#6EE7B7/18_0%,rgba(110,231,183,0.05)_35%,transparent_75%)] blur-[90px]" />
            </motion.div>
          </>
        )}
        {heroSlides[activeHeroSlide].id === "read-grow" && (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0">
              <div className="absolute top-[18%] left-[18%] h-100 w-100 rounded-full bg-[radial-gradient(circle,#F472B6_0%,rgba(244,114,182,0.08)_60%,transparent_100%)] blur-[150px]" />
              <div className="absolute bottom-[22%] right-[18%] h-96 w-96 rounded-full border border-[#FB7185]/25 bg-[#FB7185]/12 blur-[160px] mix-blend-screen" />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className="mx-auto h-[420px] w-[420px] max-w-[80vw] rounded-[160px] border border-[#F472B6]/25 bg-[radial-gradient(circle,#F472B6/16_0%,rgba(244,114,182,0.05)_35%,transparent_75%)] blur-[90px]" />
            </motion.div>
          </>
        )}
        {heroSlides[activeHeroSlide].id === "learn-earn" && (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0">
              <div className="absolute top-12 left-[20%] h-104 w-104 rounded-full bg-[radial-gradient(circle,#7AB8FF_0%,rgba(122,184,255,0.1)_60%,transparent_100%)] blur-[150px]" />
              <div className="absolute top-1/2 -translate-y-1/2 right-[14%] h-96 w-96 rounded-full border border-[#7C9BFF]/25 bg-[#7C9BFF]/12 blur-[160px] mix-blend-screen" />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className="mx-auto h-[420px] w-[420px] max-w-[80vw] rounded-[160px] border border-[#7AB8FF]/30 bg-[radial-gradient(circle,#7AB8FF/20_0%,rgba(122,184,255,0.05)_35%,transparent_75%)] blur-[90px]" />
            </motion.div>
          </>
        )}
        {heroSlides[activeHeroSlide].id === "learn-earn-opportunity" && (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0">
              <div className="absolute top-10 left-1/2 h-112 w-md -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,#FFFFFF_0%,rgba(255,255,255,0.1)_55%,transparent_100%)] blur-[140px]" />
              <div className="absolute top-1/3 left-[8%] h-80 w-80 rounded-full border border-white/20 bg-white/12 blur-[120px] mix-blend-screen" />
              <div className="absolute bottom-1/4 right-[12%] h-72 w-72 rounded-full border border-white/25 bg-white/10 blur-[140px] mix-blend-screen" />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className="mx-auto h-[420px] w-[420px] max-w-[80vw] rounded-[160px] border border-white/35 bg-[radial-gradient(circle,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_35%,transparent_75%)] blur-[90px]" />
            </motion.div>
          </>
        )}
        <motion.div
          className="absolute top-0 right-0 h-104 w-104 -translate-y-1/4 translate-x-1/3 rounded-full bg-[#D4AF37]/10 blur-[220px]"
        />
        <motion.div
          className="absolute bottom-0 left-0 h-104 w-104 translate-y-1/3 -translate-x-1/2 rounded-full bg-[#0B1533]/80 blur-[200px]"
        />

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroSlides[activeHeroSlide].id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
              <div className="order-2 text-left lg:order-1">
                <motion.span
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#D4AF37]">
                  <TranslatedText>{heroSlides[activeHeroSlide].badge}</TranslatedText>
                </motion.span>

                <motion.h1
                  className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-[2.8rem] font-display"
                  style={{
                    textShadow: getNeonTextShadow(
                      heroSlides[activeHeroSlide].id
                    ),
                  }}>
                  {typeof heroSlides[activeHeroSlide].title === "string" ? (
                    <TranslatedText>{heroSlides[activeHeroSlide].title}</TranslatedText>
                  ) : (
                    heroSlides[activeHeroSlide].title
                  )}
                </motion.h1>

                <motion.p
                  className="mt-3 text-lg font-semibold text-[#F5D26A]">
                  <TranslatedText>{heroSlides[activeHeroSlide].highlight}</TranslatedText>
                </motion.p>

                <motion.p
                  className="mt-4 max-w-xl text-base text-slate-200/85 md:text-lg">
                  <TranslatedText>{heroSlides[activeHeroSlide].description}</TranslatedText>
                </motion.p>

                <motion.div
                  className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {heroSlides[activeHeroSlide].primaryCta && (
                    <MotionLink
                      to={heroSlides[activeHeroSlide].primaryLink}
                      className={getPrimaryCtaClasses(
                        heroSlides[activeHeroSlide].primaryCta
                      )}>
                      <TranslatedText>{heroSlides[activeHeroSlide].primaryCta}</TranslatedText>
                    </MotionLink>
                  )}
                  {heroSlides[activeHeroSlide].secondaryCta && (
                    <MotionLink
                      to={heroSlides[activeHeroSlide].secondaryLink}
                      className={getSecondaryCtaClasses(
                        heroSlides[activeHeroSlide].secondaryCta
                      )}>
                      <TranslatedText>{heroSlides[activeHeroSlide].secondaryCta}</TranslatedText>
                    </MotionLink>
                  )}
                </motion.div>
              </div>

              <motion.div
                className="order-1 flex items-center justify-center lg:order-2 lg:translate-x-[30px]">
                <div className="relative w-full max-w-[640px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/60 shadow-2xl">
                  <div className="relative aspect-video w-full">
                    <img
                      src={heroSlides[activeHeroSlide].image}
                      alt={heroSlides[activeHeroSlide].title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-linear-to-tr from-black/50 via-black/0 to-transparent" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() =>
                  setActiveHeroSlide(
                    (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                  )
                }
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 text-white transition hover:border-white/40 hover:bg-white/10">
                <FaArrowLeft className="h-4 w-4" />
              </motion.button>
              <motion.button
                onClick={() =>
                  setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length)
                }
                className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/20 p-2 text-[#F5D26A] transition hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/30">
                <FaArrowRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveHeroSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${index === activeHeroSlide
                    ? "w-10 bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.6)]"
                    : "w-6 bg-white/25 hover:bg-white/45"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Futuristic Stats Section */}
      <motion.div
        ref={ribbonRef}
        className="relative w-full py-12 md:py-16 lg:py-5 overflow-hidden -mt-8 md:-mt-12">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-[#0a0a0a] via-[#1a0f2e] to-[#0a0a0a]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1),transparent_70%)] animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
            linear-gradient(rgba(212,175,55,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}></div>

        {/* Content Container */}
        <div className="relative z-10 layout-container">
          {/* Heading */}
          <motion.div
            className="text-center mb-5 md:mb-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#D4AF37] via-[#F5D26A] to-[#D4AF37] font-display tracking-tight">
              <TranslatedText>Achievements</TranslatedText>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 md:gap-6 lg:gap-8">
            {ribbonStats.map((stat, index) => {
              const currentValue =
                index < ribbonCounts.length ? ribbonCounts[index] : 0;
              const formattedValue = stat.decimals
                ? currentValue.toFixed(stat.decimals)
                : Math.max(0, currentValue).toLocaleString();

              return (
                <motion.div
                  key={`${stat.label}-${stat.value}`}
                  className="group relative">
                  {/* Glassmorphism Card */}
                  <div className="relative h-full rounded-xl border border-[#D4AF37]/20 bg-linear-to-br from-white/5 to-white/2 backdrop-blur-xl p-4 md:p-5 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:border-[#D4AF37]/40 group-hover:shadow-[0_12px_48px_rgba(212,175,55,0.2)]">
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                      {/* Number */}
                      <motion.div
                        className="text-transparent bg-clip-text bg-linear-to-br from-[#D4AF37] via-[#F5D26A] to-[#D4AF37] font-bold text-lg md:text-xl lg:text-2xl xl:text-2xl font-display mb-1.5 md:mb-2 leading-none">
                        {`${formattedValue}${stat.suffix ?? ""}`}
                      </motion.div>

                      {/* Label */}
                      <div className="text-slate-300 text-[10px] md:text-xs font-medium leading-tight px-2">
                        <TranslatedText>{stat.label}</TranslatedText>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 5 Step Learning Strategy Section */}
      <motion.section
        className="py-16 md:py-20 bg-black overflow-hidden">
        <div className="layout-container">
          {/* Title Area */}
          <motion.div
            className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
              <TranslatedText>Digital AELA –</TranslatedText>{" "}
              <span className="text-[#D4AF37]"><TranslatedText>5 Step Learning Strategy</TranslatedText></span>
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
              <TranslatedText>Learn → Practice → Get Certified → Grow Your Career</TranslatedText>
            </p>
          </motion.div>

          {/* Steps Grid - First 3 Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1: Book a Free Demo Class */}
            <motion.div
              className="bg-[#0a0a0a] rounded-2xl border border-[#3B82F6]/20 p-6 md:p-8 hover:border-[#3B82F6] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300 flex flex-col h-full">
              <div className="shrink-0 flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-[#3B82F6] flex items-center justify-center shrink-0">
                  <FaCalendarCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-display">
                  <TranslatedText>Step 1: Book a Free Demo Class</TranslatedText>
                </h3>
              </div>
              <p className="flex-1 text-gray-300 text-sm md:text-base leading-relaxed mb-6">
                <TranslatedText>Assess your current proficiency level, interact with our expert trainers, and experience a comprehensive course demonstration to understand our teaching methodology.</TranslatedText>
              </p>
              <Link
                to="/contact/book-demo"
                className="inline-flex items-center justify-center w-full rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold px-6 py-3 transition-colors duration-300 mt-auto">
                <TranslatedText>Book Demo →</TranslatedText>
              </Link>
            </motion.div>

            {/* Step 2: Enroll in the Right Course */}
            <motion.div
              className="bg-[#0a0a0a] rounded-2xl border border-[#10B981]/20 p-6 md:p-8 hover:border-[#10B981] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300 flex flex-col h-full">
              <div className="shrink-0 flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-[#10B981] flex items-center justify-center shrink-0">
                  <FaCheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-display">
                  <TranslatedText>Step 2: Enroll in the Right Course</TranslatedText>
                </h3>
              </div>
              <p className="flex-1 text-gray-300 text-sm md:text-base leading-relaxed mb-6">
                <TranslatedText>Choose from our Beginner, Intermediate, or Spoken English programs - select the course that best aligns with your learning objectives and career goals.</TranslatedText>
              </p>
              <Link
                to="/courses/english-language"
                className="inline-flex items-center justify-center w-full rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-semibold px-6 py-3 transition-colors duration-300 mt-auto">
                <TranslatedText>Enroll Now →</TranslatedText>
              </Link>
            </motion.div>

            {/* Step 3: Get Trained (Online + Books) */}
            <motion.div
              className="bg-[#0a0a0a] rounded-2xl border border-[#F59E0B]/20 p-6 md:p-8 hover:border-[#F59E0B] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all duration-300 flex flex-col h-full">
              <div className="shrink-0 flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-[#F59E0B] flex items-center justify-center shrink-0">
                  <FaPlayCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-display">
                  <TranslatedText>Step 3: Get Trained (Online + Books)</TranslatedText>
                </h3>
              </div>
              <p className="flex-1 text-gray-300 text-sm md:text-base leading-relaxed mb-6">
                <TranslatedText>Access 40+ comprehensive video lessons, receive 3 professionally printed books, participate in interactive live Q&A sessions, and join practice groups to enhance your daily learning experience.</TranslatedText>
              </p>
              <Link
                to="/books"
                className="inline-flex items-center justify-center w-full rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold px-6 py-3 transition-colors duration-300 mt-auto">
                <TranslatedText>Start Learning →</TranslatedText>
              </Link>
            </motion.div>
          </div>

          {/* Centered Steps 4 & 5 */}
          <div className="flex justify-center items-center mt-12 md:mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl w-full">
              {/* Step 4: Get Certified */}
              <motion.div
                className="bg-[#0a0a0a] rounded-2xl border border-[#D4AF37]/20 p-6 md:p-8 hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300 flex flex-col h-full">
                <div className="shrink-0 flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0">
                    <FaCertificate className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white font-display">
                    <TranslatedText>Step 4: Get Certified</TranslatedText>
                  </h3>
                </div>
                <p className="flex-1 text-gray-300 text-sm md:text-base leading-relaxed mb-6">
                  <TranslatedText>Complete your comprehensive course curriculum, successfully pass the final assessment, and earn an internationally recognized certificate that validates your English language proficiency.</TranslatedText>
                </p>
                <Link
                  to="/gallery"
                  className="inline-flex items-center justify-center w-full rounded-lg bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold px-6 py-3 transition-colors duration-300 mt-auto">
                  <TranslatedText>Get Certified →</TranslatedText>
                </Link>
              </motion.div>

              {/* Step 5: Placement & Abroad Opportunities */}
              <motion.div
                className="bg-[#0a0a0a] rounded-2xl border border-[#F97316]/20 p-6 md:p-8 hover:border-[#F97316] hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-300 flex flex-col h-full">
                <div className="shrink-0 flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-[#F97316] flex items-center justify-center shrink-0">
                    <FaGlobe className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white font-display">
                    <TranslatedText>Step 5: Placement & Abroad Opportunities</TranslatedText>
                  </h3>
                </div>
                <p className="flex-1 text-gray-300 text-sm md:text-base leading-relaxed mb-6">
                  <TranslatedText>Join advanced training batches, receive specialized communication training and comprehensive interview preparation support - prepare yourself for rewarding opportunities in Gulf countries and global markets.</TranslatedText>
                </p>
                <Link
                  to="/explore-jobs"
                  className="inline-flex items-center justify-center w-full rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold px-6 py-3 transition-colors duration-300 mt-auto">
                  <TranslatedText>Explore Opportunities →</TranslatedText>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Courses Section */}
      <motion.section
        id="courses"
        className="pt-8 pb-12 bg-black">
        <div className="layout-container">
          <motion.div
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Our Premium</TranslatedText>{" "}
              <span className="text-[#D4AF37]"><TranslatedText>Courses</TranslatedText></span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              <TranslatedText>Choose from our carefully designed programs tailored to your learning level and goals</TranslatedText>
            </p>
          </motion.div>

          {/* Courses Infinite Scrolling Ribbon */}
          <div
            className="relative mb-10"
            onMouseEnter={() => setIsCourseRibbonPaused(true)}
            onMouseLeave={() => setIsCourseRibbonPaused(false)}>
            {/* Navigation Arrows */}
            <button
              onClick={scrollCoursesLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#D4AF37]/90 hover:bg-[#D4AF37] text-black p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
              aria-label="Scroll left">
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollCoursesRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#D4AF37]/90 hover:bg-[#D4AF37] text-black p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
              aria-label="Scroll right">
              <FaArrowRight className="w-5 h-5" />
            </button>

            <style>{`
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div
              className="overflow-x-auto overflow-y-hidden scrollbar-hide px-12"
              ref={courseRibbonRef}>
              {loadingCourses ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-[#D4AF37] text-lg">
                    <TranslatedText>Loading premium courses...</TranslatedText>
                  </div>
                </div>
              ) : homeCourses.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-gray-300 text-lg">
                    <TranslatedText>No premium courses available yet.</TranslatedText>
                  </div>
                </div>
              ) : (
                <div
                  className="flex gap-6"
                  style={{
                    width: "fit-content",
                  }}>
                  {duplicatedCourses.map((course, index) => (
                    <div
                      key={`${course.slug}-${index}`}
                      className="shrink-0"
                      style={{
                        width:
                          "clamp(280px, calc((100vw - 4rem) / 3 - 1.5rem), 400px)",
                      }}>
                      <motion.div
                        className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_10px_rgba(212,175,55,0.18)] transition-all duration-300 group cursor-pointer flex flex-col h-full min-h-[500px]"
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          handleViewCourseDetail(course, "home-featured")
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleViewCourseDetail(course, "home-featured");
                          }
                        }}>
                        <div className="shrink-0 h-40 w-full overflow-hidden">
                          <img
                            src={
                              getMediaUrl(course.image) ||
                              "https://via.placeholder.com/300x200?text=Course"
                            }
                            alt={course.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="flex flex-1 flex-col p-6 bg-linear-to-b from-[#141414] to-[#0a0a0a] min-h-0">
                          <div className="shrink-0 mb-4">
                            <h3 className="text-lg md:text-xl font-semibold text-[#D4AF37] mb-2 font-display leading-tight group-hover:text-[#E5C158] transition-colors duration-300 line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-xs md:text-sm line-clamp-2">
                              {course.description}
                            </p>
                          </div>

                          <div className="shrink-0 flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-400 mb-4">
                            <span className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-[#D4AF37] shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {course.duration || <TranslatedText>N/A</TranslatedText>}
                            </span>
                            <span className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-[#D4AF37] shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                              </svg>
                              {course.format || <TranslatedText>Online</TranslatedText>}
                            </span>
                          </div>

                          {course.features && course.features.length > 0 ? (
                            <div className="shrink-0 border-t border-[#D4AF37]/15 pt-4 mb-4">
                              <p className="mb-3 text-[#D4AF37]/80 text-xs uppercase tracking-[0.25em]">
                                <TranslatedText>Key Highlights</TranslatedText>
                              </p>
                              <ul className="space-y-2 text-xs md:text-sm text-gray-300">
                                {course.features
                                  .slice(0, 3)
                                  .map((feature, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-center gap-2">
                                      <span className="h-[2px] w-2 rounded-full bg-[#D4AF37]/40 shrink-0"></span>
                                      <span className="line-clamp-1">
                                        {feature}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="shrink-0 mb-4 min-h-[60px]"></div>
                          )}

                          <div className="shrink-0 flex flex-col gap-3 mt-auto pt-2">
                            <div className="flex items-center justify-between text-sm text-gray-300">
                              <span><TranslatedText>Course Fee</TranslatedText></span>
                              <span className="text-lg font-semibold text-[#F5D26A]">
                                {course.price}
                              </span>
                            </div>
                            <motion.button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleViewCourseDetail(course, "home-featured");
                              }}
                              className="w-full inline-flex items-center justify-center rounded-full border border-[#D4AF37]/60 bg-transparent px-4 py-2.5 text-xs md:text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all duration-300">
                              <TranslatedText>See Full Course</TranslatedText>
                            </motion.button>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <motion.button
                                onClick={(event) => {
                                  event.stopPropagation();

                                  // Check if course is free
                                  if (isFreeCourse(course)) {
                                    // Free course - navigate to course detail page for enrollment
                                    handleViewCourseDetail(course, "home-featured");
                                  } else {
                                    // Paid course - go to payment flow
                                    redirectToCoursePayment(course, {
                                      origin: "home-featured",
                                      category:
                                        course.category ?? "Featured Programs",
                                    });
                                  }
                                }}
                                className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs md:text-sm font-semibold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                                {isFreeCourse(course) ? <TranslatedText>Enroll Free</TranslatedText> : <TranslatedText>Buy Now</TranslatedText>}
                              </motion.button>
                              <div
                                onClick={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}>
                                <GiftButton
                                  course={course}
                                  origin="home-featured"
                                  className="inline-flex w-full items-center justify-center rounded-full border border-[#D4AF37]/60 px-4 text-xs md:text-sm font-semibold text-[#F5D26A] hover:bg-[#D4AF37] hover:text-black"
                                  size="sm">
                                  <TranslatedText>Gift</TranslatedText>
                                </GiftButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* See All Courses Button */}
          <motion.div
            className="flex justify-center">
            <Link to="/courses/english-language">
              <motion.button
                className="bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#E5C158] transition-colors duration-200">
                <TranslatedText>Explore All Courses</TranslatedText>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* About Founder Section */}
      <motion.section
        className="py-12 bg-black">
        <div className="layout-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Founder's Image */}
            <motion.div
              className="order-2 lg:order-2">
              <motion.div
                className="relative">
                <img
                  src={founderImage}
                  alt="Digital AELA Founder - Expert English Language Trainer and Education Professional"
                  className="w-full h-auto rounded-2xl object-cover"
                />
              </motion.div>
            </motion.div>

            {/* Right Side - Text Content */}
            <motion.div
              className="order-1 lg:order-1">
              {/* "About Our Founder" Badge */}
              <div className="mb-4">
                <span className="inline-block border-2 border-[#D4AF37] text-white px-4 py-2 rounded-lg text-sm font-semibold font-display">
                  <TranslatedText>About Our Founder</TranslatedText>
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display tracking-tight leading-none">
                <TranslatedText>Meet Our</TranslatedText>{" "}
                <span className="text-[#D4AF37]"><TranslatedText>Visionary Leader</TranslatedText></span>
              </h2>

              {/* Descriptive Paragraph */}
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                <TranslatedText>With over 15 years of experience in English language education, our founder has dedicated their career to helping students achieve fluency and confidence. Specializing in IELTS preparation and corporate training, we understand that confidence in English opens doors to unlimited opportunities.</TranslatedText>
              </p>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                <TranslatedText>Our innovative teaching methodology combines personalized approach with proven techniques, helping thousands of students achieve their dreams.</TranslatedText>
              </p>

              {/* Statistics Section */}
              <motion.div
                className="flex flex-wrap gap-8 mt-8">
                {[
                  { number: "15+", label: "Years Experience" },
                  { number: "5000+", label: "Students Trained" },
                  { number: "98%", label: "Success Rate" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col">
                    <span className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-2 font-display">
                      {stat.number}
                    </span>
                    <p className="text-sm text-white font-normal">
                      <TranslatedText>{stat.label}</TranslatedText>
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Know More Button */}
              <motion.div
                className="mt-8">
                <motion.button
                  onClick={() => navigate("/about/founder")}
                  className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-3 text-sm md:text-base font-semibold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                  <TranslatedText>Know More</TranslatedText>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Lead Magnets Section */}
      <motion.section
        id="lead-magnets"
        className="py-12 bg-[#141414]">
        <div className="layout-container">
          <motion.div
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Start Your</TranslatedText>{" "}
              <span className="text-[#D4AF37]"><TranslatedText>Journey Free</TranslatedText></span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              <TranslatedText>Experience premium English learning with our exclusive free offers</TranslatedText>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Free Demo Class Card */}
            <motion.div
              className="bg-[#1a1a1a] rounded-lg p-8 border border-[#D4AF37] text-center hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 flex flex-col h-full">
              {/* Play Icon */}
              <div className="shrink-0 flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#3f3820] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="shrink-0 text-2xl font-bold text-white mb-4 font-display">
                <TranslatedText>Free Demo Class</TranslatedText>
              </h3>

              {/* Description */}
              <p className="flex-1 text-gray-300 mb-6 leading-relaxed">
                <TranslatedText>Join our interactive demo class and experience our teaching methodology firsthand.</TranslatedText>
              </p>

              {/* Button */}
              <MotionLink
                to="/contact/book-demo"
                className="block w-full bg-[#D4AF37] text-black py-3 rounded-lg font-bold text-center hover:bg-[#E5C158] transition-colors duration-200">
                <TranslatedText>Book Your Class</TranslatedText>
              </MotionLink>
            </motion.div>

            {/* Free English Guide Card */}
            <motion.div
              className="bg-[#1a1a1a] rounded-lg p-8 border border-[#D4AF37] text-center hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 flex flex-col h-full">
              {/* Download Icon */}
              <div className="shrink-0 flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#3f3820] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="shrink-0 text-2xl font-bold text-white mb-4 font-display">
                <TranslatedText>Free English Guide</TranslatedText>
              </h3>

              {/* Description */}
              <p className="flex-1 text-gray-300 mb-6 leading-relaxed">
                <TranslatedText>Download our comprehensive English learning guide with tips, tricks, and study resources.</TranslatedText>
              </p>

              {/* Button */}
              <MotionLink
                to="/free-library"
                className="block w-full bg-[#1a1a1a] text-[#D4AF37] py-3 rounded-lg font-bold text-center border-2 border-[#D4AF37] hover:bg-[#524723] transition-colors duration-200">
                <TranslatedText>Download Now</TranslatedText>
              </MotionLink>
            </motion.div>

            {/* Gift a Future Card */}
            <motion.div
              className="bg-[#1a1a1a] rounded-lg p-8 border border-[#D4AF37] text-center hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 flex flex-col h-full">
              {/* Gift Icon */}
              <div className="shrink-0 flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#3f3820] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="shrink-0 text-2xl font-bold text-white mb-4 font-display">
                <TranslatedText>Gift a Future</TranslatedText>
              </h3>

              {/* Description */}
              <p className="flex-1 text-gray-300 mb-6 leading-relaxed">
                <TranslatedText>Sponsor a classroom, dedicate scholarships, and help transform lives through education.</TranslatedText>
              </p>

              {/* Button */}
              <motion.a
                href="/join-us/afterlife"
                className="block w-full bg-[#D4AF37] text-black py-3 rounded-lg font-bold text-center hover:bg-[#E5C158] transition-colors duration-200">
                <TranslatedText>Gift Now</TranslatedText>
              </motion.a>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Premium Books Section */}
      <motion.section
        className="py-12 bg-[#1a1a1a]">
        <div className="layout-container">
          {/* Header */}
          <motion.div
            className="text-center mb-16">
            {/* Small Title */}
            <motion.p
              className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-wider mb-4 font-display">
              <TranslatedText>• OUR RESOURCES •</TranslatedText>
            </motion.p>

            {/* Main Title */}
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Master English with Our</TranslatedText>{" "}
              <span className="text-[#D4AF37]"><TranslatedText>Premium Books</TranslatedText></span>
            </h2>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              <TranslatedText>Carefully curated learning materials designed by expert linguists to accelerate your English learning journey</TranslatedText>
            </p>
          </motion.div>

          {/* Loading State */}
          {loadingBooks && (
            <div className="flex items-center justify-center py-20">
              <div className="text-[#D4AF37] text-lg">
                <TranslatedText>Loading featured books...</TranslatedText>
              </div>
            </div>
          )}

          {/* Books Grid */}
          {!loadingBooks && featuredBooks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {(translatedBooks.length > 0 ? translatedBooks : featuredBooks).map((book, index) => {
                const discountPercent =
                  book.originalPrice > 0
                    ? Math.round(
                      ((book.originalPrice - book.price) /
                        book.originalPrice) *
                      100
                    )
                    : 0;
                const displayPrice =
                  book.price > 0 ? `AED ${book.price}` : "Free";
                const displayOriginalPrice =
                  book.originalPrice > 0 ? `AED ${book.originalPrice}` : "";

                return (
                  <motion.div
                    key={book.id}
                    className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group cursor-pointer flex flex-col h-full">
                    <Link
                      to={`/books/${book.id}`}
                      className="flex flex-col h-full">
                      {/* Book Image */}
                      <div className="relative h-48 w-full overflow-hidden">
                        <img
                          src={
                            getMediaUrl(book.image) ||
                            "https://via.placeholder.com/300x400?text=Book"
                          }
                          alt={book.imageAlt || book.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                        {/* Format Badge */}
                        <div className="absolute top-2 right-2">
                          <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            {book.badge === "Physical" ? (
                              <FaBook className="w-2.5 h-2.5" />
                            ) : (
                              <FaDownload className="w-2.5 h-2.5" />
                            )}
                            {book.badge || "E-Book"}
                          </span>
                        </div>
                        {/* Discount Badge */}
                        {discountPercent > 0 && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {discountPercent}% OFF
                          </div>
                        )}
                      </div>

                      {/* Book Content */}
                      <div className="flex flex-1 flex-col p-4">
                        {/* Category */}
                        <span className="shrink-0 text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide">
                          {book.category}
                        </span>

                        {/* Title */}
                        <h3 className="shrink-0 text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 mt-1">
                          {book.title}
                        </h3>

                        {/* Author */}
                        <p className="shrink-0 text-xs text-gray-400 mb-2">
                          <TranslatedText>by</TranslatedText> {book.author}
                        </p>

                        {/* Rating */}
                        <div className="shrink-0 flex items-center gap-1.5 mb-3">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={`w-3 h-3 ${i < Math.floor(book.rating || 4.5)
                                  ? "text-[#D4AF37] fill-current"
                                  : "text-gray-600"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-300">
                            {book.rating || 4.5}
                          </span>
                          {book.reviews > 0 && (
                            <span className="text-[10px] text-gray-500">
                              ({book.reviews})
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="shrink-0 flex items-center gap-2 mb-3">
                          <span className="text-lg font-bold text-[#D4AF37] font-display">
                            {displayPrice}
                          </span>
                          {displayOriginalPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              {displayOriginalPrice}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <motion.button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const isFreeBook =
                                book.price === 0 || book.price === "Free" || book.price === null;
                              const isEbook =
                                book.badge === "E-Book" ||
                                book.format === "ebook";

                              if (isFreeBook && isEbook) {
                                // Free ebook - redirect to free library reader
                                navigate(`/free-library/ebook/${book.id}/read`);
                              } else if (isFreeBook) {
                                // Free physical book - redirect to book detail page
                                navigate(`/books/${book.id}`);
                              } else {
                                // Paid book - go to payment page
                                if (!isAuthenticated) {
                                  navigate("/login/student");
                                  return;
                                }

                                // Validate price
                                const bookPrice = typeof book.price === 'number' ? book.price : parseFloat(book.price) || 0;
                                if (!bookPrice || bookPrice <= 0) {
                                  toast.error("This book price is not available. Please contact support.");
                                  return;
                                }

                                redirectToRazorpay({
                                  bookId: book.id,
                                  amount: bookPrice,
                                  currency: "AED",
                                  description: `Payment for ${book.title || "book"}`,
                                  userName: user?.fullName || "",
                                  userEmail: user?.email || "",
                                  userPhone: user?.phone || "",
                                  quantity: 1,
                                });
                              }
                            }}
                            className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-bold text-xs hover:bg-[#E5C158] transition-colors duration-200">
                            {book.price > 0 ? "Buy Now" : "Get Free"}
                          </motion.button>
                          {book.price > 0 && (
                            <GiftButton
                              course={book} // Pass the book object
                              className="w-full border border-[#D4AF37]/60 text-[#F5D26A] rounded-lg font-bold text-xs hover:bg-[#D4AF37] hover:text-black"
                              size="sm">
                              Gift
                            </GiftButton>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* No Books Message */}
          {!loadingBooks && featuredBooks.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-300 text-lg">
                No featured books available yet.
              </div>
            </div>
          )}

          {/* View All Books Button */}
          <motion.div
            className="flex justify-center">
            <Link to="/books">
              <motion.button
                className="bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold text-base md:text-lg hover:bg-[#E5C158] transition-colors duration-200 flex items-center gap-2">
                <TranslatedText>View All Books</TranslatedText>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Why Choose Digital AELA Section */}
      <style>{`
        @media (max-width: 767px) {
          .why-choose-section-content {
            opacity: 1 !important;
          }
        }
      `}</style>
      <section className="py-20 bg-[#141414]">
        <div className="layout-container">
          <motion.div
            className="why-choose-section-content">
            <motion.div
              className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
                <TranslatedText>Why Choose</TranslatedText>{" "}
                <span className="text-[#D4AF37]"><TranslatedText>Digital AELA</TranslatedText></span>?
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                <TranslatedText>Your partner in building a strong future with knowledge that creates income, and income that creates freedom</TranslatedText>
              </p>
            </motion.div>

            {/* Benefits Grid */}
            <div className="auto-grid-md lg:grid-cols-3 mb-16">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.id}
                  className="bg-[#1a1a1a] rounded-xl p-8 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 flex flex-col h-full">
                  {/* Icon */}
                  <div className="shrink-0 flex justify-center mb-4">
                    {renderIcon(benefit.icon)}
                  </div>

                  {/* Title */}
                  <h3 className="shrink-0 text-xl md:text-2xl font-bold text-white mb-3 font-display">
                    <TranslatedText>{benefit.title}</TranslatedText>
                  </h3>

                  {/* Description */}
                  <p className="flex-1 text-gray-300 leading-relaxed">
                    <TranslatedText>{benefit.description}</TranslatedText>
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Watch Our Stories Section */}
      <style>{`
        @media (max-width: 767px) {
          .watch-stories-section-content,
          .watch-stories-section-content * {
            opacity: 1 !important;
          }
        }
      `}</style>
      <section className="py-12 bg-black">
        <div className="layout-container">
          <div className="watch-stories-section-content">
            <motion.div
              className="md:opacity-100">
              <motion.div
                className="text-center mb-12 md:opacity-100">
                <p className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-[0.35em] mb-3 font-display">
                  <TranslatedText>• WATCH OUR STORIES •</TranslatedText>
                </p>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
                  <TranslatedText>Step Inside the</TranslatedText>{" "}
                  <span className="text-[#D4AF37]"><TranslatedText>Digital AELA</TranslatedText></span>{" "}
                  <TranslatedText>Experience</TranslatedText>
                </h2>
                <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  <TranslatedText>Hear from our learners, mentors, and community as they share milestones, transformations, and the heart behind the Afterlife movement.</TranslatedText>
                </p>
              </motion.div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {storyVideos.map((video, index) => (
                  <motion.article
                    key={video.id}
                    className="overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#050505] shadow-xl">
                    <div className="relative w-full overflow-hidden bg-black aspect-video md:aspect-9/16">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&showinfo=0`}
                        title={video.title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full border-0"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-white mb-2 font-display line-clamp-2">
                        {video.title}
                      </h3>
                      <a
                        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5D26A] transition-colors duration-200 hover:text-[#FFE28A]">
                        <TranslatedText>Watch on YouTube</TranslatedText>
                        <FaArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {topBlogs.length > 0 && (
        <motion.section
          className="py-12 bg-[#090909]">
          <div className="layout-container">
            <motion.div
              className="text-center mb-12">
              <p className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-[0.35em] mb-3 font-display">
                <TranslatedText>• BLOGS •</TranslatedText>
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
                <TranslatedText>Latest Stories from the</TranslatedText>{" "}
                <span className="text-[#D4AF37]"><TranslatedText>AELA Community</TranslatedText></span>
              </h2>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                <TranslatedText>Quick reads curated by our mentors and learners. Dive into frameworks, wins, and behind-the-scenes playbooks powering the Afterlife movement.</TranslatedText>
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {topBlogs.map((blog, index) => (
                <motion.article
                  key={`${blog.id}-${blog.publishedAt || index}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#050505] shadow-xl transition-all duration-300">
                  <Link
                    to={`/blogs/${blog.id}`}
                    className="flex h-full flex-col">
                    <div className="relative h-56 w-full overflow-hidden shrink-0">
                      <img
                        src={getMediaUrl(blog.thumbnail)}
                        alt={blog.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                      <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#F5D26A]">
                        {blog.category}
                      </span>
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-semibold text-white/90">
                        {blog.readTime} <TranslatedText>min read</TranslatedText>
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="shrink-0 mb-4 flex items-center gap-3 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <img
                            src={blog.author.avatar}
                            alt={blog.author.name}
                            className="h-8 w-8 rounded-full object-cover shrink-0"
                          />
                          <span className="font-semibold text-white/90 truncate">
                            {blog.author.name}
                          </span>
                        </span>
                        <span className="h-1 w-1 rounded-full bg-gray-600 shrink-0" />
                        <span className="shrink-0">
                          {new Date(blog.publishedAt).toLocaleDateString(
                            "en-GB"
                          )}
                        </span>
                      </div>
                      <h3 className="shrink-0 mb-3 text-xl font-semibold text-white font-display leading-tight group-hover:text-[#F5D26A] line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="flex-1 text-sm text-gray-300 leading-relaxed line-clamp-3 min-h-0">
                        {blog.excerpt?.replace(/<[^>]+>/g, "") || ""}
                      </p>
                      <span className="shrink-0 mt-auto pt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#F5D26A] transition-colors duration-200 group-hover:text-[#FFE28A]">
                        <TranslatedText>Read Story</TranslatedText>
                        <FaArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#0f0f0f] px-6 py-3 text-sm font-semibold text-[#F5D26A] transition hover:border-[#F5D26A]/60 hover:text-[#FFE28A]">
                <TranslatedText>Explore All Blogs</TranslatedText>
                <FaArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {galleryItems.length > 0 && (
        <motion.section
          className="py-12 bg-[#080808]">
          <div className="layout-container">
            <motion.div
              className="text-center mb-12">
              <p className="text-[#D4AF37] text-sm md:text-base font-semibold uppercase tracking-[0.35em] mb-3 font-display">
                <TranslatedText>• AELA GALLERY •</TranslatedText>
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-tight">
                <TranslatedText>From Hesitation to Certification —</TranslatedText>{" "}
                <span className="text-[#D4AF37]">
                  <TranslatedText>Their Journey, Your Inspiration</TranslatedText>
                </span>
              </h2>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                <TranslatedText>Certificate ke saath real learning, real confidence aur real speaking skills.</TranslatedText>
                <br />
                <TranslatedText>Aaj se aapka English journey bhi start ho sakta hai.</TranslatedText>
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {galleryItems.slice(0, 6).map((item, index) => (
                <motion.figure
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#060606] shadow-xl">
                  <div className="relative h-56 w-full overflow-hidden">
                    <img
                      src={getMediaUrl(item.image)}
                      alt="AELA community gallery"
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                  </div>
                </motion.figure>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <MotionLink
                to="/gallery"
                className="inline-flex w-full max-w-lg items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-8 py-3 text-sm font-semibold text-black shadow-lg transition hover:brightness-105">
                <TranslatedText>Get Certified with Digital AELA → Enroll Now</TranslatedText>
              </MotionLink>
            </div>
          </div>
        </motion.section>
      )}

      {/* Testimonials Section */}
      <motion.section
        className="py-12 bg-[#141414]">
        <div className="layout-container">
          <motion.div
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Student</TranslatedText>{" "}
              <span className="text-[#D4AF37]"><TranslatedText>Testimonials</TranslatedText></span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              <TranslatedText>Success stories from our amazing students</TranslatedText>
            </p>
          </motion.div>

          {/* Testimonial Cards Row */}
          <div className="relative">
            {/* Side Arrows */}
            <motion.button
              onClick={prevTestimonial}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-black/70 text-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:bg-[#2a2413] transition">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </motion.button>
            <motion.button
              onClick={nextTestimonial}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-black/70 text-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:bg-[#2a2413] transition">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>

            <motion.div
              className="grid gap-6 md:grid-cols-3">
              {loadingTestimonials ? (
                <div className="col-span-3 text-center py-12 text-gray-400">
                  <TranslatedText>Loading testimonials...</TranslatedText>
                </div>
              ) : visibleTestimonials.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-gray-400">
                  <TranslatedText>No testimonials available</TranslatedText>
                </div>
              ) : (
                visibleTestimonials.map((item) => (
                  <motion.article
                    key={item.id}
                    className="flex flex-col h-full rounded-3xl border border-white/12 bg-[#101010] px-6 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
                    <div className="shrink-0 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#D4AF37]/40">
                          <img
                            src={getMediaUrl(item.avatar) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {item.role}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/25 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-300">
                        <TranslatedText>Verified</TranslatedText>
                      </span>
                    </div>

                    <div className="shrink-0 mt-3 flex items-center gap-1">
                      {[...Array(item.rating)].map((_, i) => (
                        <svg
                          key={i}
                          className="h-4 w-4 text-[#F5D26A]"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    <p className="flex-1 mt-4 text-sm text-gray-200 leading-relaxed">
                      "{item.text}"
                    </p>
                  </motion.article>
                ))
              )}
            </motion.div>

            {/* Mobile arrows below */}
            <div className="mt-6 flex justify-center gap-4 md:hidden">
              <button
                type="button"
                onClick={prevTestimonial}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-black/80 text-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextTestimonial}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-black/80 text-[#D4AF37] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        id="faq"
        className="relative overflow-hidden py-12 bg-black">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[#D4AF37]/22 blur-[180px]" />
          <div className="absolute bottom-[-18%] right-1/5 h-80 w-80 rounded-full bg-[#F97316]/18 blur-[170px]" />
          <div className="absolute top-1/3 right-1/3 h-60 w-60 rounded-full border border-[#FDBA74]/20 bg-[#FDBA74]/10 blur-[150px] mix-blend-screen" />
        </div>
        <div className="layout-container">
          <div className="text-center mb-9">
            <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70 font-semibold font-accent">
              <TranslatedText>Frequently Asked Questions</TranslatedText>
            </p>
            <h2 className="text-xl md:text-3xl font-bold text-white mt-3 font-display">
              <TranslatedText>Answers designed for curious learners</TranslatedText>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mt-3 text-xs md:text-sm">
              <TranslatedText>Everything you need to know about Digital AELA courses, support, and the career outcomes we help you unlock.</TranslatedText>
            </p>
          </div>

          <div className="mx-auto max-w-4xl space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = activeFaq === index;
              return (
                <motion.div
                  key={item.question}
                  className="rounded-2xl border border-[#D4AF37]/15 bg-[#111]/80 shadow-[0_16px_36px_rgba(0,0,0,0.22)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? -1 : index)}
                    className="w-full flex items-center justify-between gap-5 px-5 py-3 text-left">
                    <span className="text-white text-sm md:text-base font-semibold leading-snug">
                      {index + 1}. {item.question}
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF37]/35 transition-all duration-150 ${isOpen
                        ? "bg-[#D4AF37]/15 text-[#D4AF37] rotate-45"
                        : "bg-transparent text-[#D4AF37]"
                        }`}>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <motion.div
                      className="px-5 pb-4 overflow-hidden">
                      <div className="text-xs md:text-sm leading-relaxed text-gray-300">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
