import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaDownload, FaCheckCircle, FaPlayCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import GiftButton from "../common/GiftButton";
import { useAuth } from "../../../src/contexts/AuthContext";
import { buildCoursePaymentLink, extractNumericPrice } from "../utils/paymentLinks";
import { redirectToRazorpay } from "../utils/directRazorpayPayment";
import { getCourseBySlug } from "../data/courseCatalog";
import {
  enrollInCourse,
  getEnrollmentStatus,
  fetchCourseById,
} from "../../../src/services/api/courses";
import CourseVideosList from "../../student/CourseVideosList";
import CourseReviews from "../common/CourseReviews";
import { useDynamicTranslation } from "../../../src/hooks/useDynamicTranslation";
import { useLanguage } from "../../../src/contexts/LanguageContext";
import { normalizeLanguageCode } from "../../../src/utils/languageUtils";
import { getMediaUrl } from "../../../src/utils/mediaUrl";

const categoryPaths = {
  "English Language": "/courses/english-language",
  "Digital Marketing": "/courses/digital-marketing",
  "Corporate Training": "/courses/corporate-training",
};

const fallbackSummary =
  "Digital AELA courses blend live mentorship, guided cohorts, and project practice so you can apply skills immediately in your career.";

// Helper function to normalize course data from backend
const normalizeCourseData = (backendCourse) => {
  if (!backendCourse) return null;

  // Extract course from response if it's wrapped
  const courseData = backendCourse.course || backendCourse;

  // Extract metadata fields
  const metadata = courseData.metadata || {};

  // Merge all fields, prioritizing direct fields over metadata
  return {
    ...courseData,
    // Basic fields
    title: courseData.title || "",
    description: courseData.description || metadata.subtitle || metadata.description || "",
    longDescription: courseData.longDescription || courseData.description || metadata.longDescription || metadata.subtitle || "",
    category: courseData.category || metadata.category || "General",
    difficulty: courseData.difficulty || metadata.difficulty || "",
    language: courseData.language || metadata.language || "",
    duration: courseData.duration ? `${courseData.duration} hours` : metadata.duration || "",
    price: courseData.price === 0 ? "Free" : courseData.price ? `AED ${courseData.price}` : "On Request",
    priceLabel: courseData.priceLabel || (courseData.price === 0 ? "Free" : courseData.price ? `AED ${courseData.price}` : "On Request"),
    // Preserve original numeric price for payment processing
    rawPrice: courseData.rawPrice !== undefined && courseData.rawPrice !== null
      ? courseData.rawPrice // Use existing rawPrice if available
      : typeof courseData.price === 'string'
        ? parseFloat(courseData.price.replace(/[^0-9.]/g, ''))
        : courseData.price, // Store original numeric price for GiftButton
    originalPrice: typeof courseData.price === 'number' ? courseData.price : (courseData.price ? parseFloat(courseData.price) : null),
    discountPrice: courseData.discountPrice || metadata.discountPrice || null,
    format: courseData.format || metadata.deliveryMode || courseData.deliveryMode || "",
    deliveryMode: courseData.deliveryMode || metadata.deliveryMode || "",
    // Media fields
    image: courseData.thumbnailUrl || courseData.thumbnail || courseData.image || metadata.thumbnailUrl || "",
    coverImage: courseData.coverImage || courseData.thumbnailUrl || courseData.thumbnail || courseData.image || metadata.coverImage || "",
    introVideoUrl: courseData.introVideoUrl || metadata.introVideoUrl || "",
    brochureUrl: courseData.brochureUrl || metadata.brochureUrl || "",
    // Content fields
    learningOutcomes: courseData.learningOutcomes || metadata.learningOutcomes || "",
    requirements: courseData.requirements || metadata.requirements || "",
    syllabus: courseData.syllabus || metadata.syllabus || "",
    detailedSyllabus: courseData.detailedSyllabus || metadata.detailedSyllabus || null,
    // Feature fields
    features: courseData.features || metadata.tags || courseData.tags || [],
    highlights: courseData.highlights || metadata.tags || courseData.tags || [],
    tags: courseData.tags || metadata.tags || [],
    // Other fields
    lessonCount: courseData.lessonCount || metadata.lessonCount || null,
    subtitle: courseData.subtitle || metadata.subtitle || "",
    instructor: courseData.instructor?.fullName || courseData.instructorName || "Digital AELA",
  };
};

