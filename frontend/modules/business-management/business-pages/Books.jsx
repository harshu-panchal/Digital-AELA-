import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaSearch, FaStar, FaBook, FaDownload, FaSpinner } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import GiftButton from "../common/GiftButton";
import { fetchEbooks } from "../../../src/services/api/resources";
import { useAuth } from "../../../src/contexts/AuthContext";
import { redirectToRazorpay } from "../utils/directRazorpayPayment";
import { useDynamicTranslation } from "../../../src/hooks/useDynamicTranslation";
import { useLanguage } from "../../../src/contexts/LanguageContext";
import { normalizeLanguageCode } from "../../../src/utils/languageUtils";
import TranslatedText from "../../../src/components/TranslatedText";
import { getMediaUrl } from "../../../src/utils/mediaUrl";
import LazyImage from "../../../src/components/LazyImage";
import bookAdvancedEnglishImg from "../../../src/assets/images/books/advanced english.png";
import bookConfidenceBuildingImg from "../../../src/assets/images/books/confidence building.png";
import bookGrammarImg from "../../../src/assets/images/books/grammar.png";
import bookIELTSVocabularyImg from "../../../src/assets/images/books/IELTS vocabulary.png";
import bookSentenceStructureImg from "../../../src/assets/images/books/sentence structure.png";
import bookVocabularyImg from "../../../src/assets/images/books/vocabulary.png";

