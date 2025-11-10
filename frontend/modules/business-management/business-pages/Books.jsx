import { useState } from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import { FaSearch, FaStar, FaBook, FaDownload } from "react-icons/fa";
import DonateButton from "../common/DonateButton";
import bookAdvancedEnglishImg from "../../../src/assets/images/books/advanced english.png";
import bookConfidenceBuildingImg from "../../../src/assets/images/books/confidence building.png";
import bookGrammarImg from "../../../src/assets/images/books/grammar.png";
import bookIELTSVocabularyImg from "../../../src/assets/images/books/IELTS vocabulary.png";
import bookSentenceStructureImg from "../../../src/assets/images/books/sentence structure.png";
import bookVocabularyImg from "../../../src/assets/images/books/vocabulary.png";

const Books = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample books data - In production, this would come from an API
  const books = [
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
      format: "physical", // "physical" or "ebook"
      description:
        "Comprehensive guide to advanced English grammar with practical examples and exercises.",
      category: "Grammar",
      pages: 350,
      language: "English",
      isbn: "978-1234567890",
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
      category: "Vocabulary",
      pages: 280,
      language: "English",
      isbn: "978-1234567891",
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
      category: "Self Help",
      pages: 320,
      language: "English",
      isbn: "978-1234567892",
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
      category: "Structures",
      pages: 240,
      language: "English",
      isbn: "978-1234567893",
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
      category: "Grammar",
      pages: 380,
      language: "English",
      isbn: "978-1234567894",
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
      category: "Vocabulary",
      pages: 420,
      language: "English",
      isbn: "978-1234567895",
    },
  ];

  // Filter books based on search query
  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Books Store | Digital AELA - English Grammar, Vocabulary, Self Help Books Online"
        description="Browse and buy educational books from Digital AELA. English Grammar, Vocabulary, Self Help, and Sentence Structure books available in physical and e-book formats. Expert-authored books for students and professionals."
        keywords="English books online, Grammar books, Vocabulary books, Self help books, E-books, Physical books, Educational books India, Pakistan, Bangladesh, Nepal, Gulf countries, English learning books"
        url="https://digitalaela.com/books"
      />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl"></motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl"></motion.div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight text-center">
            Our <span className="text-[#D4AF37]">Book Store</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-base text-gray-300 max-w-2xl mx-auto text-center mb-8">
            Discover expert-authored books on English Grammar, Vocabulary, Self
            Help, and more. Available in physical and e-book formats.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="max-w-2xl mx-auto">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search books by title, author, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] transition-colors duration-200"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Books Grid Section */}
      <section className="py-12 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Results Count */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-8">
            <p className="text-gray-300 text-sm">
              {filteredBooks.length} book{filteredBooks.length !== 1 ? "s" : ""}{" "}
              found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </motion.div>

          {/* Books Grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.05,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group cursor-pointer">
                  <Link to={`/books/${book.id}`}>
                    {/* Book Image */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={book.image}
                        alt={book.imageAlt || `${book.title} cover`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                      {/* Format Badge */}
                      <div className="absolute top-2 right-2">
                        {book.format === "ebook" ? (
                          <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <FaDownload className="w-2.5 h-2.5" />
                            E-Book
                          </span>
                        ) : (
                          <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <FaBook className="w-2.5 h-2.5" />
                            Physical
                          </span>
                        )}
                      </div>
                      {/* Discount Badge */}
                      {book.originalPrice > book.price && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {Math.round(
                            ((book.originalPrice - book.price) /
                              book.originalPrice) *
                              100
                          )}
                          % OFF
                        </div>
                      )}
                    </div>

                    {/* Book Content */}
                    <div className="p-4">
                      {/* Category */}
                      <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide">
                        {book.category}
                      </span>

                      {/* Title */}
                      <h3 className="text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 mt-1">
                        {book.title}
                      </h3>

                      {/* Author */}
                      <p className="text-xs text-gray-400 mb-2">
                        by {book.author}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(book.rating)
                                  ? "text-[#D4AF37] fill-current"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-300">
                          {book.rating}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          ({book.reviews})
                        </span>
                      </div>

                      {/* Price */}
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
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-white mb-2 font-display">
                No books found
              </h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search query
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#D4AF37] hover:text-[#E5C158] transition-colors">
                Clear search
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Books;
