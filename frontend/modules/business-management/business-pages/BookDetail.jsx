import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import {
  FaStar,
  FaBook,
  FaDownload,
  FaArrowLeft,
  FaCheck,
} from "react-icons/fa";
import bookAdvancedEnglishImg from "../../../src/assets/images/books/advanced english.png";
import bookConfidenceBuildingImg from "../../../src/assets/images/books/confidence building.png";
import bookGrammarImg from "../../../src/assets/images/books/grammar.png";
import bookIELTSVocabularyImg from "../../../src/assets/images/books/IELTS vocabulary.png";
import bookSentenceStructureImg from "../../../src/assets/images/books/sentence structure.png";
import bookVocabularyImg from "../../../src/assets/images/books/vocabulary.png";
import GiftButton from "../common/GiftButton";

const BookDetail = () => {
  const { id } = useParams();
  // Sample books data - In production, this would come from an API
  const booksData = useMemo(
    () => [
      {
        id: 1,
        title: "Advanced English Grammar",
        author: "Dr. Sarah Johnson",
        price: 499,
        originalPrice: 699,
        image: bookGrammarImg,
        imageAlt: "Advanced English Grammar cover",
        rating: 4.8,
        reviews: 125,
        format: "physical",
        description:
          "Comprehensive guide to advanced English grammar with practical examples and exercises. This book covers all aspects of English grammar from basic to advanced levels, making it perfect for students, teachers, and professionals who want to master the English language.",
        fullDescription:
          "Advanced English Grammar is a comprehensive resource designed for learners who want to deepen their understanding of English grammar. The book covers complex grammatical structures, sentence patterns, and usage rules with clear explanations and practical examples. Each chapter includes exercises to reinforce learning and help readers apply the concepts in real-world situations. Whether you're preparing for exams, improving your writing skills, or teaching English, this book provides the tools you need to excel.",
        category: "Grammar",
        pages: 350,
        language: "English",
        isbn: "978-1234567890",
        publisher: "Digital AELA Publications",
        publishedDate: "2024",
        features: [
          "Comprehensive grammar coverage",
          "Practical examples and exercises",
          "Suitable for all levels",
          "Expert-authored content",
        ],
      },
      {
        id: 2,
        title: "Vocabulary Builder Pro",
        author: "Prof. Michael Chen",
        price: 299,
        originalPrice: 399,
        image: bookVocabularyImg,
        imageAlt: "Vocabulary Builder Pro cover",
        rating: 4.6,
        reviews: 89,
        format: "ebook",
        description:
          "Expand your vocabulary with 5000+ essential words and phrases for professional communication.",
        fullDescription:
          "Vocabulary Builder Pro is an essential resource for anyone looking to expand their English vocabulary. This e-book contains over 5000 carefully selected words and phrases commonly used in professional and academic settings. Each entry includes definitions, example sentences, synonyms, and usage tips. The book is organized by themes and difficulty levels, making it easy to find and learn relevant vocabulary for your needs.",
        category: "Vocabulary",
        pages: 280,
        language: "English",
        isbn: "978-1234567891",
        publisher: "Digital AELA Publications",
        publishedDate: "2024",
        features: [
          "5000+ essential words",
          "Professional communication focus",
          "Digital format for easy access",
          "Interactive learning exercises",
        ],
      },
      {
        id: 3,
        title: "Self Help: Confidence Building",
        author: "Dr. Priya Sharma",
        price: 399,
        originalPrice: 599,
        image: bookConfidenceBuildingImg,
        imageAlt: "Self Help Confidence Building cover",
        rating: 4.9,
        reviews: 203,
        format: "physical",
        description:
          "Transform your life with proven confidence-building techniques and strategies.",
        fullDescription:
          "Self Help: Confidence Building is a transformative guide that helps readers develop unshakeable self-confidence. Written by renowned psychologist Dr. Priya Sharma, this book combines scientific research with practical strategies to help you overcome self-doubt, build self-esteem, and achieve your goals. The book includes exercises, real-life examples, and step-by-step techniques that you can apply immediately to start building confidence in all areas of your life.",
        category: "Self Help",
        pages: 320,
        language: "English",
        isbn: "978-1234567892",
        publisher: "Digital AELA Publications",
        publishedDate: "2024",
        features: [
          "Proven confidence-building techniques",
          "Practical exercises and strategies",
          "Real-life examples",
          "Expert psychological insights",
        ],
      },
      {
        id: 4,
        title: "English Sentence Structures",
        author: "Dr. Robert Williams",
        price: 349,
        originalPrice: 499,
        image: bookSentenceStructureImg,
        imageAlt: "English Sentence Structures cover",
        rating: 4.7,
        reviews: 156,
        format: "ebook",
        description:
          "Master English sentence structures with detailed explanations and practice exercises.",
        fullDescription:
          "English Sentence Structures is a comprehensive guide to understanding and mastering English sentence construction. This e-book covers all types of sentence structures, from simple to complex, with detailed explanations and numerous examples. Each chapter focuses on a specific aspect of sentence structure, including clauses, phrases, modifiers, and punctuation. The book includes practice exercises to help readers apply what they've learned and improve their writing skills.",
        category: "Structures",
        pages: 240,
        language: "English",
        isbn: "978-1234567893",
        publisher: "Digital AELA Publications",
        publishedDate: "2024",
        features: [
          "Complete sentence structure guide",
          "Detailed explanations",
          "Practice exercises included",
          "Digital format with search functionality",
        ],
      },
      {
        id: 5,
        title: "Business English Essentials",
        author: "Dr. Sarah Johnson",
        price: 449,
        originalPrice: 649,
        image: bookAdvancedEnglishImg,
        imageAlt: "Business English Essentials cover",
        rating: 4.8,
        reviews: 178,
        format: "physical",
        description:
          "Essential business English for professionals working in international environments.",
        fullDescription:
          "Business English Essentials is designed for professionals who need to communicate effectively in international business settings. This comprehensive guide covers business vocabulary, email writing, presentations, negotiations, and cross-cultural communication. The book includes real-world examples, templates, and exercises to help you master business English and advance your career.",
        category: "Grammar",
        pages: 380,
        language: "English",
        isbn: "978-1234567894",
        publisher: "Digital AELA Publications",
        publishedDate: "2024",
        features: [
          "Business communication focus",
          "Real-world examples",
          "Email and presentation templates",
          "Cross-cultural communication tips",
        ],
      },
      {
        id: 6,
        title: "IELTS Vocabulary Master",
        author: "Prof. Michael Chen",
        price: 379,
        originalPrice: 549,
        image: bookIELTSVocabularyImg,
        imageAlt: "IELTS Vocabulary Master cover",
        rating: 4.9,
        reviews: 267,
        format: "ebook",
        description:
          "Comprehensive vocabulary guide specifically designed for IELTS exam preparation.",
        fullDescription:
          "IELTS Vocabulary Master is the ultimate resource for IELTS test takers. This e-book contains over 4000 words and phrases commonly tested in the IELTS exam, organized by topics and difficulty levels. Each entry includes definitions, example sentences, collocations, and pronunciation guides. The book also includes practice tests and strategies to help you maximize your vocabulary score on the IELTS exam.",
        category: "Vocabulary",
        pages: 420,
        language: "English",
        isbn: "978-1234567895",
        publisher: "Digital AELA Publications",
        publishedDate: "2024",
        features: [
          "4000+ IELTS-specific words",
          "Topic-based organization",
          "Practice tests included",
          "Exam strategies and tips",
        ],
      },
    ],
    []
  );

  const book = useMemo(
    () => booksData.find((b) => b.id === parseInt(id, 10)),
    [booksData, id]
  );

  if (!book) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4 font-display">
            Book not found
          </h2>
          <Link
            to="/books"
            className="text-[#D4AF37] hover:text-[#E5C158] transition-colors">
            Back to Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title={`${book.title} by ${book.author} | Digital AELA Book Store`}
        description={book.description}
        keywords={`${book.title}, ${book.author}, ${
          book.category
        } book, English learning, ${
          book.format === "ebook" ? "e-book" : "physical book"
        }, Digital AELA`}
        url={`https://digitalaela.com/books/${book.id}`}
      />

      {/* Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-10 md:pt-[150px] md:pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <Link
            to="/books"
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200 mb-4">
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Books</span>
          </Link>
        </div>
      </motion.section>

      {/* Book Detail Section */}
      <section className="py-8 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Book Image */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:sticky lg:top-24 lg:self-start">
              <div className="relative overflow-hidden rounded-xl border border-[#D4AF37]/20 shadow-[0_30px_120px_rgba(10,10,10,0.55)]">
                <img
                  src={book.image}
                  alt={book.imageAlt || `${book.title} cover`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
                {/* Format Badge */}
                <div className="absolute top-4 right-4">
                  {book.format === "ebook" ? (
                    <span className="bg-[#D4AF37] text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#D4AF37]/30">
                      <FaDownload className="w-4 h-4" />
                      E-Book
                    </span>
                  ) : (
                    <span className="bg-[#D4AF37] text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#D4AF37]/30">
                      <FaBook className="w-4 h-4" />
                      Physical Book
                    </span>
                  )}
                </div>
                {/* Discount Badge */}
                {book.originalPrice > book.price && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-900/40">
                    {Math.round(
                      ((book.originalPrice - book.price) / book.originalPrice) *
                        100
                    )}
                    % OFF
                  </div>
                )}
              </div>
            </motion.div>

            {/* Book Information */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}>
              {/* Category */}
              <span className="text-sm text-[#D4AF37] font-semibold uppercase tracking-wide">
                {book.category}
              </span>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 font-display mt-2">
                {book.title}
              </h1>

              {/* Author */}
              <p className="text-lg text-gray-300 mb-4">by {book.author}</p>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(book.rating)
                          ? "text-[#D4AF37] fill-current"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg text-gray-300 font-semibold">
                  {book.rating}
                </span>
                <span className="text-sm text-gray-500">
                  ({book.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-[#D4AF37] font-display">
                  ₹{book.price}
                </span>
                {book.originalPrice > book.price && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{book.originalPrice}
                    </span>
                    <span className="text-sm text-[#D4AF37] font-semibold">
                      Save ₹{book.originalPrice - book.price}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3 font-display">
                  Description
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  {book.fullDescription || book.description}
                </p>
              </div>

              {/* Book Details */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-[#D4AF37]/20">
                <h3 className="text-lg font-bold text-white mb-4 font-display">
                  Book Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-400">Pages:</span>
                    <p className="text-white font-semibold">{book.pages}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Language:</span>
                    <p className="text-white font-semibold">{book.language}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">ISBN:</span>
                    <p className="text-white font-semibold text-sm">
                      {book.isbn}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Publisher:</span>
                    <p className="text-white font-semibold text-sm">
                      {book.publisher}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Published:</span>
                    <p className="text-white font-semibold">
                      {book.publishedDate}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Format:</span>
                    <p className="text-white font-semibold capitalize">
                      {book.format === "ebook" ? "E-Book" : "Physical Book"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              {book.features && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-3 font-display">
                    Key Features
                  </h3>
                  <ul className="space-y-2">
                    {book.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-gray-300">
                        <FaCheck className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    window.location.href = `/books/${book.id}/payment`;
                  }}
                  className="w-full bg-[#D4AF37] text-black py-4 rounded-lg font-bold text-lg hover:bg-[#E5C158] transition-colors duration-200">
                  Buy Now - ₹{book.price}
                </motion.button>
                <GiftButton
                  className="w-full border border-[#D4AF37]/60 text-[#F5D26A] rounded-lg font-bold text-lg hover:bg-[#D4AF37] hover:text-black"
                  size="lg">
                  Gift
                </GiftButton>
              </div>

              {/* Additional Info */}
              <p className="text-xs text-gray-500 text-center">
                {book.format === "ebook"
                  ? "Instant download after payment"
                  : "Free shipping available"}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookDetail;