const CourseDetail = () => {
  const { slug, courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, tokens } = useAuth();

  const stateCourse = location.state?.course;
  const catalogCourse = useMemo(() => {
    // Only try to get by slug if we have a slug and it's not a courseId route
    if (slug && !courseId) {
      return getCourseBySlug(slug);
    }
    return null;
  }, [slug, courseId]);
  const [course, setCourse] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);

  // Translation hooks
  const { language } = useLanguage();
  const { translateObject } = useDynamicTranslation();
  const [translatedCourse, setTranslatedCourse] = useState(null);

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      setIsLoadingCourse(true);
      try {
        // Priority 1: If courseId is in URL params, fetch by ID
        if (courseId) {
          try {
            const response = await fetchCourseById(courseId);
            const normalizedCourse = normalizeCourseData(response);
            setCourse(normalizedCourse);
            setIsLoadingCourse(false);
            return;
          } catch (error) {
            console.error("Failed to load course by ID:", error);
            toast.error("Course not found");
            setIsLoadingCourse(false);
            navigate("/", { replace: true });
            return;
          }
        }

        // Priority 2: If course has _id in state, try to fetch from backend
        if (stateCourse?._id) {
          try {
            const response = await fetchCourseById(stateCourse._id);
            const backendCourse = normalizeCourseData(response);
            // Preserve detailedSyllabus from catalog/state course if backend doesn't have it
            const preservedSyllabus = (catalogCourse?.detailedSyllabus || stateCourse?.detailedSyllabus);
            setCourse({
              ...catalogCourse,
              ...stateCourse,
              ...backendCourse,
              // Preserve detailedSyllabus from catalog if backend doesn't provide it
              detailedSyllabus: backendCourse.detailedSyllabus || preservedSyllabus
            });
            setIsLoadingCourse(false);
            return;
          } catch (error) {
            // Fallback to catalog/state course
            const fallbackCourse = { ...catalogCourse, ...stateCourse };
            setCourse(fallbackCourse);
            setIsLoadingCourse(false);
            // Only redirect if we have no course data at all
            if (!fallbackCourse || (!fallbackCourse.title && !fallbackCourse._id)) {
              navigate("/", { replace: true });
            }
            return;
          }
        }

        // Priority 3: If slug looks like a MongoDB ObjectId, try to fetch by ID
        if (slug && slug.length === 24 && /^[0-9a-fA-F]{24}$/.test(slug)) {
          try {
            const response = await fetchCourseById(slug);
            const backendCourse = normalizeCourseData(response);
            setCourse({
              ...backendCourse,
              slug: slug, // Preserve slug for navigation
            });
            setIsLoadingCourse(false);
            return;
          } catch (error) {
            // Fallback to catalog course
            const fallbackCourse = { ...catalogCourse, ...stateCourse };
            setCourse(fallbackCourse);
            setIsLoadingCourse(false);
            // Only redirect if we have no course data at all
            if (!fallbackCourse || (!fallbackCourse.title && !fallbackCourse._id)) {
              navigate("/", { replace: true });
            }
            return;
          }
        }

        // Priority 4: Use catalog course or state course
        const finalCourse = { ...catalogCourse, ...stateCourse };
        setCourse(finalCourse);
        setIsLoadingCourse(false);
        // Only redirect if we have no course data at all
        if (!finalCourse || (!finalCourse.title && !finalCourse._id && !finalCourse.slug)) {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Error loading course:", error);
        setIsLoadingCourse(false);
        navigate("/", { replace: true });
      }
    };

    loadCourse();
  }, [slug, courseId, stateCourse, catalogCourse, navigate]);

  // Check enrollment status if user is logged in with valid tokens and course has _id
  useEffect(() => {
    const checkEnrollment = async () => {
      // Only check enrollment if user is authenticated AND has valid access token
      if (!isAuthenticated || !user || !tokens?.accessToken || !course?._id) {
        setEnrollmentStatus({ enrolled: false });
        return;
      }

      setIsCheckingEnrollment(true);
      try {
        const status = await getEnrollmentStatus(course._id);
        setEnrollmentStatus(status);
      } catch (error) {
        // Handle errors gracefully
        if (error.status === 401) {
          // Unauthorized - token expired or invalid, silently handle
          // User will need to log in again, but don't show error
          setEnrollmentStatus({ enrolled: false });
        } else if (error.status === 404) {
          // Course not found - this is a real error
          console.error("Course not found:", error);
          setEnrollmentStatus({ enrolled: false });
        } else {
          // Other errors - assume not enrolled
          setEnrollmentStatus({ enrolled: false });
        }
      } finally {
        setIsCheckingEnrollment(false);
      }
    };

    checkEnrollment();
  }, [isAuthenticated, user, tokens?.accessToken, course?._id]);

  // Translate course content when language changes
  useEffect(() => {
    const translateCourseContent = async () => {
      if (!course) {
        setTranslatedCourse(null);
        return;
      }

      if (normalizeLanguageCode(language) === "en") {
        setTranslatedCourse(course);
        return;
      }

      try {
        const keysToTranslate = [
          "title",
          "description",
          "longDescription",
          "learningOutcomes",
          "requirements",
          "syllabus",
          "subtitle",
        ];

        const translated = await translateObject(course, keysToTranslate);
        setTranslatedCourse(translated);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[CourseDetail] Error translating course:", error);
        setTranslatedCourse(course);
      }
    };

    translateCourseContent();
  }, [course, language, translateObject]);

  // Use translated course if available, otherwise use original
  const displayCourse = translatedCourse || course;

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-300">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const {
    title,
    subtitle,
    category,
    description,
    longDescription,
    duration,
    format,
    deliveryMode,
    language: courseLanguage,
    difficulty,
    lessonCount,
    learningOutcomes,
    requirements,
    syllabus,
    price,
    discountPrice,
    priceLabel,
    image,
    coverImage,
    introVideoUrl,
    features = [],
    detailedSyllabus,
    tags = [],
  } = displayCourse || course;

  // Get the actual numeric price - use originalPrice if available, otherwise extract from display string
  const priceDisplay = priceLabel || price || "On Request";
  const originalPrice = course.originalPrice; // Preserved numeric price from backend
  let priceValue = 0;

  // First try to use the preserved original numeric price
  if (typeof originalPrice === 'number' && originalPrice > 0) {
    priceValue = originalPrice;
  } else if (typeof course.price === 'number' && course.price > 0) {
    // Fallback to course.price if it's still a number
    priceValue = course.price;
  } else {
    // Last resort: extract from display string
    priceValue = extractNumericPrice(priceDisplay);
  }

  const isFreeCourse = priceValue === 0 || originalPrice === 0 || (typeof originalPrice === 'number' && originalPrice === 0);
  const categoryPath = categoryPaths[category] ?? "/courses";
  const summaryText = longDescription || description || fallbackSummary;

  const handleEnroll = async () => {
    // If user is not logged in, redirect to login
    if (!isAuthenticated) {
      toast.info("Please log in to enroll in this course");
      navigate("/login/student", {
        state: { from: location.pathname },
      });
      return;
    }

    // If course has _id, check if it's free or paid
    if (course._id) {
      if (isFreeCourse) {
        // Free course - use API enrollment
        setIsEnrolling(true);
        try {
          const result = await enrollInCourse(course._id);
          setEnrollmentStatus({ enrolled: true, enrollment: result.enrollment });
          toast.success("Successfully enrolled in course!");
        } catch (error) {
          if (error.code === "ALREADY_ENROLLED") {
            setEnrollmentStatus({ enrolled: true, enrollment: error.enrollment });
            toast.info("You are already enrolled in this course");
          } else {
            toast.error(error.message || "Failed to enroll. Please try again.");
          }
        } finally {
          setIsEnrolling(false);
        }
      } else {
        // Paid course - redirect directly to Razorpay
        // Validate price before proceeding
        if (!priceValue || priceValue <= 0) {
          toast.error("This course price is not available. Please contact support.");
          return;
        }

        await redirectToRazorpay({
          courseId: course._id,
          amount: priceValue,
          currency: "AED",
          description: `Payment for ${title || course.title || "course"}`,
          userName: user?.fullName || "",
          userEmail: user?.email || "",
          userPhone: user?.phone || "",
          quantity: 1,
        });
      }
    } else {
      // For catalog courses without _id, check if it's free
      if (isFreeCourse) {
        // Free catalog course - show message that enrollment requires backend course
        toast.info("This free course requires backend setup. Please contact support.");
        return;
      }

      // Paid catalog course - redirect directly to Razorpay
      // Validate price before proceeding
      if (!priceValue || priceValue <= 0) {
        toast.error("This course price is not available. Please contact support.");
        return;
      }

      await redirectToRazorpay({
        amount: priceValue,
        currency: "AED",
        description: `Payment for ${title || "course"}`,
        userName: user?.fullName || "",
        userEmail: user?.email || "",
        userPhone: user?.phone || "",
        quantity: 1,
      });
    }
  };

  const handleContinueLearning = () => {
    if (course._id && enrollmentStatus?.enrollment) {
      // Navigate to course content page
      navigate(`/student/courses/${course._id}`, {
        state: { enrollment: enrollmentStatus.enrollment },
      });
    }
  };

  const handleDownloadBrochure = async () => {
    const brochureUrl = course.brochureUrl || course.metadata?.brochureUrl;

    if (!brochureUrl) {
      toast.info("Brochure not available for this course");
      return;
    }

    try {
      // Convert relative URL to absolute URL using getMediaUrl utility
      // This ensures the URL points to the correct backend server
      const absoluteUrl = getMediaUrl(brochureUrl);

      if (!absoluteUrl) {
        throw new Error("Invalid brochure URL");
      }

      console.log("[Brochure Download] Fetching from URL:", absoluteUrl);

      // Fetch the PDF file as arrayBuffer to preserve binary data
      const response = await fetch(absoluteUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch brochure: ${response.status} ${response.statusText}`);
      }

      // Validate Content-Type header to ensure it's a PDF
      const contentType = response.headers.get("Content-Type");
      if (contentType && !contentType.includes("application/pdf") && !contentType.includes("application/octet-stream")) {
        console.warn("[Brochure Download] Unexpected Content-Type:", contentType);
      }

      // Convert response to arrayBuffer first to preserve binary data
      const arrayBuffer = await response.arrayBuffer();

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("Received empty file");
      }

      console.log("[Brochure Download] Received file size:", arrayBuffer.byteLength, "bytes");

      // Create a blob with explicit PDF MIME type
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title.replace(/\s+/g, '-')}-Brochure.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      toast.success("Brochure download started");
    } catch (error) {
      console.error("[Brochure Download] Error:", error);
      console.error("[Brochure Download] Original URL:", brochureUrl);
      toast.error("Failed to download brochure. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title={`Digital AELA | ${title}`}
        description={summaryText}
        keywords={`${title}, Digital AELA course`}
        url={`https://digitalaela.com/courses/${slug}`}
      />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden pt-[140px] pb-10 md:pt-[150px] md:pb-12">
        <div className="absolute inset-0 bg-black" />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-6">
            {category && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-[#F5D26A]">
                {category}
              </span>
            )}
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {course._id && (
              <p className="text-xs text-gray-500 font-mono mt-1">
                Course ID: {course._id}
              </p>
            )}
            {subtitle && (
              <p className="max-w-2xl text-lg text-[#D4AF37] font-semibold mt-2">
                {subtitle}
              </p>
            )}
            <p className="max-w-2xl text-base text-gray-300 sm:text-lg mt-2">
              {summaryText}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              {duration && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 px-3 py-1.5">
                  <svg
                    className="h-4 w-4 text-[#D4AF37]"
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
                  {duration}
                </span>
              )}
              {format && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 px-3 py-1.5">
                  <svg
                    className="h-4 w-4 text-[#D4AF37]"
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
                  {format}
                </span>
              )}
              {difficulty && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 px-3 py-1.5">
                  <svg
                    className="h-4 w-4 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  {difficulty}
                </span>
              )}
              {language && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 px-3 py-1.5">
                  <svg
                    className="h-4 w-4 text-[#D4AF37]"
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
                  {language}
                </span>
              )}
              {isFreeCourse ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-green-400 font-semibold">
                  Free Course
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 px-3 py-1.5 text-[#F5D26A] font-semibold">
                    Fee: {priceDisplay}
                  </span>
                  {discountPrice && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-green-400 font-semibold">
                      Discount: AED {discountPrice}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {isCheckingEnrollment ? (
                <motion.button
                  disabled
                  className="inline-flex items-center justify-center rounded-full bg-gray-600 px-6 py-3 text-sm font-bold text-white cursor-not-allowed opacity-60">
                  Checking...
                </motion.button>
              ) : enrollmentStatus?.enrolled ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleContinueLearning}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-3 text-sm font-bold text-black shadow-[0_12px_30px_rgba(212,175,55,0.35)] transition hover:brightness-110">
                    <FaPlayCircle className="h-4 w-4" />
                    Continue Learning
                  </motion.button>
                  <motion.div
                    className="inline-flex items-center gap-2 rounded-full border border-[#27ae60]/40 bg-[#27ae60]/15 px-4 py-2 text-sm font-semibold text-[#27ae60]">
                    <FaCheckCircle className="h-4 w-4" />
                    Enrolled
                  </motion.div>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnroll}
                  disabled={(!isFreeCourse && priceValue <= 0) || isEnrolling}
                  className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-3 text-sm font-bold text-black shadow-[0_12px_30px_rgba(212,175,55,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  {isEnrolling
                    ? "Enrolling..."
                    : isFreeCourse
                      ? "Enroll for Free"
                      : priceValue > 0
                        ? "Enroll Now"
                        : "Connect for Pricing"}
                </motion.button>
              )}
              {(course.brochureUrl || course.metadata?.brochureUrl) && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadBrochure}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-6 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]">
                  <FaDownload className="h-4 w-4" />
                  Download Brochure
                </motion.button>
              )}
              {!isFreeCourse && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}>
                  <GiftButton
                    course={course}
                    className="inline-flex items-center justify-center rounded-full border border-[#F5D26A]/60 px-6 py-3 text-sm font-semibold text-[#F5D26A] hover:bg-[#D4AF37] hover:text-black"
                    size="md"
                    paymentPath="/gift/payment">
                    Gift this Course
                  </GiftButton>
                </div>
              )}
              {!isFreeCourse && priceValue <= 0 && (
                <a
                  href="https://wa.me/971502270625"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/40 px-6 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10">
                  Talk to our team
                </a>
              )}
            </div>
          </div>
          {(image || coverImage) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative mx-auto flex max-w-[420px] flex-1 justify-center">
              <div className="absolute inset-0 -translate-y-6 rounded-[32px] bg-gradient-to-br from-[#D4AF37]/30 via-transparent to-[#6A8BFF]/20 blur-2xl" />
              <img
                src={getMediaUrl(coverImage || image)}
                alt={title}
                loading="lazy"
                className="relative z-10 w-full rounded-[28px] border border-white/10 object-cover shadow-[0_28px_60px_rgba(0,0,0,0.55)]"
              />
            </motion.div>
          )}
        </div>
      </motion.section>

      <section className="bg-[#111111] py-12">
        <div className="layout-container">
          <div className="space-y-8">
            {/* Intro Video Section */}
            {introVideoUrl && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white font-display mb-4">
                  Course Introduction Video
                </h2>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-[#D4AF37]/20">
                  <video
                    src={getMediaUrl(introVideoUrl)}
                    controls
                    className="h-full w-full"
                    poster={getMediaUrl(coverImage || image)}
                    preload="metadata">
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold text-white font-display mb-4">
                Course Overview
              </h2>
              <p className="text-base text-gray-300 leading-relaxed">
                {summaryText}
              </p>
            </div>
            {features.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white font-display mb-4">
                  What you'll master
                </h3>
                <ul className="grid gap-3 text-sm text-gray-200 sm:grid-cols-2">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detailedSyllabus && (
              <div className="space-y-8 mt-12">
                {detailedSyllabus.courseTagline && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <p className="text-xl font-bold text-[#D4AF37] text-center mb-6 italic">
                      "{detailedSyllabus.courseTagline}"
                    </p>
                  </div>
                )}
                <div className="border-t border-[#D4AF37]/20 pt-8">
                  <h2 className="text-2xl font-bold text-white font-display mb-6">
                    🎯 Course Objective
                  </h2>
                  <p className="text-base text-gray-300 leading-relaxed mb-4">
                    {longDescription || description}
                  </p>
                  {detailedSyllabus.courseObjectives && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Course Objectives:</h3>
                      <ul className="grid gap-3 text-sm text-gray-200 sm:grid-cols-2">
                        {detailedSyllabus.courseObjectives.map((objective, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                            <span>✅ {objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2 mt-6">
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4">
                      <p className="text-sm text-gray-400 mb-1">Duration</p>
                      <p className="text-lg font-semibold text-[#F5D26A]">{duration}</p>
                    </div>
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4">
                      <p className="text-sm text-gray-400 mb-1">Mode</p>
                      <p className="text-lg font-semibold text-[#F5D26A]">{format}</p>
                    </div>
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4">
                      <p className="text-sm text-gray-400 mb-1">Language</p>
                      <p className="text-lg font-semibold text-[#F5D26A]">{detailedSyllabus.language}</p>
                    </div>
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4">
                      <p className="text-sm text-gray-400 mb-1">Structure</p>
                      <p className="text-lg font-semibold text-[#F5D26A]">{detailedSyllabus.structure}</p>
                    </div>
                    {detailedSyllabus.classFrequency && (
                      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4">
                        <p className="text-sm text-gray-400 mb-1">Class Frequency</p>
                        <p className="text-lg font-semibold text-[#F5D26A]">{detailedSyllabus.classFrequency}</p>
                      </div>
                    )}
                    {detailedSyllabus.classDuration && (
                      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4">
                        <p className="text-sm text-gray-400 mb-1">Class Duration</p>
                        <p className="text-lg font-semibold text-[#F5D26A]">{detailedSyllabus.classDuration}</p>
                      </div>
                    )}
                    {detailedSyllabus.assessment && (
                      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4">
                        <p className="text-sm text-gray-400 mb-1">Assessment</p>
                        <p className="text-lg font-semibold text-[#F5D26A]">{detailedSyllabus.assessment}</p>
                      </div>
                    )}
                    {detailedSyllabus.level && (
                      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4">
                        <p className="text-sm text-gray-400 mb-1">Level</p>
                        <p className="text-lg font-semibold text-[#F5D26A]">{detailedSyllabus.level}</p>
                      </div>
                    )}
                    {detailedSyllabus.certification && (
                      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4">
                        <p className="text-sm text-gray-400 mb-1">Certification</p>
                        <p className="text-lg font-semibold text-[#F5D26A]">{detailedSyllabus.certification}</p>
                      </div>
                    )}
                    {detailedSyllabus.trainer && (
                      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-4 md:col-span-2">
                        <p className="text-sm text-gray-400 mb-1">Trainer</p>
                        <p className="text-lg font-semibold text-[#F5D26A]">{detailedSyllabus.trainer}</p>
                      </div>
                    )}
                  </div>
                </div>

                {detailedSyllabus.courseVision && detailedSyllabus.courseVision.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🌟 Course Vision
                    </h2>
                    <p className="text-base text-gray-300 leading-relaxed mb-4">
                      By the end of this program, every learner will:
                    </p>
                    <ul className="space-y-3">
                      {detailedSyllabus.courseVision.map((vision, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span className="text-sm text-gray-200">✅ {vision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.phases && detailedSyllabus.phases.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🧭 Course Structure Overview
                    </h2>
                    <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-[#D4AF37]/10">
                            <tr>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-[#F5D26A]">Phase</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-[#F5D26A]">Duration</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-[#F5D26A]">Focus Area</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-[#F5D26A]">Key Outcome</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#D4AF37]/10">
                            {detailedSyllabus.phases.map((phase, idx) => (
                              <tr key={idx} className="hover:bg-[#D4AF37]/5 transition-colors">
                                <td className="px-6 py-4 text-sm font-semibold text-white">Phase {phase.phase}</td>
                                <td className="px-6 py-4 text-sm text-gray-300">{phase.duration}</td>
                                <td className="px-6 py-4 text-sm text-gray-300">{phase.focusArea}</td>
                                <td className="px-6 py-4 text-sm text-gray-300">{phase.keyOutcome}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {detailedSyllabus.courseOverview && detailedSyllabus.courseOverview.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      👩‍🏫 Course Overview
                    </h2>
                    <p className="text-base text-gray-300 leading-relaxed mb-4">
                      This course adapts to the learner's background and goals:
                    </p>
                    <ul className="space-y-3">
                      {detailedSyllabus.courseOverview.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span className="text-sm text-gray-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-[#D4AF37]/20 pt-8">
                  <h2 className="text-2xl font-bold text-white font-display mb-6">
                    📚 Module-Wise Syllabus
                  </h2>
                  <div className="space-y-6">
                    {detailedSyllabus.modules.map((module, index) => (
                      <div
                        key={module.number}
                        className="rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                            <span className="text-[#F5D26A] font-bold text-lg">{module.number}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white font-display mb-1">
                              MODULE {module.number}: {module.title}
                            </h3>
                            <p className="text-sm text-[#D4AF37] font-semibold">{module.days || module.duration}</p>
                            {module.objective && (
                              <p className="text-sm text-gray-400 mt-2 italic">Objective: {module.objective}</p>
                            )}
                            {module.goal && (
                              <p className="text-sm text-gray-400 mt-2 italic">Goal: {module.goal}</p>
                            )}
                            {module.note && (
                              <p className="text-sm text-[#F5D26A] mt-2 font-semibold">{module.note}</p>
                            )}
                          </div>
                        </div>

                        <div className="ml-16 space-y-4">
                          <div>
                            <h4 className="text-base font-semibold text-white mb-2">Topics:</h4>
                            <ul className="space-y-1 text-sm text-gray-300">
                              {module.topics.map((topic, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-[#D4AF37] mt-1.5">●</span>
                                  <span>{topic}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-base font-semibold text-white mb-2">Activities:</h4>
                            <ul className="space-y-1 text-sm text-gray-300">
                              {module.activities.map((activity, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-[#D4AF37] mt-1.5">🎯</span>
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {module.homePractice && module.homePractice.length > 0 && (
                            <div>
                              <h4 className="text-base font-semibold text-white mb-2">Home Practice:</h4>
                              <ul className="space-y-1 text-sm text-gray-300">
                                {module.homePractice.map((practice, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-[#D4AF37] mt-1.5">●</span>
                                    <span>{practice}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {module.tipsAndTricks && module.tipsAndTricks.length > 0 && (
                            <div>
                              <h4 className="text-base font-semibold text-white mb-2">Tips & Tricks:</h4>
                              <ul className="space-y-1 text-sm text-gray-300">
                                {module.tipsAndTricks.map((tip, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-[#D4AF37] mt-1.5">💡</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {module.confidenceBuilding && module.confidenceBuilding.length > 0 && (
                            <div>
                              <h4 className="text-base font-semibold text-white mb-2">Confidence Building:</h4>
                              <ul className="space-y-1 text-sm text-gray-300">
                                {module.confidenceBuilding.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-[#D4AF37] mt-1.5">🌟</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {module.proTips && module.proTips.length > 0 && (
                            <div className="mt-4 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                              <p className="text-sm text-gray-400 mb-2 font-semibold">Pro Tips:</p>
                              {module.proTips.map((tip, idx) => (
                                <p key={idx} className="text-sm text-[#F5D26A] italic">{tip}</p>
                              ))}
                            </div>
                          )}
                          {module.bonusTip && (
                            <div className="mt-4 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                              <p className="text-sm text-gray-400 mb-1 font-semibold">Bonus Tip:</p>
                              <p className="text-sm text-[#F5D26A] italic">{module.bonusTip}</p>
                            </div>
                          )}
                          {module.bonusAddOns && module.bonusAddOns.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-base font-semibold text-white mb-2">Bonus Add-ons:</h4>
                              <ul className="space-y-1 text-sm text-gray-300">
                                {module.bonusAddOns.map((addon, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-[#D4AF37] mt-1.5">●</span>
                                    <span>{addon}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {module.outcome && (
                            <div className="mt-4 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                              <p className="text-sm text-gray-400 mb-1">Outcome:</p>
                              <p className="text-base font-semibold text-[#F5D26A]">👉 {module.outcome}</p>
                            </div>
                          )}
                          {module.certification && (
                            <div className="mt-4 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                              <p className="text-base font-semibold text-[#F5D26A]">{module.certification}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {detailedSyllabus.bonusModules && detailedSyllabus.bonusModules.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🎬 Bonus Practical Modules
                    </h2>
                    <ul className="grid gap-3 text-sm text-gray-200 sm:grid-cols-2">
                      {detailedSyllabus.bonusModules.map((module, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span>{module}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.toolsAndResources && detailedSyllabus.toolsAndResources.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🧠 Tools & Resources Provided
                    </h2>
                    <ul className="space-y-3">
                      {detailedSyllabus.toolsAndResources.map((resource, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span className="text-sm text-gray-200">{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.finalCertification && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🏅 Final Certification
                    </h2>
                    <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6">
                      <h3 className="text-xl font-bold text-[#F5D26A] mb-4">
                        🎓 {detailedSyllabus.finalCertification.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4">Includes:</p>
                      <ul className="space-y-2">
                        {detailedSyllabus.finalCertification.includes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                            <span className="text-[#D4AF37] mt-1.5">●</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {detailedSyllabus.careerPaths && detailedSyllabus.careerPaths.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      💡 Expected Career Paths
                    </h2>
                    <p className="text-base text-gray-300 leading-relaxed mb-4">
                      After completion, participants can work as:
                    </p>
                    <ul className="grid gap-3 text-sm text-gray-200 sm:grid-cols-2">
                      {detailedSyllabus.careerPaths.map((path, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span>✅ {path}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.realLifeProjects && detailedSyllabus.realLifeProjects.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      📈 Real-Life Projects
                    </h2>
                    <ul className="space-y-3">
                      {detailedSyllabus.realLifeProjects.map((project, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span className="text-sm text-gray-200">{project}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.teachingApproach && detailedSyllabus.teachingApproach.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🧭 Teaching Approach
                    </h2>
                    <ul className="space-y-3">
                      {detailedSyllabus.teachingApproach.map((approach, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span className="text-sm text-gray-200">{approach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.specialAddOnModules && detailedSyllabus.specialAddOnModules.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🧩 Special Add-On Modules
                    </h2>
                    <ul className="grid gap-3 text-sm text-gray-200 sm:grid-cols-2">
                      {detailedSyllabus.specialAddOnModules.map((module, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span>{module}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.dailyWeeklyRoutines && detailedSyllabus.dailyWeeklyRoutines.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      📈 Daily & Weekly Routines
                    </h2>
                    {typeof detailedSyllabus.dailyWeeklyRoutines[0] === 'string' ? (
                      <ul className="space-y-3">
                        {detailedSyllabus.dailyWeeklyRoutines.map((routine, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                            <span className="text-sm text-gray-200">{routine}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-[#D4AF37]/10">
                              <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[#F5D26A]">Type</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[#F5D26A]">Activity</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-[#F5D26A]">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D4AF37]/10">
                              {detailedSyllabus.dailyWeeklyRoutines.map((routine, idx) => (
                                <tr key={idx} className="hover:bg-[#D4AF37]/5 transition-colors">
                                  <td className="px-6 py-4 text-sm font-semibold text-white">{routine.type}</td>
                                  <td className="px-6 py-4 text-sm text-gray-300">{routine.activity}</td>
                                  <td className="px-6 py-4 text-sm text-gray-300">{routine.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {detailedSyllabus.finalOutcomes && detailedSyllabus.finalOutcomes.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🏅 Final Outcomes
                    </h2>
                    <p className="text-base text-gray-300 leading-relaxed mb-4">
                      By the end of the course, learners will be able to:
                    </p>
                    <ul className="space-y-3">
                      {detailedSyllabus.finalOutcomes.map((outcome, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span className="text-sm text-gray-200">✅ {outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.bonusTools && detailedSyllabus.bonusTools.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🧠 Bonus Tools
                    </h2>
                    <ul className="space-y-3">
                      {detailedSyllabus.bonusTools.map((tool, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span className="text-sm text-gray-200">{tool}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.finalOutput && detailedSyllabus.finalOutput.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🎯 Final Output
                    </h2>
                    <p className="text-base text-gray-300 leading-relaxed mb-4">
                      After completing the course, you'll:
                    </p>
                    <ul className="space-y-3">
                      {detailedSyllabus.finalOutput.map((output, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span className="text-sm text-gray-200">✅ {output}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.specialBonusModules && detailedSyllabus.specialBonusModules.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🏆 Special Bonus Modules
                    </h2>
                    <ul className="grid gap-3 text-sm text-gray-200 sm:grid-cols-2">
                      {detailedSyllabus.specialBonusModules.map((module, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span>{module}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.additionalHighlights && detailedSyllabus.additionalHighlights.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🧩 Additional Program Highlights
                    </h2>
                    <ul className="grid gap-3 text-sm text-gray-200 sm:grid-cols-2">
                      {detailedSyllabus.additionalHighlights.map((highlight, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span>✅ {highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailedSyllabus.dailyPracticeRoutine && detailedSyllabus.dailyPracticeRoutine.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      🏡 Daily Home Practice Routine
                    </h2>
                    <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-[#D4AF37]/10">
                            <tr>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-[#F5D26A]">Time</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-[#F5D26A]">Task</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#D4AF37]/10">
                            {detailedSyllabus.dailyPracticeRoutine.map((routine, idx) => (
                              <tr key={idx} className="hover:bg-[#D4AF37]/5 transition-colors">
                                <td className="px-6 py-4 text-sm font-semibold text-white">{routine.time}</td>
                                <td className="px-6 py-4 text-sm text-gray-300">{routine.task}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {detailedSyllabus.expectedOutcomes && detailedSyllabus.expectedOutcomes.length > 0 && (
                  <div className="border-t border-[#D4AF37]/20 pt-8">
                    <h2 className="text-2xl font-bold text-white font-display mb-6">
                      💬 Expected Outcome After 90 Days
                    </h2>
                    <ul className="space-y-3">
                      {detailedSyllabus.expectedOutcomes.map((outcome, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <span className="text-sm text-gray-200">✅ {outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Course Videos Section */}
            {course?._id && (
              <div className="border-t border-[#D4AF37]/20 pt-8">
                <CourseVideosList courseId={course._id} />
              </div>
            )}

            {/* Course Reviews Section */}
            {course?._id && (
              <div className="border-t border-[#D4AF37]/20 pt-8">
                <h2 className="text-2xl font-bold text-white font-display mb-6">
                  Reviews & Ratings
                </h2>
                <CourseReviews courseId={course._id} />
              </div>
            )}

            {/* Additional Course Information */}
            {(subtitle || category || difficulty || language || deliveryMode || lessonCount || learningOutcomes || requirements || syllabus || (tags && tags.length > 0)) && (
              <div className="border-t border-[#D4AF37]/20 pt-8 space-y-6">
                {subtitle && (
                  <div>
                    <h3 className="text-xl font-bold text-white font-display mb-3">About This Course</h3>
                    <p className="text-base text-gray-300 leading-relaxed">{subtitle}</p>
                  </div>
                )}

                {(category || difficulty || language || deliveryMode || lessonCount) && (
                  <div>
                    <h3 className="text-xl font-bold text-white font-display mb-4">Course Details</h3>
                    <div className="grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
                      {category && (
                        <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <div>
                            <span className="text-gray-400">Category:</span> <span className="text-white">{category}</span>
                          </div>
                        </div>
                      )}
                      {difficulty && (
                        <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <div>
                            <span className="text-gray-400">Difficulty:</span> <span className="text-white">{difficulty}</span>
                          </div>
                        </div>
                      )}
                      {language && (
                        <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <div>
                            <span className="text-gray-400">Language:</span> <span className="text-white">{language}</span>
                          </div>
                        </div>
                      )}
                      {deliveryMode && (
                        <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <div>
                            <span className="text-gray-400">Delivery Mode:</span> <span className="text-white">{deliveryMode}</span>
                          </div>
                        </div>
                      )}
                      {lessonCount && (
                        <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#D4AF37]" />
                          <div>
                            <span className="text-gray-400">Lessons:</span> <span className="text-white">{lessonCount}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {learningOutcomes && (
                  <div>
                    <h3 className="text-xl font-bold text-white font-display mb-4">Learning Outcomes</h3>
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                      <p className="text-sm text-gray-200 whitespace-pre-line">{learningOutcomes}</p>
                    </div>
                  </div>
                )}

                {requirements && (
                  <div>
                    <h3 className="text-xl font-bold text-white font-display mb-4">Requirements</h3>
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                      <p className="text-sm text-gray-200 whitespace-pre-line">{requirements}</p>
                    </div>
                  </div>
                )}

                {syllabus && (
                  <div>
                    <h3 className="text-xl font-bold text-white font-display mb-4">Syllabus</h3>
                    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] px-4 py-3">
                      <p className="text-sm text-gray-200 whitespace-pre-line">{syllabus}</p>
                    </div>
                  </div>
                )}

                {tags && Array.isArray(tags) && tags.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white font-display mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;

