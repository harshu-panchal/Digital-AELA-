import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaDownload } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import GiftButton from "../common/GiftButton";
import { buildCoursePaymentLink, extractNumericPrice } from "../utils/paymentLinks";
import { getCourseBySlug } from "../data/courseCatalog";

const categoryPaths = {
  "English Language": "/courses/english-language",
  "Digital Marketing": "/courses/digital-marketing",
  "Corporate Training": "/courses/corporate-training",
};

const fallbackSummary =
  "Digital AELA courses blend live mentorship, guided cohorts, and project practice so you can apply skills immediately in your career.";

const CourseDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateCourse = location.state?.course;
  const catalogCourse = useMemo(() => getCourseBySlug(slug), [slug]);

  const course = useMemo(() => {
    if (!stateCourse && !catalogCourse) {
      return null;
    }
    return {
      ...catalogCourse,
      ...stateCourse,
    };
  }, [catalogCourse, stateCourse]);

  useEffect(() => {
    if (!course) {
      navigate("/courses", { replace: true });
    }
  }, [course, navigate]);

  if (!course) {
    return null;
  }

  const {
    title,
    category,
    description,
    longDescription,
    duration,
    format,
    price,
    priceLabel,
    image,
    features = [],
  } = course;

  const priceDisplay = priceLabel || price || "On Request";
  const priceValue = extractNumericPrice(priceDisplay);
  const categoryPath = categoryPaths[category] ?? "/courses";
  const summaryText = longDescription || description || fallbackSummary;

  const handleEnroll = () => {
    const payload = {
      ...course,
      price: priceDisplay,
    };
    navigate(buildCoursePaymentLink(payload), {
      state: {
        course: payload,
      },
    });
  };

  const handleDownloadBrochure = () => {
    // TODO: Replace with actual brochure URL or file path
    // For now, this opens a placeholder link
    // You can update this to point to actual PDF files or generate brochures dynamically
    const brochureUrl = `/brochures/${slug || course.id || 'course'}.pdf`;
    
    // Try to open/download the brochure
    const link = document.createElement('a');
    link.href = brochureUrl;
    link.download = `${title.replace(/\s+/g, '-')}-Brochure.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Fallback: If file doesn't exist, show a message or redirect to contact
    // You can uncomment this if you want to handle missing brochures differently
    // window.open(`mailto:info@digitalaela.com?subject=Request Brochure: ${title}`, '_blank');
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
            <Link
              to={categoryPath}
              className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200 text-sm font-semibold uppercase tracking-[0.3em]">
              ← Back to {category ?? "courses"}
            </Link>
            {category && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-[#F5D26A]">
                {category}
              </span>
            )}
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base text-gray-300 sm:text-lg">
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
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 px-3 py-1.5 text-[#F5D26A] font-semibold">
                Fee: {priceDisplay}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEnroll}
                disabled={priceValue <= 0}
                className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-6 py-3 text-sm font-bold text-black shadow-[0_12px_30px_rgba(212,175,55,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                {priceValue > 0 ? "Enroll Now" : "Connect for Pricing"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadBrochure}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-6 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]">
                <FaDownload className="h-4 w-4" />
                Download Brochure
              </motion.button>
              <div
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}>
                <GiftButton
                  className="inline-flex items-center justify-center rounded-full border border-[#F5D26A]/60 px-6 py-3 text-sm font-semibold text-[#F5D26A] hover:bg-[#D4AF37] hover:text-black"
                  size="md"
                  paymentPath="/gift/payment">
                  Gift this Course
                </GiftButton>
              </div>
              {priceValue <= 0 && (
                <a
                  href="https://wa.me/971508185690"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/40 px-6 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10">
                  Talk to our team
                </a>
              )}
            </div>
          </div>
          {image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative mx-auto flex max-w-[420px] flex-1 justify-center">
              <div className="absolute inset-0 -translate-y-6 rounded-[32px] bg-gradient-to-br from-[#D4AF37]/30 via-transparent to-[#6A8BFF]/20 blur-2xl" />
              <img
                src={image}
                alt={title}
                loading="lazy"
                className="relative z-10 w-full rounded-[28px] border border-white/10 object-cover shadow-[0_28px_60px_rgba(0,0,0,0.55)]"
              />
            </motion.div>
          )}
        </div>
      </motion.section>

      <section className="bg-[#111111] py-12">
        <div className="layout-container grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
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
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6 shadow-lg">
              <h3 className="text-lg font-bold text-white font-display mb-4">
                Program snapshot
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span>{duration ?? "Flexible"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Format</span>
                  <span>{format ?? "Guided cohort"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Investment</span>
                  <span className="text-[#F5D26A] font-semibold">
                    {priceDisplay}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#0a0a0a] p-6 shadow-lg">
              <h3 className="text-lg font-bold text-white font-display mb-4">
                Need more information?
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                Share this course with your decision makers or speak with our
                admissions specialists for scheduling, pricing and custom
                cohorts.
              </p>
              <div className="flex flex-col gap-3 text-sm">
                <a
                  href="mailto:info@digitalaela.com"
                  className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/40 px-4 py-2 text-[#D4AF37] transition hover:bg-[#D4AF37]/10">
                  info@digitalaela.com
                </a>
                <a
                  href="tel:+971508185690"
                  className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/40 px-4 py-2 text-[#D4AF37] transition hover:bg-[#D4AF37]/10">
                  050 818 5690
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;

