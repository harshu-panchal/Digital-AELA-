import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SEO from "../../../src/components/SEO";
import GiftButton from "../common/GiftButton";
import { buildCoursePaymentLink } from "../utils/paymentLinks";
import { englishCourses } from "../data/englishCourses";

const EnglishLanguageCourses = () => {
  // WhatsApp integration
  const whatsappNumber = "+971508185690";
  const whatsappMessage = encodeURIComponent(
    "Hello! I'm interested in English Language courses."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  const navigate = useNavigate();

  const augmentCourse = (course) => ({
    ...course,
    category: "English Language",
    origin: "english-courses",
  });

  const handleBuyCourse = (course) => {
    const payload = augmentCourse(course);
    navigate(buildCoursePaymentLink(payload), {
      state: {
        course: payload,
      },
    });
  };

  const handleViewCourse = (course) => {
    const payload = augmentCourse(course);
    navigate(`/courses/${course.slug}`, {
      state: {
        course: payload,
      },
    });
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
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden bg-black pt-[120px] pb-20 md:pt-[140px] md:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[10%] h-104 w-104 rounded-full bg-[#D4AF37]/15 blur-[180px]" />
          <div className="absolute bottom-[-25%] right-[12%] h-112 w-md rounded-full bg-[#6A8BFF]/12 blur-[200px]" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-6 text-left">
            <motion.span
              initial={{ y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-black shadow-[0_12px_30px_rgba(212,175,55,0.25)]">
              English Language Mastery
            </motion.span>
            <motion.h1
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Master English
            </motion.h1>
            <motion.h2
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
              className="bg-linear-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl">
              From Basics to Fluency
            </motion.h2>
            <motion.p
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
              className="max-w-xl text-sm text-gray-300 sm:text-base lg:text-lg">
              Comprehensive English language courses from beginner to advanced levels. Learn grammar, vocabulary, speaking, and writing skills with expert guidance and personalized support.
            </motion.p>
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
              className="flex flex-col gap-4 sm:flex-row">
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-8 py-3 text-sm font-bold text-black shadow-[0_12px_30px_rgba(212,175,55,0.35)] hover:brightness-110 sm:text-base">
                Enroll Now
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                href="#courses"
                className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/60 px-8 py-3 text-sm font-bold text-[#D4AF37] transition-colors duration-200 hover:bg-[#D4AF37] hover:text-black sm:text-base">
                View Courses
              </motion.a>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mx-auto flex-1 max-w-[420px]">
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
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight leading-none">
              Our English Language{" "}
              <span className="text-[#D4AF37]">Courses</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Comprehensive training programs from basic to advanced levels,
              including exam preparation and specialized courses
            </p>
          </motion.div>

          {/* Courses Grid */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 mb-12">
            {englishCourses.map((course, index) => (
              <motion.div
                key={course.slug}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -6 }}
                className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_12px_rgba(212,175,55,0.18)] transition-all duration-300 group cursor-pointer"
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
                  <img
                    src={course.image}
                    alt={course.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 bg-linear-to-b from-[#141414] to-[#0a0a0a] space-y-4">
                  {(course.slug === "basic-english" ||
                    course.slug === "advanced-english" ||
                    course.slug === "personalised-english-speaking") && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-red-200">
                      Trending
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#D4AF37] mb-2 font-display leading-tight group-hover:text-[#E5C158] transition-colors duration-300">
                      {course.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-xs md:text-sm">
                      {course.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-400">
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-[#D4AF37]"
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
                        className="w-4 h-4 text-[#D4AF37]"
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

                  <div className="border-t border-[#D4AF37]/15 pt-4">
                      <p className="mb-3 text-[#D4AF37]/80 text-xs uppercase tracking-[0.25em]">
                      Key Highlights
                    </p>
                    <ul className="space-y-2 text-xs md:text-sm text-gray-300">
                      {course.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <span className="h-[2px] w-2 rounded-full bg-[#D4AF37]/40"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>Course Fee</span>
                        <span className="text-lg font-semibold text-[#F5D26A]">
                          {course.price || "On Request"}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                      <motion.button
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleBuyCourse(course);
                        }}
                          className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs md:text-sm font-semibold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                          Buy Now
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

          {/* CTA Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            className="flex justify-center">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#E5C158] transition-colors duration-200">
              Get Started Today
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EnglishLanguageCourses;
