import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaBook,
  FaDownload,
  FaStar,
  FaSpinner,
  FaGraduationCap,
  FaArrowLeft,
} from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import TranslatedText from "../../../src/components/TranslatedText";
import bookAdvancedEnglishImg from "../../../src/assets/images/books/advanced english.png";
import bookConfidenceBuildingImg from "../../../src/assets/images/books/confidence building.png";
import bookGrammarImg from "../../../src/assets/images/books/grammar.png";
import bookIELTSVocabularyImg from "../../../src/assets/images/books/IELTS vocabulary.png";
import bookSentenceStructureImg from "../../../src/assets/images/books/sentence structure.png";
import bookVocabularyImg from "../../../src/assets/images/books/vocabulary.png";
import GiftButton from "../common/GiftButton";
import { buildCoursePaymentLink } from "../utils/paymentLinks";
import { useAuth } from "../../../src/contexts/AuthContext";
import { redirectToRazorpay } from "../utils/directRazorpayPayment";
import { fetchPublishedCourses } from "../../../src/services/api/courses";
import { fetchEbooks } from "../../../src/services/api/resources";

const JoinBuildAfterLife = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [afterLifeCourses, setAfterLifeCourses] = useState([]);
  const [afterLifeBooks, setAfterLifeBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all"); // all, course, book

  // Utility function to clean text and remove extra spaces
  const cleanText = (text) => {
    if (!text) return "";
    return String(text).trim().replace(/\s+/g, " ");
  };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const response = await fetchPublishedCourses();
        
        if (!response || !response.courses) {
          console.warn("No courses data received from API");
          setAfterLifeCourses([]);
          return;
        }

        // Only show published/approved courses
        const publishedCourses = (response.courses || [])
          .filter((course) => course.status === "published") // Extra safety check
          .map((course) => ({
            // Preserve all original course data first
            ...course,
            // Then override with formatted display values
            id: course._id,
            slug: course._id,
            title: cleanText(course.title || "Untitled Course"),
            description: cleanText(course.description || course.metadata?.subtitle || course.subtitle || ""),
            longDescription: course.longDescription || course.description || course.metadata?.subtitle || course.subtitle || "",
            image: course.thumbnailUrl || course.thumbnail || course.image || "",
            coverImage: course.coverImage || course.thumbnailUrl || course.thumbnail || course.image || "",
            price: course.price === 0 ? "Free" : course.price ? `AED ${course.price}` : "On Request",
            priceLabel: course.priceLabel || (course.price ? `AED ${course.price}` : "On Request"),
            discountPrice: course.discountPrice || course.metadata?.discountPrice || null,
            duration: course.duration ? `${course.duration} hours` : course.metadata?.duration || "",
            format: course.metadata?.deliveryMode || course.deliveryMode || course.format || "",
            features: course.metadata?.tags || course.tags || [],
            highlights: course.metadata?.tags || course.tags || [],
            category: course.category || course.metadata?.category || "General",
            difficulty: course.metadata?.difficulty || course.difficulty || "",
            language: course.language || course.metadata?.language || "",
            learningOutcomes: course.learningOutcomes || course.metadata?.learningOutcomes || "",
            requirements: course.requirements || course.metadata?.requirements || "",
            syllabus: course.syllabus || course.metadata?.syllabus || "",
            detailedSyllabus: course.detailedSyllabus || course.metadata?.detailedSyllabus || null,
            introVideoUrl: course.introVideoUrl || course.metadata?.introVideoUrl || "",
            tags: course.tags || course.metadata?.tags || [],
            instructor: course.instructor?.fullName || course.instructorName || "Digital AELA",
            type: "course",
          }));
        
        setAfterLifeCourses(publishedCourses);
        
        if (publishedCourses.length === 0) {
          console.info("No published courses available");
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
        setAfterLifeCourses([]);
        toast.error("Failed to load courses. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoadingBooks(true);
        // Fetch all approved books (increase pageSize to get all)
        const response = await fetchEbooks({ page: 1, pageSize: 500 });
        
        if (!response || !response.data) {
          console.warn("No books data received from API");
          setAfterLifeBooks([]);
          return;
        }

        // Only show approved books (isPublic: true)
        const booksFromApi = (response.data || [])
          .filter((ebook) => ebook.isPublic === true) // Extra safety check
          .map((ebook) => {
            const price = ebook.metadata?.price !== undefined && 
                        ebook.metadata.price !== null && 
                        ebook.metadata.price !== "" 
                        ? Number(ebook.metadata.price) 
                        : 0;
            
          return {
            id: ebook._id,
              title: ebook.title || "Untitled Book",
              author: ebook.metadata?.author || ebook.author || "Digital AELA",
            price: price,
            originalPrice: price > 0 ? Math.round(price * 1.4) : 0,
              rating: 4.5, // Default rating
            reviews: 0,
              category: ebook.categories?.[0] || ebook.category || "General",
            badge: "E-Book",
              image: ebook.metadata?.coverImage || ebook.coverImage || bookAdvancedEnglishImg,
              imageAlt: `${ebook.title || "Book"} cover`,
              description: ebook.description || "",
              type: "book",
          };
        });
        
        setAfterLifeBooks(booksFromApi);
        
        if (booksFromApi.length === 0) {
          console.info("No approved books available");
        }
      } catch (error) {
        console.error("Failed to load books:", error);
        setAfterLifeBooks([]);
        toast.error("Failed to load books. Please try refreshing the page.");
      } finally {
        setLoadingBooks(false);
      }
    };

    loadBooks();
  }, []);

  // Combine all items - only from backend, no static fallback
  const allItems = [
    ...afterLifeCourses,
    ...afterLifeBooks,
  ];

  // Filter items
  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Helper function to check if course is free
  const isFreeCourse = (course) => {
    if (!course) return false;
    const price = course.price;
    
    // Check various formats
    // 1. Direct numeric check
    if (price === 0 || (typeof price === 'number' && price === 0)) return true;
    
    // 2. String checks (after transformation, price becomes "Free" or "AED ${price}")
    if (typeof price === 'string') {
      const lowerPrice = price.toLowerCase();
      if (lowerPrice === 'free' || lowerPrice.includes('free')) return true;
      
      // Extract numeric value from strings like "AED 100" or "On Request"
      if (lowerPrice === 'on request') return false; // "On Request" means price not set, not free
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      if (isNaN(numericPrice) || numericPrice === 0) return true;
    }
    
    return false;
  };

  // Helper function to check if book is free
  const isFreeBook = (book) => {
    if (!book) return false;
    const price = book.price;
    
    // Check various formats
    if (price === 0 || price === null || price === undefined) return true;
    if (price === "Free" || price === "free") return true;
    if (typeof price === 'number' && price === 0) return true;
    if (typeof price === 'string' && price.toLowerCase().includes('free')) return true;
    
    return false;
  };

  const handleBuyCourse = async (course) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.info("Please log in to enroll in this course");
      navigate("/login/student");
      return;
    }

    const payload = {
      ...course,
      category: "Build Your Afterlife",
      origin: "join-build-afterlife",
    };
    
    // Check if course is free
    if (isFreeCourse(course)) {
      // Free course - navigate to course detail page for enrollment
      handleViewCourse(course);
    } else {
      // Paid course - redirect directly to Razorpay
      const priceValue = typeof course.price === 'number' ? course.price : 
                        (typeof course.price === 'string' && course.price.toLowerCase() === 'free') ? 0 :
                        (typeof course.price === 'string' && course.price.includes('Free')) ? 0 :
                        parseFloat(course.price) || 0;
      
      await redirectToRazorpay({
        courseId: course._id || course.id || null,
        amount: priceValue,
        currency: "AED",
        description: `Payment for ${course.title || "course"}`,
        userName: user?.fullName || "",
        userEmail: user?.email || "",
        userPhone: user?.phone || "",
        quantity: 1,
      });
    }
  };

  const handleViewCourse = (course) => {
    const payload = {
      ...course,
      origin: "join-build-afterlife",
    };
    // If course has _id (backend course), use ID route, otherwise use slug (catalog course)
    if (course._id) {
      navigate(`/courses/id/${course._id}`, {
        state: {
          course: payload,
        },
      });
    } else if (course.id) {
      // If no _id but has id, treat it as backend course ID
      navigate(`/courses/id/${course.id}`, {
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
      console.error("Course missing both _id and slug/id:", course);
      toast.error("Unable to navigate to course. Course information is missing.");
    }
  };

  const isLoading = loading || loadingBooks;

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Build Your Afterlife | All Courses & Books | Digital AELA"
        description="Explore every Digital AELA course track and book collection in one immersive space. Plan your Afterlife journey with curated learning paths and premium resources."
        keywords="Digital AELA courses, Digital AELA books, Build Your Afterlife, corporate training, digital marketing, English language courses"
        url="https://digitalaela.com/join-us/afterlife"
      />

      {/* Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative pt-[140px] pb-10 md:pt-[150px] md:pb-12 overflow-hidden">
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
            <TranslatedText>Build Your</TranslatedText> <span className="text-[#D4AF37]"><TranslatedText>Afterlife</TranslatedText></span>
              </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-base text-gray-300 max-w-2xl mx-auto text-center mb-8">
            <TranslatedText>Craft lifelong learning hubs powered by Digital AELA courses & books. Explore every course track and book collection in one immersive space.</TranslatedText>
          </motion.p>

          {/* Search and Filters */}
              <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses and books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] transition-colors duration-200"
              />
            </div>
            <div className="flex gap-2">
              {["all", "course", "book"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 capitalize ${
                    selectedType === type
                      ? "bg-[#D4AF37] text-black"
                      : "bg-[#1a1a1a] border border-[#D4AF37]/30 text-white hover:border-[#D4AF37]"
                  }`}>
                  {type === "all" ? <TranslatedText>All</TranslatedText> : type === "course" ? <TranslatedText>Courses</TranslatedText> : <TranslatedText>Books</TranslatedText>}
                </button>
              ))}
            </div>
          </motion.div>
          </div>
      </motion.section>

      {/* Items Grid */}
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
              {filteredItems.length} <TranslatedText>item{filteredItems.length !== 1 ? "s" : ""} found</TranslatedText>
              {searchQuery && ` ${<TranslatedText>for</TranslatedText>} "${searchQuery}"`}
              {selectedType !== "all" && ` ${<TranslatedText>in</TranslatedText>} ${selectedType === "course" ? <TranslatedText>Courses</TranslatedText> : <TranslatedText>Books</TranslatedText>}`}
            </p>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <FaSpinner className="w-8 h-8 text-[#D4AF37] animate-spin" />
            </div>
          )}

          {/* Items Grid */}
          {!isLoading && filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => {
                if (item.type === "course") {
                  const highlights = item.features ?? item.highlights ?? [];
                return (
                  <motion.div
                      key={item.id || item.slug}
                      initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.25,
                      delay: index * 0.05,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-[0_0_8px_rgba(212,175,55,0.15)] transition-all duration-300 group cursor-pointer flex flex-col">
                      <div
                        onClick={() => handleViewCourse(item)}
                        className="relative h-48 w-full overflow-hidden flex-shrink-0">
                      <img
                          src={item.image || "https://via.placeholder.com/300x200?text=Course"}
                          alt={item.title}
                        loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                        <div className="absolute top-2 left-2">
                          <span className="bg-[#D4AF37] text-black px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <FaGraduationCap className="w-2.5 h-2.5" />
                            <TranslatedText>Course</TranslatedText>
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-1 min-h-0">
                        <h3 className="text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 min-h-[2.5rem] flex-shrink-0">
                          <TranslatedText>{item.title}</TranslatedText>
                        </h3>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2 min-h-[2.5rem] flex-shrink-0">
                          {item.description ? <TranslatedText>{item.description}</TranslatedText> : <TranslatedText>No description available</TranslatedText>}
                        </p>

                        {highlights.length > 0 ? (
                          <div className="mb-3 flex-shrink-0">
                            <p className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide mb-1">
                              <TranslatedText>Key Highlights</TranslatedText>
                            </p>
                            <ul className="space-y-1">
                              {highlights.slice(0, 2).map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-1.5 text-xs text-gray-300">
                                  <span className="h-[2px] w-2 rounded-full bg-[#D4AF37]/40 flex-shrink-0"></span>
                                  <span className="line-clamp-1"><TranslatedText>{cleanText(feature)}</TranslatedText></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="mb-3 flex-shrink-0" style={{ minHeight: '0px' }}></div>
                        )}

                        <div className="flex items-center justify-between mb-3 pt-3 border-t border-gray-700 mt-auto flex-shrink-0">
                          <span className="text-lg font-bold text-[#D4AF37] font-display">
                            {item.price || <TranslatedText>On Request</TranslatedText>}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCourse(item);
                            }}
                            className="w-full border border-[#D4AF37]/60 bg-transparent text-[#D4AF37] py-2 rounded-lg font-bold text-xs hover:bg-[#D4AF37] hover:text-black transition-colors duration-200">
                            <TranslatedText>See Full Course</TranslatedText>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyCourse(item);
                            }}
                            className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-bold text-xs hover:bg-[#E5C158] transition-colors duration-200">
                            {isFreeCourse(item) ? <TranslatedText>Enroll Free</TranslatedText> : <TranslatedText>Buy Now</TranslatedText>}
                          </motion.button>
                          <div
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}>
                            <GiftButton
                              course={item}
                              className="w-full border border-[#D4AF37]/60 text-[#F5D26A] rounded-lg font-bold text-xs hover:bg-[#D4AF37] hover:text-black"
                              size="sm">
                              Gift
                            </GiftButton>
                          </div>
                        </div>
                    </div>
                  </motion.div>
                );
                } else {
                  // Book item
                  return (
                <motion.div
                      key={item.id}
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
                      <Link to={`/books/${item.id}`}>
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                            src={item.image}
                            alt={item.imageAlt || `${item.title} cover`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <span className="bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                              {item.badge === "E-Book" ? (
                            <FaDownload className="w-2.5 h-2.5" />
                          ) : (
                            <FaBook className="w-2.5 h-2.5" />
                          )}
                              {item.badge}
                        </span>
                      </div>
                          {item.originalPrice > item.price && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {Math.round(
                                ((item.originalPrice - item.price) / item.originalPrice) * 100
                              )}
                              % OFF
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wide">
                            {item.category}
                      </span>

                      <h3 className="text-base font-bold text-white mb-1.5 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2 mt-1">
                            <TranslatedText>{item.title}</TranslatedText>
                      </h3>

                          <p className="text-xs text-gray-400 mb-2"><TranslatedText>by</TranslatedText> {item.author}</p>

                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-3 h-3 ${
                                    i < Math.floor(item.rating || 4.5)
                                  ? "text-[#D4AF37] fill-current"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                            <span className="text-xs text-gray-300">
                              {(item.rating || 4.5).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              ({item.reviews || 0})
                            </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-[#D4AF37] font-display">
                              {item.price > 0 ? `₹${item.price}` : <TranslatedText>Free</TranslatedText>}
                        </span>
                            {item.originalPrice > item.price && (
                          <span className="text-xs text-gray-500 line-through">
                                ₹{item.originalPrice}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Check if book is free
                            if (isFreeBook(item)) {
                              const isEbook = item.badge === "E-Book" || item.format === "ebook";
                              
                              if (isEbook) {
                                // Free ebook - redirect to free library reader
                                navigate(`/free-library/ebook/${item.id}/read`);
                              } else {
                                // Free physical book - redirect to book detail page
                                navigate(`/books/${item.id}`);
                              }
                            } else {
                              // Paid book - redirect directly to Razorpay
                              if (!isAuthenticated) {
                                toast.info("Please log in to purchase this book");
                                navigate("/login/student");
                                return;
                              }
                              // Validate price
                              const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
                              if (!itemPrice || itemPrice <= 0) {
                                toast.error("This book price is not available. Please contact support.");
                                return;
                              }
                              
                              redirectToRazorpay({
                                bookId: item.id,
                                amount: itemPrice,
                                currency: "AED",
                                description: `Payment for ${item.title || "book"}`,
                                userName: user?.fullName || "",
                                userEmail: user?.email || "",
                                userPhone: user?.phone || "",
                                quantity: 1,
                              });
                            }
                          }}
                          className="w-full bg-[#D4AF37] text-black py-2 rounded-lg font-bold text-xs hover:bg-[#E5C158] transition-colors duration-200">
                          {isFreeBook(item) ? <TranslatedText>Get Free</TranslatedText> : <TranslatedText>Buy Now</TranslatedText>}
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
                  );
                }
              })}
            </div>
          ) : !isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20">
              {allItems.length === 0 ? (
                <>
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-display">
                    <TranslatedText>No courses or books available yet</TranslatedText>
                  </h3>
                  <p className="text-gray-400 mb-6">
                    <TranslatedText>Approved courses and books will appear here once they are published.</TranslatedText>
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-display">
                    <TranslatedText>No items found</TranslatedText>
                  </h3>
                  <p className="text-gray-400 mb-6">
                    <TranslatedText>Try adjusting your search or filter criteria</TranslatedText>
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedType("all");
                    }}
                    className="text-[#D4AF37] hover:text-[#E5C158] transition-colors">
                    <TranslatedText>Clear filters</TranslatedText>
                  </button>
                </>
              )}
            </motion.div>
          ) : null}
          </div>
        </section>
    </div>
  );
};

export default JoinBuildAfterLife;
