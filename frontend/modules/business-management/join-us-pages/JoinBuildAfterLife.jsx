import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaArrowRight,
  FaBook,
  FaDownload,
  FaStar,
  FaSpinner,
} from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import bookAdvancedEnglishImg from "../../../src/assets/images/books/advanced english.png";
import bookConfidenceBuildingImg from "../../../src/assets/images/books/confidence building.png";
import bookGrammarImg from "../../../src/assets/images/books/grammar.png";
import bookIELTSVocabularyImg from "../../../src/assets/images/books/IELTS vocabulary.png";
import bookSentenceStructureImg from "../../../src/assets/images/books/sentence structure.png";
import bookVocabularyImg from "../../../src/assets/images/books/vocabulary.png";
import GiftButton from "../common/GiftButton";
import { buildCoursePaymentLink } from "../utils/paymentLinks";
import { courseCatalog as allCourses } from "../data/courseCatalog";
import { fetchPublishedCourses } from "../../../src/services/api/courses";

const whatsappNumber = "+971508185690";

const bookLibrary = [
  {
    id: 1,
    title: "Advanced English Grammar",
    author: "Dr. Sarah Johnson",
    price: 499,
    originalPrice: 699,
    rating: 4.8,
    reviews: 125,
    category: "Grammar",
    badge: "Physical",
    image: bookGrammarImg,
    imageAlt: "Advanced English Grammar cover",
  },
  {
    id: 2,
    title: "Vocabulary Builder Pro",
    author: "Prof. Michael Chen",
    price: 299,
    originalPrice: 399,
    rating: 4.6,
    reviews: 89,
    category: "Vocabulary",
    badge: "E-Book",
    image: bookVocabularyImg,
    imageAlt: "Vocabulary Builder Pro cover",
  },
  {
    id: 3,
    title: "Self Help: Confidence Building",
    author: "Dr. Priya Sharma",
    price: 399,
    originalPrice: 599,
    rating: 4.9,
    reviews: 203,
    category: "Self Help",
    badge: "Physical",
    image: bookConfidenceBuildingImg,
    imageAlt: "Self Help Confidence Building cover",
  },
  {
    id: 4,
    title: "English Sentence Structures",
    author: "Dr. Robert Williams",
    price: 349,
    originalPrice: 499,
    rating: 4.7,
    reviews: 156,
    category: "Structures",
    badge: "E-Book",
    image: bookSentenceStructureImg,
    imageAlt: "English Sentence Structures cover",
  },
  {
    id: 5,
    title: "Business English Essentials",
    author: "Dr. Sarah Johnson",
    price: 449,
    originalPrice: 649,
    rating: 4.8,
    reviews: 178,
    category: "Business",
    badge: "Physical",
    image: bookAdvancedEnglishImg,
    imageAlt: "Business English Essentials cover",
  },
  {
    id: 6,
    title: "IELTS Vocabulary Master",
    author: "Prof. Michael Chen",
    price: 379,
    originalPrice: 549,
    rating: 4.9,
    reviews: 267,
    category: "IELTS",
    badge: "E-Book",
    image: bookIELTSVocabularyImg,
    imageAlt: "IELTS Vocabulary Master cover",
  },
];

