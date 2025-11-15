import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaShoppingCart,
  FaBook,
  FaGraduationCap,
  FaClipboardList,
  FaArrowLeft,
  FaSpinner,
} from "react-icons/fa";
import SEO from "../../src/components/SEO";
import { fetchEbooks } from "../../src/services/api/resources";

const TeacherMarketplace = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all"); // all, course, ebook, quiz
  const [loading, setLoading] = useState(false);
  const [ebooks, setEbooks] = useState([]);

  // Sample data for courses and quizzes (can be replaced with API calls later)
  const [courses] = useState([
    {
      id: "course-1",
      title: "Leadership Storytelling Masterclass",
      mentor: "Sarah Thomas",
      type: "course",
      price: "AED 799",
      reason: "Great addition to your corporate communication bundle",
      image: "https://via.placeholder.com/300x200?text=Course",
    },
    {
      id: "course-2",
      title: "Advanced Public Speaking",
      mentor: "John Smith",
      type: "course",
      price: "AED 649",
      reason: "Perfect for enhancing your teaching portfolio",
      image: "https://via.placeholder.com/300x200?text=Course",
    },
  ]);

  const [quizzes] = useState([
    {
      id: "quiz-1",
      title: "Advanced Debate Challenges",
      mentor: "Mohammed Ali",
      type: "quiz",
      price: "AED 299",
      reason: "Boost Learn & Earn engagement",
      image: "https://via.placeholder.com/300x200?text=Quiz",
    },
    {
      id: "quiz-2",
      title: "Grammar Mastery Pack",
      mentor: "Emma Wilson",
      type: "quiz",
      price: "AED 199",
      reason: "Comprehensive grammar assessment tools",
      image: "https://via.placeholder.com/300x200?text=Quiz",
    },
  ]);

  useEffect(() => {
    const loadEbooks = async () => {
      try {
        setLoading(true);
        const response = await fetchEbooks({ page: 1, pageSize: 50 });
        const ebooksFromApi = (response.data || []).map((ebook) => {
          const price = ebook.metadata?.price !== undefined && ebook.metadata.price !== null && ebook.metadata.price !== "" ? Number(ebook.metadata.price) : 0;
          return {
            id: ebook._id,
            title: ebook.title,
            mentor: ebook.metadata?.author || "Digital AELA",
            type: "ebook",
            price: price > 0 ? `AED ${price}` : "Free",
            reason: "Enhance your teaching resources",
            image: ebook.metadata?.coverImage || "https://via.placeholder.com/300x200?text=E-Book",
          };
        });
        setEbooks(ebooksFromApi);
      } catch (error) {
        console.error("Failed to load ebooks:", error);
        toast.error("Failed to load ebooks from marketplace");
      } finally {
        setLoading(false);
      }
    };

    loadEbooks();
  }, []);

  // Combine all items
  const allItems = [
    ...courses.map((item) => ({ ...item, type: "course" })),
    ...ebooks.map((item) => ({ ...item, type: "ebook" })),
    ...quizzes.map((item) => ({ ...item, type: "quiz" })),
  ];

  // Filter items
  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case "course":
        return <FaGraduationCap className="w-4 h-4" />;
      case "ebook":
        return <FaBook className="w-4 h-4" />;
      case "quiz":
        return <FaClipboardList className="w-4 h-4" />;
      default:
        return <FaShoppingCart className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "course":
        return "Course";
      case "ebook":
        return "E-Book";
      case "quiz":
        return "Quiz Pack";
      default:
        return "Item";
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Teacher Marketplace | Digital AELA - Buy Courses, E-Books & Quiz Packs"
        description="Browse and purchase courses, e-books, and quiz packs from top mentors. Enhance your teaching resources with premium content."
        keywords="teacher marketplace, buy courses, e-books for teachers, quiz packs, teaching resources, mentor content"
        url="https://digitalaela.com/teacher/marketplace"
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
          <Link
            to="/teacher/dashboard"
            className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C158] transition-colors duration-200 mb-6">
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 font-display tracking-tight">
            Teacher <span className="text-[#D4AF37]">Marketplace</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-base text-gray-300 max-w-2xl mb-8">
            Discover premium courses, e-books, and quiz packs from top mentors.
            Enhance your teaching resources and grow your impact.
          </motion.p>

          {/* Search and Filters */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses, e-books, or quiz packs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] transition-colors duration-200"
              />
            </div>
            <div className="flex gap-2">
              {["all", "course", "ebook", "quiz"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 capitalize ${
                    selectedType === type
                      ? "bg-[#D4AF37] text-black"
                      : "bg-[#1a1a1a] border border-[#D4AF37]/30 text-white hover:border-[#D4AF37]"
                  }`}>
                  {type === "all" ? "All" : getTypeLabel(type)}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Marketplace Items */}
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
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedType !== "all" && ` in ${getTypeLabel(selectedType)}s`}
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <FaSpinner className="w-8 h-8 text-[#D4AF37] animate-spin" />
            </div>
          )}

          {/* Items Grid */}
          {!loading && filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
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
                  {/* Item Image */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-[#D4AF37] text-black px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                        {getTypeIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                  </div>

                  {/* Item Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="text-base font-bold text-white mb-1 font-display group-hover:text-[#D4AF37] transition-colors duration-300 line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Mentor */}
                    <p className="text-xs text-gray-400 mb-2">
                      by {item.mentor}
                    </p>

                    {/* Reason */}
                    <p className="text-xs text-gray-300 mb-3 line-clamp-2">
                      {item.reason}
                    </p>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                      <span className="text-lg font-bold text-[#D4AF37] font-display">
                        {item.price}
                      </span>
                      <button
                        onClick={() => {
                          // Navigate based on type
                          if (item.type === "ebook") {
                            navigate(`/books/${item.id}`);
                          } else if (item.type === "course") {
                            navigate(`/courses/${item.id}`);
                          } else {
                            toast.info("Quiz pack purchase coming soon!");
                          }
                        }}
                        className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-200 hover:text-sky-100 transition-colors">
                        View →
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-2xl font-bold text-white mb-2 font-display">
                No items found
              </h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("all");
                }}
                className="text-[#D4AF37] hover:text-[#E5C158] transition-colors">
                Clear filters
              </button>
            </motion.div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default TeacherMarketplace;

