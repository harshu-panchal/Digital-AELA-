// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import GiftButton from "../common/GiftButton";
import { buildCoursePaymentLink } from "../utils/paymentLinks";
import { useAuth } from "../../../src/contexts/AuthContext";
import { redirectToRazorpay } from "../utils/directRazorpayPayment";
import { fetchPublishedCourses } from "../../../src/services/api/courses";
import TranslatedText from "../../../src/components/TranslatedText";
import { getMediaUrl } from "../../../src/utils/mediaUrl";

const CorporateTrainingCourses = () => {
  // WhatsApp integration
  const whatsappNumber = "+971502270625";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in Corporate Training programs for my organization."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [corporateTrainingCourses, setCorporateTrainingCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const response = await fetchPublishedCourses();
        
        if (!response || !response.courses) {
          console.warn("No courses data received from API");
          setCorporateTrainingCourses([]);
          return;
        }

        // Filter courses by category "Corporate Training" (case-insensitive)
        const filteredCourses = (response.courses || [])
          .filter((course) => {
            const category = course.category || course.metadata?.category || "";
            return category.toLowerCase() === "corporate training";
          })
          .map((course) => ({
            ...course,
            id: course._id,
            slug: course._id,
            title: course.title || "Untitled Course",
            description: course.description || course.metadata?.subtitle || course.subtitle || "",
            image: course.thumbnailUrl || course.thumbnail || course.image || course.coverImage || "",
            price: course.price === 0 ? "Free" : course.price ? `AED ${course.price}` : "On Request",
            duration: course.duration ? `${course.duration} hours` : course.metadata?.duration || "",
            format: course.metadata?.deliveryMode || course.deliveryMode || course.format || "",
            features: course.metadata?.tags || course.tags || [],
            isCustom: false, // Backend courses are not custom by default
          }));
        
        setCorporateTrainingCourses(filteredCourses);
      } catch (error) {
        console.error("Failed to load courses:", error);
        setCorporateTrainingCourses([]);
        toast.error("Failed to load courses. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const augmentCourse = (program) => ({
    ...program,
    category: "Corporate Training",
    origin: "corporate-training-courses",
  });

  const handleBuyCourse = async (program) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.info("Please log in to enroll in this course");
      navigate("/login/student");
      return;
    }

    const payload = augmentCourse(program);
    
    // Check if course is free
    const priceValue = typeof program.price === 'number' ? program.price : 
                      (typeof program.price === 'string' && program.price.toLowerCase() === 'free') ? 0 :
                      (typeof program.price === 'string' && program.price.includes('Free')) ? 0 :
                      parseFloat(program.price) || 0;
    const isFreeCourse = priceValue === 0 || program.price === 0 || program.price === "Free";
    
    if (isFreeCourse) {
      // Free course - navigate to course detail page for enrollment
      if (program._id) {
        navigate(`/courses/id/${program._id}`, {
          state: { course: payload },
        });
      } else if (program.slug) {
        navigate(`/courses/${program.slug}`, {
          state: { course: payload },
        });
      } else {
        toast.info("Please view the course details to enroll in this free course.");
        handleViewCourse(program);
      }
    } else {
      // Paid course - redirect directly to Razorpay
      await redirectToRazorpay({
        courseId: program._id || program.id || null,
        amount: priceValue,
        currency: "AED",
        description: `Payment for ${program.title || "course"}`,
        userName: user?.fullName || "",
        userEmail: user?.email || "",
        userPhone: user?.phone || "",
        quantity: 1,
      });
    }
  };

  const handleViewCourse = (program) => {
    const payload = augmentCourse(program);
    // If course has _id (backend course), use ID route, otherwise use slug (catalog course)
    if (program._id) {
      navigate(`/courses/id/${program._id}`, {
        state: {
          course: payload,
        },
      });
    } else if (program.slug) {
      navigate(`/courses/${program.slug}`, {
        state: {
          course: payload,
        },
      });
    } else {
      console.error("Course missing both _id and slug:", program);
    }
  };

  // Benefits - titles and descriptions will be translated in JSX
  const benefits = [
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
  ];

  // Icon component renderer
  const renderIcon = (iconName) => {
    const iconClass = "w-12 h-12 text-[#D4AF37]";
    switch (iconName) {
      case "clock":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "video":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case "briefcase":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "teacher":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case "handshake":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case "globe":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Corporate Training Courses | Digital AELA - Public Speaking, Leadership, Communication Training"
        description="Professional Corporate Training Programs by Digital AELA. Public Speaking, Communication & Accent Training, Leadership Skills, Host/Anchor Training, and Custom Training Solutions for India, Pakistan, Bangladesh, Nepal, and Gulf countries."
        keywords="Corporate Training, Public Speaking course, Leadership Training, Communication Training, Accent Training, Host Training, Corporate Training India, Pakistan, Bangladesh, Nepal, Gulf countries, Business Training, Professional Development"
        url="https://digitalaela.com/courses/corporate-training"
      />
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden bg-black pt-[120px] pb-20 md:pt-[140px] md:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-[12%] h-104 w-104 rounded-full bg-[#D4AF37]/18 blur-[180px]" />
          <div className="absolute bottom-[-25%] right-[20%] h-112 w-md rounded-full bg-[#6A8BFF]/12 blur-[220px]" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-6 text-left">
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-black shadow-[0_12px_30px_rgba(212,175,55,0.25)]">
              <TranslatedText>Corporate Training Excellence</TranslatedText>
            </motion.span>
            <motion.h1
              className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              <TranslatedText>Empower Your Team with</TranslatedText>
            </motion.h1>
            <motion.h2
              className="bg-linear-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl">
              <TranslatedText>Professional English</TranslatedText>
            </motion.h2>
            <motion.p
              className="max-w-xl text-sm text-gray-300 sm:text-base lg:text-lg">
              <TranslatedText>Transform your workforce with professional English training programs including Public Speaking, Communication & Accent Training, Leadership Skills, and Host/Anchor Training. Available across South Asia and Gulf regions.</TranslatedText>
            </motion.p>
            <motion.div
              className="flex flex-col gap-4 sm:flex-row">
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-8 py-3 text-sm font-bold text-black shadow-[0_12px_30px_rgba(212,175,55,0.35)] hover:brightness-110 sm:text-base">
                <TranslatedText>Request a Demo</TranslatedText>
              </motion.a>
              <motion.a
                href="#programs"
                className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/60 px-8 py-3 text-sm font-bold text-[#D4AF37] transition-colors duration-200 hover:bg-[#D4AF37] hover:text-black sm:text-base">
                <TranslatedText>View Corporate Programs</TranslatedText>
              </motion.a>
            </motion.div>
          </div>
          <motion.div
            className="relative mx-auto flex-1 max-w-[420px]">
            <div className="absolute inset-0 -translate-y-6 rounded-[36px] bg-linear-to-br from-[#D4AF37]/35 via-transparent to-[#6A8BFF]/25 blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80"
              alt="Corporate training workshop in progress"
              className="relative z-10 w-full rounded-[32px] border border-white/10 object-cover shadow-[0_28px_60px_rgba(0,0,0,0.55)]"
              loading="lazy"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Training Programs Section */}
      <motion.section
        id="programs"
        className="py-20 bg-black">
        <div className="layout-container">
          <motion.div
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Our Training</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Programs</TranslatedText></span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Professional training programs in Public Speaking, Communication &
              Accent Training, Leadership Skills, and Host/Anchor Training for
              teams across South Asia and Gulf regions
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-[#D4AF37] text-lg"><TranslatedText>Loading courses...</TranslatedText></div>
            </div>
          )}

          {/* Programs Grid */}
          {!loading && corporateTrainingCourses.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {corporateTrainingCourses
                .filter((program) => !program.isCustom)
                .map((program, index) => (
                <motion.div
                  key={program.slug}
                  className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_12px_rgba(212,175,55,0.18)] transition-all duration-300 group cursor-pointer flex flex-col h-full"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleViewCourse(program)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleViewCourse(program);
                    }
                  }}>
                  <div className="h-40 w-full overflow-hidden">
                    <img
                      src={getMediaUrl(program.image) || "https://via.placeholder.com/300x200?text=Course"}
                      alt={program.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 bg-linear-to-b from-[#141414] to-[#0a0a0a] flex flex-col h-full">
                    <div className="flex-shrink-0 mb-4">
                      <h3 className="text-lg md:text-xl font-semibold text-[#D4AF37] mb-2 font-display leading-tight group-hover:text-[#E5C158] transition-colors duration-300 line-clamp-2">
                        <TranslatedText>{program.title}</TranslatedText>
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-xs md:text-sm line-clamp-2">
                        <TranslatedText>{program.description}</TranslatedText>
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
                        {program.duration}
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
                        {program.format}
                      </span>
                    </div>

                    {program.features && program.features.length > 0 && (
                      <div className="flex-shrink-0 border-t border-[#D4AF37]/15 pt-4 mb-4">
                        <p className="mb-3 text-[#D4AF37]/80 text-[11px] uppercase tracking-[0.25em]">
                          <TranslatedText>Key Highlights</TranslatedText>
                        </p>
                        <ul className="space-y-2 text-xs md:text-sm text-gray-300">
                          {program.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="h-[2px] w-2 rounded-full bg-[#D4AF37]/40 flex-shrink-0"></span>
                              <span className="line-clamp-1"><TranslatedText>{feature}</TranslatedText></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex-shrink-0 flex flex-col gap-3 mt-auto">
                      <div className="flex items-center justify-between text-sm text-gray-300">
                        <span><TranslatedText>Program Fee</TranslatedText></span>
                        <span className="text-lg font-semibold text-[#F5D26A]">
                          {program.price || <TranslatedText>On Request</TranslatedText>}
                        </span>
                      </div>
                      <motion.button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleViewCourse(program);
                        }}
                        className="w-full inline-flex items-center justify-center rounded-full border border-[#D4AF37]/60 bg-transparent px-4 py-2.5 text-xs md:text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all duration-300">
                        <TranslatedText>See Full Course</TranslatedText>
                      </motion.button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <motion.button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleBuyCourse(program);
                          }}
                          className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs md:text-sm font-semibold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                          <TranslatedText>Buy Now</TranslatedText>
                        </motion.button>
                        <div
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}>
                          <GiftButton
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
          {!loading && corporateTrainingCourses.filter((p) => !p.isCustom).length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-300 text-lg"><TranslatedText>No Corporate Training courses available yet.</TranslatedText></p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Why Choose Corporate Training Section */}
      <motion.section
        className="py-20 bg-[#141414]">
        <div className="layout-container">
          <motion.div
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              <TranslatedText>Why Choose</TranslatedText> <span className="text-[#D4AF37]">Digital AELA</span>?
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
                className="bg-[#1a1a1a] rounded-xl p-8 border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  {renderIcon(benefit.icon)}
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 font-display">
                  <TranslatedText>{benefit.title}</TranslatedText>
                </h3>

                {/* Description */}
                <p className="text-gray-300 leading-relaxed">
                  <TranslatedText>{benefit.description}</TranslatedText>
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Training Methodology Section */}
      <motion.section
        className="py-20 bg-[#141414]">
        <div className="layout-container">
          <div className="auto-grid-sm lg:grid-cols-2 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <motion.div>
              {/* Badge */}
              <div className="mb-4">
                <span className="inline-block border-2 border-[#D4AF37] text-white px-4 py-2 rounded-lg text-sm font-semibold font-display">
                  <TranslatedText>Our Methodology</TranslatedText>
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display tracking-tight leading-none">
                <TranslatedText>Proven Training</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Approach</TranslatedText></span>
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                <TranslatedText>Our comprehensive training methodology combines interactive learning, real-world scenarios, and continuous assessment to ensure maximum impact and measurable results for your team.</TranslatedText>
              </p>

              {/* Methodology Points */}
              <div className="space-y-4">
                {[
                  {
                    title: "Needs Assessment",
                    description:
                      "Comprehensive evaluation of your team's current proficiency and business requirements.",
                  },
                  {
                    title: "Customized Curriculum",
                    description:
                      "Tailored content aligned with your industry, job roles, and organizational goals.",
                  },
                  {
                    title: "Interactive Learning",
                    description:
                      "Engaging sessions with role-plays, case studies, and practical exercises.",
                  },
                  {
                    title: "Progress Monitoring",
                    description:
                      "Regular assessments and detailed reports to track improvement and ROI.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-[#D4AF37]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 font-display">
                        <TranslatedText>{item.title}</TranslatedText>
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        <TranslatedText>{item.description}</TranslatedText>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Visual/Stats */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { number: "500+", label: "Companies Trained" },
                { number: "10,000+", label: "Professionals Certified" },
                { number: "95%", label: "Satisfaction Rate" },
                { number: "50+", label: "Industry Sectors" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/20 text-center">
                  <span className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2 block font-display">
                    {stat.number}
                  </span>
                  <p className="text-sm text-gray-300 font-normal">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Custom Training Request Section */}
      <motion.section
        className="py-20 bg-[#0b0b0b]">
        <div className="layout-container">
          {corporateTrainingCourses
            .filter((program) => program.isCustom)
            .length > 0 && corporateTrainingCourses
            .filter((program) => program.isCustom)
            .map((program, index) => (
              <motion.div
                key={program.slug}
                className="bg-[#0a0a0a] rounded-2xl overflow-hidden border-2 border-[#D4AF37] hover:shadow-[0_0_16px_rgba(212,175,55,0.22)] transition-all duration-300 group mb-12">
                <div className="h-52 w-full overflow-hidden">
                  <img
                    src={getMediaUrl(program.image)}
                    alt={program.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-8 md:p-10 bg-linear-to-b from-[#141414] to-[#0a0a0a] space-y-6">
                  <div className="max-w-4xl mx-auto text-center space-y-4">
                    <h3 className="text-2xl md:text-3xl font-semibold text-[#D4AF37] font-display group-hover:text-[#E5C158] transition-colors duration-300">
                      <TranslatedText>{program.title}</TranslatedText>
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                      <TranslatedText>{program.description}</TranslatedText>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {program.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
                        <svg
                          className="w-4 h-4 text-[#D4AF37] shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span><TranslatedText>{feature}</TranslatedText></span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <motion.a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-linear-to-r from-[#D4AF37] to-[#E5C158] text-black px-10 py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#D4AF37]/50">
                      Request Custom Training Program
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}

          {corporateTrainingCourses.filter((program) => program.isCustom).length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">Custom training programs can be requested via WhatsApp.</p>
            </div>
          )}

          <motion.div
            className="flex justify-center">
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#E5C158] transition-colors duration-200">
              Get Customized Quote
            </motion.a>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default CorporateTrainingCourses;
