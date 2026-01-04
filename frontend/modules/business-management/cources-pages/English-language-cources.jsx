import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import GiftButton from "../common/GiftButton";
import { buildCoursePaymentLink } from "../utils/paymentLinks";
import { useAuth } from "../../../src/contexts/AuthContext";
import { redirectToRazorpay } from "../utils/directRazorpayPayment";
import { redirectToCustomCoursePayment } from "../utils/customPaymentRedirect";
import { fetchPublishedCourses } from "../../../src/services/api/courses";
import TranslatedText from "../../../src/components/TranslatedText";
import { getMediaUrl } from "../../../src/utils/mediaUrl";
import LazyImage from "../../../src/components/LazyImage";
import { formatCurrency } from "../../../src/utils/currencyUtils";

const EnglishLanguageCourses = () => {
  // WhatsApp integration
  const whatsappNumber = "+971502270625";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in English Language courses." // WhatsApp message - can stay in English
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [englishCourses, setEnglishCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const response = await fetchPublishedCourses();

        if (!response || !response.courses) {
          console.warn("No courses data received from API");
          setEnglishCourses([]);
          return;
        }

        // Filter courses by category "English Language" (case-insensitive)
        const filteredCourses = (response.courses || [])
          .filter((course) => {
            const category = course.category || course.metadata?.category || "";
            return category.toLowerCase() === "english language";
          })
          .map((course) => ({
            ...course,
            id: course._id,
            slug: course._id,
            title: course.title || "Untitled Course", // Dynamic content from API
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
            rawPrice: course.price, // Store original numeric price
            price:
              course.price === 0
                ? "Free"
                : course.price
                ? formatCurrency(course.price)
                : "On Request", // Price formatting
            duration: course.duration
              ? `${course.duration} hours`
              : course.metadata?.duration || "",
            format:
              course.metadata?.deliveryMode ||
              course.deliveryMode ||
              course.format ||
              "",
            features: course.metadata?.tags || course.tags || [],
          }));

        setEnglishCourses(filteredCourses);
      } catch (error) {
        console.error("Failed to load courses:", error);
        setEnglishCourses([]);
        toast.error("Failed to load courses. Please try refreshing the page."); // Error message
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const augmentCourse = (course) => ({
    ...course,
    category: "English Language",
    origin: "english-courses",
  });
  const handleBuyCourse = async (course) => {
    const payload = augmentCourse(course);

    // Check if course is free
    // Prioritize rawPrice lookup
    const priceValue =
      course.rawPrice !== undefined && course.rawPrice !== null
        ? parseFloat(course.rawPrice) || 0
        : typeof course.price === "number"
        ? course.price
        : typeof course.price === "string" &&
          course.price.toLowerCase() === "free"
        ? 0
        : typeof course.price === "string" && course.price.includes("Free")
        ? 0
        : parseFloat(course.price) || 0;

    const isFreeCourse =
      priceValue === 0 || course.price === 0 || course.price === "Free";

    if (isFreeCourse) {
      // Free course - navigate to course detail page for enrollment
      if (course._id) {
        navigate(`/courses/id/${course._id}`, {
          state: { course: payload },
        });
      } else if (course.slug) {
        navigate(`/courses/${course.slug}`, {
          state: { course: payload },
        });
      } else {
        toast.info(
          "Please view the course details to enroll in this free course."
        ); // Toast message
        handleViewCourse(course);
      }
    } else {
      // Paid course - redirect to custom payment page first
      redirectToCustomCoursePayment(course);
    }
  };

  const handleViewCourse = (course) => {
    const payload = augmentCourse(course);
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

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="English Language Courses | Digital AELA - Basic, Intermediate, Advanced English, IELTS, TOEFL Training"
        description="Comprehensive English Language Courses by Digital AELA. Learn Basic, Intermediate, Advanced English, Personalized Speaking, Kids English, IELTS & TOEFL Preparation, NCERT English Literature, and English Teacher Training. Online courses for India, Pakistan, Bangladesh, Nepal, and Gulf countries."
        keywords="English courses online, Basic English course, Intermediate English, Advanced English, IELTS preparation, TOEFL training, English speaking course, English for kids, NCERT English, English teacher training, English courses India, Pakistan, Bangladesh, Nepal, Gulf countries"
        url="https://digitalaela.com/courses/english-language"
      />
      {/* Hero Section */}
      <motion.section className="relative overflow-hidden bg-black pt-[90px] pb-20 md:pt-[140px] md:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[10%] h-104 w-104 rounded-full bg-[#D4AF37]/15 blur-[180px]" />
          <div className="absolute bottom-[-25%] right-[12%] h-112 w-md rounded-full bg-[#6A8BFF]/12 blur-[200px]" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-6 text-left">
            <motion.span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-black shadow-[0_12px_30px_rgba(212,175,55,0.25)]">
              <TranslatedText>English Language Mastery</TranslatedText>
            </motion.span>
            <motion.h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              <TranslatedText>Master English</TranslatedText>
            </motion.h1>
            <motion.h2 className="bg-linear-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl">
              <TranslatedText>From Basics to Fluency</TranslatedText>
            </motion.h2>
            <motion.p className="max-w-xl text-sm text-gray-300 sm:text-base lg:text-lg">
              <TranslatedText>
                Comprehensive English language courses from beginner to advanced
                levels. Learn grammar, vocabulary, speaking, and writing skills
                with expert guidance and personalized support.
              </TranslatedText>
            </motion.p>
            <motion.div className="flex flex-col gap-4 sm:flex-row">
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-8 py-3 text-sm font-bold text-black shadow-[0_12px_30px_rgba(212,175,55,0.35)] hover:brightness-110 sm:text-base">
                <TranslatedText>Enroll Now</TranslatedText>
              </motion.a>
              <motion.a
                href="#courses"
                className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/60 px-8 py-3 text-sm font-bold text-[#D4AF37] transition-colors duration-200 hover:bg-[#D4AF37] hover:text-black sm:text-base">
                <TranslatedText>View Courses</TranslatedText>
              </motion.a>
            </motion.div>
          </div>
          <motion.div className="relative mx-auto flex-1 max-w-[420px]">
            <div className="absolute inset-0 -translate-y-6 rounded-[36px] bg-gradient-to-br from-[#D4AF37]/35 via-transparent to-[#6A8BFF]/25 blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1200&auto=format&fit=crop&q=80"
              alt="Public speaking class in session"
              className="relative z-10 w-full rounded-[32px] border border-white/10 object-cover shadow-[0_28px_60px_rgba(0,0,0,0.55)]"
              loading="lazy"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-[#141414] relative">
        <div className="layout-container">
          <motion.div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Our English Language</TranslatedText>{" "}
              <span className="text-[#D4AF37]">
                <TranslatedText>Courses</TranslatedText>
              </span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              <TranslatedText>
                Comprehensive training programs from basic to advanced levels,
                including exam preparation and specialized courses
              </TranslatedText>
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-[#D4AF37] text-lg">
                <TranslatedText>Loading courses...</TranslatedText>
              </div>
            </div>
          )}

          {/* Courses Grid */}
          {!loading && englishCourses.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 mb-12">
              {englishCourses.map((course, index) => (
                <motion.div
                  key={course.slug}
                  className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_12px_rgba(212,175,55,0.18)] transition-all duration-300 group cursor-pointer flex flex-col h-full"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleViewCourse(course)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleViewCourse(course);
                    }
                  }}>
                  <div className="h-40 w-full overflow-hidden">
                    <LazyImage
                      src={
                        getMediaUrl(course.image) ||
                        "https://via.placeholder.com/300x200?text=Course"
                      }
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      fallbackSrc="https://via.placeholder.com/300x200?text=Course"
                    />
                  </div>
                  <div className="p-6 bg-linear-to-b from-[#141414] to-[#0a0a0a] flex flex-col h-full">
                    <div className="flex-shrink-0 mb-4">
                      <h3 className="text-lg md:text-xl font-semibold text-[#D4AF37] mb-2 font-display leading-tight group-hover:text-[#E5C158] transition-colors duration-300 line-clamp-2">
                        <TranslatedText>{course.title}</TranslatedText>
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-xs md:text-sm line-clamp-2">
                        <TranslatedText>{course.description}</TranslatedText>
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-[#D4AF37] flex-shrink-0"
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
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-[#D4AF37] flex-shrink-0"
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
                        {course.format}
                      </span>
                    </div>

                    {course.features && course.features.length > 0 && (
                      <div className="flex-shrink-0 border-t border-[#D4AF37]/15 pt-4 mb-4">
                        <p className="mb-3 text-[#D4AF37]/80 text-xs uppercase tracking-[0.25em]">
                          <TranslatedText>Key Highlights</TranslatedText>
                        </p>
                        <ul className="space-y-2 text-xs md:text-sm text-gray-300">
                          {course.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="h-[2px] w-2 rounded-full bg-[#D4AF37]/40 flex-shrink-0"></span>
                              <span className="line-clamp-1">
                                <TranslatedText>{feature}</TranslatedText>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex-shrink-0 flex flex-col gap-3 mt-auto">
                      <motion.button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleViewCourse(course);
                        }}
                        className="w-full inline-flex items-center justify-center rounded-full border border-[#D4AF37]/60 bg-transparent px-4 py-2.5 text-xs md:text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all duration-300">
                        <TranslatedText>See Full Course</TranslatedText>
                      </motion.button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <motion.button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleBuyCourse(course);
                          }}
                          className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs md:text-sm font-semibold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                          <TranslatedText>Buy Now</TranslatedText>
                        </motion.button>
                        <div
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}>
                          <GiftButton
                            course={course} // Pass course to GiftButton
                            className="inline-flex w-full items-center justify-center rounded-full border border-[#F5D26A]/60 px-4 text-xs md:text-sm font-semibold text-[#F5D26A] hover:bg-[#D4AF37] hover:text-black"
                            size="sm">
                            Gift
                          </GiftButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* No Courses Message */}
          {!loading && englishCourses.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-300 text-lg">
                <TranslatedText>
                  No English Language courses available yet.
                </TranslatedText>
              </p>
            </div>
          )}

          {/* CTA Button */}
          <motion.div className="flex justify-center">
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#E5C158] transition-colors duration-200">
              <TranslatedText>Get Started Today</TranslatedText>
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EnglishLanguageCourses;