const JoinBuildAfterLife = () => {
  const navigate = useNavigate();
  const [afterLifeCourses, setAfterLifeCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const response = await fetchPublishedCourses();
        const publishedCourses = (response.courses || []).map((course) => ({
          id: course._id,
          slug: course._id, // Use ID as slug for now
          title: course.title,
          description: course.description || course.metadata?.subtitle || "",
          image: course.thumbnailUrl || "",
          price: course.price ? `AED ${course.price}` : "On Request",
          duration: course.duration ? `${course.duration} hours` : "",
          format: course.metadata?.deliveryMode || "",
          features: course.metadata?.tags || [],
          highlights: course.metadata?.tags || [],
          category: course.category || "",
          difficulty: course.metadata?.difficulty || "",
        }));
        setAfterLifeCourses(publishedCourses);
      } catch (error) {
        console.error("Failed to load courses:", error);
        // Fallback to static courses if API fails
        setAfterLifeCourses(allCourses);
        toast.error("Failed to load courses. Showing cached data.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const handleBuyCourse = (course) => {
    const payload = {
      ...course,
      category: "Build Your After Life",
      origin: "join-build-after-life",
    };
    navigate(buildCoursePaymentLink(payload), {
      state: {
        course: payload,
      },
    });
  };

  const handleViewCourse = (course) => {
    const payload = {
      ...course,
      origin: "join-build-after-life",
    };
    navigate(`/courses/${course.slug || course.id}`, {
      state: {
        course: payload,
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-[#020409] text-white">
      <SEO
        title="Build Your After Life | All Courses & Books | Digital AELA"
        description="Explore every Digital AELA course track and book collection in one immersive space. Plan your After Life journey with curated learning paths and premium resources."
        keywords="Digital AELA courses, Digital AELA books, Build Your After Life, corporate training, digital marketing, English language courses"
        url="https://digitalaela.com/join-us/after-life"
      />

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/3 h-72 w-full max-w-lg -translate-x-1/2 rounded-full bg-[#F5D26A]/15 blur-3xl" />
        <div className="absolute top-1/3 left-0 hidden h-80 w-full max-w-xl -translate-x-1/2 rounded-full bg-[#103350]/40 blur-[110px] md:block" />
      </div>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-32 pb-20 sm:pt-36">
          <div className="layout-container">
            <div className="mx-auto max-w-3xl text-center">
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#F5D26A]">
                Build Your After Life
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                Craft lifelong learning hubs powered by{" "}
                <span className="text-[#F5D26A]">Digital AELA courses & books</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                className="mt-6 h-2 bg-linear-to-r from-transparent via-[#F5D26A]/40 to-transparent rounded-full" />
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="py-12 sm:py-16">
          <div className="layout-container">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-2xl font-semibold text-white sm:text-3xl">
                Explore the complete Digital AELA course catalogue
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                className="mt-4 text-base text-slate-300/80">
                From foundational English to performance marketing and enterprise leadership, build your After Life centre with proven programmes across every learner need.
              </motion.p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
              </div>
            ) : (
              <div className="auto-grid-md lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {afterLifeCourses.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-400">No published courses available yet.</p>
                  </div>
                ) : (
                  afterLifeCourses.map((course, index) => {
                const highlights = course.features ?? course.highlights ?? [];
                const isTrending = [
                  "basic-english",
                  "advanced-english",
                  "personalised-english-speaking",
                  "interview-preparation",
                  "public-speaking-stage-confidence",
                ].includes(course.slug);

                return (
                  <motion.div
                    key={course.slug ?? course.title}
                    initial={{ y: 40, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.25,
                      delay: index * 0.05,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    whileHover={{ y: -6 }}
                    className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_10px_rgba(212,175,55,0.18)] transition-all duration-300 group cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleViewCourse(course)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleViewCourse(course);
                      }
                    }}>
                    <div className="h-44 w-full overflow-hidden">
                      <img
                        src={course.image}
                        alt={course.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 bg-linear-to-b from-[#141414] to-[#0a0a0a] space-y-4">
                      {isTrending && (
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
                        {course.duration && (
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
                        )}
                        {course.format && (
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
                        )}
                      </div>

                      <div className="border-t border-[#D4AF37]/15 pt-4">
                        <p className="mb-3 text-[#D4AF37]/80 text-xs uppercase tracking-[0.25em]">
                          Key Highlights
                        </p>
                        <ul className="space-y-2 text-xs md:text-sm text-gray-300">
                          {highlights.map((feature) => (
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

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleViewCourse(course);
                        }}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5D26A] transition hover:text-[#FFE28A]">
                        Explore course
                        <FaArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                  );
                })
                )}
              </div>
            )}
          </div>
        </section>

        {/* Books */}
        <section className="relative overflow-hidden py-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#0C1328]/50 via-transparent to-[#020409]" />
          <div className="layout-container relative">
            <div className="flex flex-col gap-6 pb-8 text-center md:flex-row md:items-end md:justify-between md:text-left">
              <div className="max-w-xl">
                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="text-2xl font-semibold text-white sm:text-3xl">
                  Curated bookshelf to fuel every learner
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mt-3 text-base text-slate-300/80">
                  Pair live sessions with self-paced reading. Every title is authored by Digital AELA faculty and partners,
                  ready for your centre library.
                </motion.p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {bookLibrary.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group">
                  <Link to={`/books/${book.id}`}>
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={book.image}
                        alt={book.imageAlt || `${book.title} cover`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          {book.badge === "E-Book" ? (
                            <FaDownload className="w-2.5 h-2.5" />
                          ) : (
                            <FaBook className="w-2.5 h-2.5" />
                          )}
                          {book.badge}
                        </span>
                      </div>
                      {book.originalPrice > book.price && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)}% OFF
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide">
                        {book.category}
                      </span>

                      <h3 className="text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 mt-1">
                        {book.title}
                      </h3>

                      <p className="text-xs text-gray-400 mb-2">by {book.author}</p>

                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.round(book.rating)
                                  ? "text-[#D4AF37] fill-current"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-300">{book.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-500">({book.reviews})</span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-[#D4AF37] font-display">
                          ₹{book.price}
                        </span>
                        {book.originalPrice > book.price && (
                          <span className="text-xs text-gray-500 line-through">
                            ₹{book.originalPrice}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/books/${book.id}/payment`;
                          }}
                          className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-bold text-xs hover:bg-[#E5C158] transition-colors duration-200">
                          Buy Now
                        </motion.button>
                        <GiftButton
                          className="w-full border border-[#D4AF37]/60 text-[#F5D26A] rounded-lg font-bold text-xs hover:bg-[#D4AF37] hover:text-black"
                          size="sm">
                          Gift
                        </GiftButton>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default JoinBuildAfterLife;
