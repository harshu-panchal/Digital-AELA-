import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBook,
  FaDownload,
  FaStar,
} from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import bookAdvancedEnglishImg from "../../../src/assets/images/books/advanced english.png";
import bookConfidenceBuildingImg from "../../../src/assets/images/books/confidence building.png";
import bookGrammarImg from "../../../src/assets/images/books/grammar.png";
import bookIELTSVocabularyImg from "../../../src/assets/images/books/IELTS vocabulary.png";
import bookSentenceStructureImg from "../../../src/assets/images/books/sentence structure.png";
import bookVocabularyImg from "../../../src/assets/images/books/vocabulary.png";
import DonateButton from "../common/DonateButton";

const whatsappNumber = "+971508185690";
const generateWhatsAppLink = (courseTitle) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello! I'd like to enroll in the ${courseTitle} course at Digital AELA.`
  )}`;

const courseCatalog = [
  {
    id: "basic-english",
    title: "Basic English Course",
    image:
      "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80",
    description:
      "Build grammar, vocabulary, and everyday communication confidence with instructor-led practice labs.",
    duration: "8 weeks",
    format: "Classroom + Online",
    price: "₹7,499",
    highlights: ["Grammar fundamentals", "Conversation drills", "Personalised feedback"],
    path: "/courses/english-language",
  },
  {
    id: "intermediate-english",
    title: "Intermediate English Course",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    description:
      "Upgrade sentence structuring, professional writing, and presentation skills for career growth.",
    duration: "10 weeks",
    format: "Hybrid Batches",
    price: "₹8,999",
    highlights: ["Fluency labs", "Business writing", "Weekly speaking circles"],
    path: "/courses/english-language",
  },
  {
    id: "advanced-english",
    title: "Advanced English Course",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    description:
      "Master high-stakes communication, boardroom storytelling, and accent refinement for global roles.",
    duration: "12 weeks",
    format: "Executive Cohort",
    price: "₹11,499",
    highlights: ["Executive coaching", "Accent polish", "Presentation mastery"],
    path: "/courses/english-language",
  },
  {
    id: "communication-accent",
    title: "Communication & Accent Training",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    description:
      "Neutralize MTI influence and build confident speech with phonetics, intonation, and storytelling practice.",
    duration: "6 weeks",
    format: "Live Labs",
    price: "₹6,999",
    highlights: ["Accent drills", "Voice modulation", "Role-play practice"],
    path: "/courses/english-language",
  },
  {
    id: "meta-ads",
    title: "Facebook & Instagram Ads (Meta Ads)",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    description:
      "Design and optimise conversion-driven campaigns across Meta platforms with real ad accounts.",
    duration: "5 weeks",
    format: "Campaign Studio",
    price: "₹9,499",
    highlights: ["Ad psychology", "A/B testing", "Budget optimisation"],
    path: "/courses/digital-marketing",
  },
  {
    id: "performance-marketing",
    title: "Performance Marketing Accelerator",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    description:
      "Master Google Ads, analytics dashboards, and funnel optimisation to scale brands profitably.",
    duration: "7 weeks",
    format: "Project Based",
    price: "₹10,499",
    highlights: ["Search & display", "Attribution modelling", "Live client projects"],
    path: "/courses/digital-marketing",
  },
  {
    id: "content-strategy",
    title: "Content & Social Strategy Bootcamp",
    image:
      "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1200&q=80",
    description:
      "Create scroll-stopping stories, reels, and brand playbooks guided by senior content strategists.",
    duration: "6 weeks",
    format: "Creator Pods",
    price: "₹8,499",
    highlights: ["Brand voice", "Reel scripting", "Community playbooks"],
    path: "/courses/digital-marketing",
  },
  {
    id: "corporate-training",
    title: "Corporate Training Leadership",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    description:
      "Drive organisational change with leadership communication, customer experience, and productivity frameworks.",
    duration: "Custom Cohorts",
    format: "Enterprise",
    price: "On Request",
    highlights: ["CXO masterclasses", "Industry case labs", "Hybrid delivery"],
    path: "/courses/corporate-training",
  },
  {
    id: "career-launchpad",
    title: "Career Launchpad & Skill Development",
    image:
      "https://images.unsplash.com/photo-1518609803965-7f03b10f17dd?auto=format&fit=crop&w=1200&q=80",
    description:
      "Blend psychometrics, skill sprints, and mentorship to design placement-ready career blueprints.",
    duration: "8 weeks",
    format: "Mentorship Pods",
    price: "₹12,499",
    highlights: ["Career mapping", "Interview labs", "1:1 mentorship"],
    path: "/courses/corporate-training",
  },
  {
    id: "ielts-masterclass",
    title: "IELTS Masterclass",
    image:
      "https://images.unsplash.com/photo-1528109984716-1d28c37fa326?auto=format&fit=crop&w=1200&q=80",
    description:
      "Band-focused preparation with mock tests, feedback reviews, and skill-by-skill improvement plans.",
    duration: "6 weeks",
    format: "Targeted Prep",
    price: "₹7,999",
    highlights: ["Band analysis", "Speaking mock", "Writing clinics"],
    path: "/courses/english-language",
  },
  {
    id: "call-centre",
    title: "Call Centre Excellence Program",
    image:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1200&q=80",
    description:
      "Train agents on empathy-driven scripts, objection handling, and multilingual support workflows.",
    duration: "4 weeks",
    format: "Live Simulation",
    price: "₹6,499",
    highlights: ["Voice & tone", "CRM workflows", "Objection handling"],
    path: "/courses/corporate-training",
  },
  {
    id: "sales-masterclass",
    title: "Sales Executive Masterclass",
    image:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    description:
      "Close deals faster with discovery frameworks, pitching strategies, and role-play coachings.",
    duration: "5 weeks",
    format: "Cohort-based",
    price: "₹7,999",
    highlights: ["Discovery blueprint", "Negotiation labs", "Pipeline reviews"],
    path: "/courses/corporate-training",
  },
];

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
        <div className="absolute -top-24 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#F5D26A]/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-128 w-128 translate-x-1/3 rounded-full bg-[#0E1635]/80 blur-[140px]" />
        <div className="absolute top-1/3 left-0 hidden h-80 w-80 -translate-x-1/2 rounded-full bg-[#103350]/40 blur-[110px] md:block" />
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

            <div className="auto-grid-md lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {courseCatalog.map((course, index) => {
                const buyLink = course.buyLink || generateWhatsAppLink(course.title);

                return (
                  <motion.div
                    key={course.title}
                    initial={{ y: 40, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.25,
                      delay: index * 0.05,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    whileHover={{ y: -6 }}
                    className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_10px_rgba(212,175,55,0.18)] transition-all duration-300 group">
                    <div className="h-44 w-full overflow-hidden">
                      <img
                        src={course.image}
                        alt={course.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 bg-linear-to-b from-[#141414] to-[#0a0a0a] space-y-4">
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
                          {course.highlights.map((feature) => (
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
                          <motion.a
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            href={buyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs md:text-sm font-semibold text-black shadow-[0_10px_30px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                            Buy Now
                          </motion.a>
                          <DonateButton
                            className="inline-flex w-full items-center justify-center rounded-full border border-[#F5D26A]/60 px-4 text-xs md:text-sm font-semibold text-[#F5D26A] hover:bg-[#D4AF37] hover:text-black"
                            size="sm">
                            Donate
                          </DonateButton>
                        </div>
                      </div>

                      <Link
                        to={course.path || "/courses"}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5D26A] transition hover:text-[#FFE28A]">
                        Explore course
                        <FaArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
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
                        <DonateButton
                          className="w-full border border-[#D4AF37]/60 text-[#F5D26A] rounded-lg font-bold text-xs hover:bg-[#D4AF37] hover:text-black"
                          size="sm">
                          Donate
                        </DonateButton>
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