// Fallback static books for when API fails
const staticBooks = [
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

const BOOKS_STORAGE_KEY = "aela.books.cache";
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const Books = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState(() => {
    // Try to load from sessionStorage first (cached data from previous visit)
    try {
      const cached = sessionStorage.getItem(BOOKS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
    // Start with empty array - no dummy data
    return [];
  });
  const [loading, setLoading] = useState(true);

  // Translation hooks
  const { language } = useLanguage();
  const { translateObject } = useDynamicTranslation();
  const [translatedBooks, setTranslatedBooks] = useState([]);

  useEffect(() => {
    // Always fetch fresh data on mount to show newly approved books
    const loadBooks = async () => {
      try {
        setLoading(true);
        const response = await fetchEbooks({ page: 1, pageSize: 100 });
        const ebooksFromApi = (response.data || []).map((ebook) => {
          // Debug: log the ebook to see what we're getting
          // eslint-disable-next-line no-console
          console.log("Ebook from API:", { id: ebook._id, title: ebook.title, metadata: ebook.metadata });
          const price = ebook.metadata?.price !== undefined && ebook.metadata.price !== null && ebook.metadata.price !== "" ? Number(ebook.metadata.price) : 0;
          return {
            id: ebook._id,
            title: ebook.title,
            author: ebook.metadata?.author || "Digital AELA", // This will be the teacher's name
            price: price,
            rawPrice: price, // Store original numeric price
            originalPrice: price > 0 ? Math.round(price * 1.4) : 0,
            image: ebook.metadata?.coverImage || bookGrammarImg,
            imageAlt: `${ebook.title} cover`,
            rating: 4.5, // Default rating
            reviews: 0,
            format: "ebook",
            description: ebook.description || "",
            category: ebook.categories?.[0] || "General",
            pages: ebook.pages || 0,
            language: "English",
            isbn: ebook._id,
          };
        });
        // Use API data only - no fallback to static books
        setBooks(ebooksFromApi);
        // Cache in sessionStorage for faster initial render on next visit
        try {
          sessionStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(finalBooks));
        } catch (e) {
          // Ignore storage errors
        }
      } catch (error) {
        const isNetworkError = error?.isNetworkError || error?.code === "CONNECTION_ERROR" || error?.status === 0;

        // Log errors appropriately
        if (isNetworkError && !isDevelopment) {
          console.error("[Books] Failed to connect to API:", error.message);
        } else if (!isNetworkError) {
          console.error("Failed to load books:", error);
        }

        // Try to use cached data first
        try {
          const cached = sessionStorage.getItem(BOOKS_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBooks(parsed);
              toast.warning("Using cached data. Please refresh if books are outdated.");
              return;
            }
          }
        } catch (e) {
          // Ignore storage errors
        }

        // Show empty state on error - no dummy data
        setBooks([]);
        toast.error("Failed to load books. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []); // Empty dependency array - fetch on mount only

  // Translate books when language changes
  useEffect(() => {
    const translateBooks = async () => {
      if (books.length === 0) {
        setTranslatedBooks([]);
        return;
      }

      if (normalizeLanguageCode(language) === "en") {
        setTranslatedBooks(books);
        return;
      }

      try {
        // Translate each book individually
        const translatedBooksList = await Promise.all(
          books.map(async (book) => {
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
              console.error("[Books] Error translating book:", error);
              return book;
            }
          })
        );

        setTranslatedBooks(translatedBooksList);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Books] Error translating books:", error);
        setTranslatedBooks(books);
      }
    };

    translateBooks();
  }, [books, language, translateObject]);

  // Use translated books if available, otherwise use original
  const displayBooks = translatedBooks.length > 0 ? translatedBooks : books;

  // Filter books based on search query
  const filteredBooks = displayBooks.filter(
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
        className="relative pt-[110px] pb-12 md:pt-[150px] md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-xl"></motion.div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <motion.h1
            className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight text-center">
            <TranslatedText>Our</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Book Store</TranslatedText></span>
          </motion.h1>
          <motion.p
            className="text-base text-gray-300 max-w-2xl mx-auto text-center mb-8">
            <TranslatedText>Discover expert-authored books on English Grammar, Vocabulary, Self Help, and more. Available in physical and e-book formats.</TranslatedText>
          </motion.p>

          {/* Search Bar */}
          <motion.div
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
              {/* Note: Placeholder text translation would require a custom input component */}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Books Grid Section */}
      <section className="py-12 bg-[#141414] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Results Count */}
          <motion.div
            className="mb-8">
            <p className="text-gray-300 text-sm">
              {filteredBooks.length} <TranslatedText>book{filteredBooks.length !== 1 ? "s" : ""} found</TranslatedText>
              {searchQuery && ` ${<TranslatedText>for</TranslatedText>} "${searchQuery}"`}
            </p>
          </motion.div>

          {/* Books Grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group cursor-pointer flex flex-col h-full">
                  <Link to={`/books/${book.id}`} className="flex flex-col h-full">
                    {/* Book Image */}
                    <div className="relative h-48 w-full overflow-hidden flex-shrink-0">
                      <LazyImage
                        src={getMediaUrl(book.image)}
                        alt={book.imageAlt || `${book.title} cover`}
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                        fallbackSrc="https://via.placeholder.com/300x400?text=Book"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                      {/* Format Badge */}
                      <div className="absolute top-2 right-2">
                        {book.format === "ebook" ? (
                          <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <FaDownload className="w-2.5 h-2.5" />
                            <TranslatedText>E-Book</TranslatedText>
                          </span>
                        ) : (
                          <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <FaBook className="w-2.5 h-2.5" />
                            <TranslatedText>Physical</TranslatedText>
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
                          % <TranslatedText>OFF</TranslatedText>
                        </div>
                      )}
                    </div>

                    {/* Book Content */}
                    <div className="flex flex-1 flex-col p-4">
                      {/* Category */}
                      <span className="flex-shrink-0 text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide">
                        <TranslatedText>{book.category}</TranslatedText>
                      </span>

                      {/* Title */}
                      <h3 className="flex-shrink-0 text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 mt-1">
                        {book.title}
                      </h3>

                      {/* Author */}
                      <p className="flex-shrink-0 text-xs text-gray-400 mb-2">
                        <TranslatedText>by</TranslatedText> {book.author}
                      </p>

                      {/* Rating */}
                      <div className="flex-shrink-0 flex items-center gap-1.5 mb-3">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(book.rating)
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
                      <div className="flex-shrink-0 flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-[#D4AF37] font-display">
                          {book.price > 0 ? `AED ${book.price}` : <TranslatedText>Free</TranslatedText>}
                        </span>
                        {book.originalPrice > book.price && (
                          <span className="text-xs text-gray-500 line-through">
                            AED {book.originalPrice}
                          </span>
                        )}
                      </div>

                      <div className="flex-shrink-0 mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const isFreeBook = book.price === 0 || book.price === "Free" || book.price === null;
                            const isEbook = book.format === "ebook" || book.badge === "E-Book";

                            if (isFreeBook && isEbook) {
                              // Free ebook - redirect to free library reader
                              navigate(`/free-library/ebook/${book.id}/read`);
                            } else if (isFreeBook) {
                              // Free physical book - show message
                              toast.info("Free physical books require contact for delivery. Please visit the book detail page."); // Toast message
                              navigate(`/books/${book.id}`);
                            } else {
                              // Paid book - redirect directly to Razorpay
                              if (!isAuthenticated) {
                                toast.info("Please log in to purchase this book"); // Toast message
                                navigate("/login/student");
                                return;
                              }
                              // Validate price
                              const bookPrice = typeof book.price === 'number' ? book.price : parseFloat(book.price) || 0;
                              if (!bookPrice || bookPrice <= 0) {
                                toast.error("This book price is not available. Please contact support."); // Toast message
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
                          {book.price > 0 ? <TranslatedText>Buy Now</TranslatedText> : <TranslatedText>Get Free</TranslatedText>}
                        </motion.button>
                        <GiftButton
                          course={book} // Pass the book object
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
          ) : (
            <motion.div
              className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-white mb-2 font-display">
                <TranslatedText>No books found</TranslatedText>
              </h3>
              <p className="text-gray-400 mb-6">
                <TranslatedText>Try adjusting your search query</TranslatedText>
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#D4AF37] hover:text-[#E5C158] transition-colors">
                <TranslatedText>Clear search</TranslatedText>
              </button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Books;
