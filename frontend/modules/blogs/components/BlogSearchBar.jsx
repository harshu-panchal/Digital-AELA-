import { motion as Motion } from "framer-motion";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { useBlogs } from "../../../src/contexts/BlogContext";

const shimmerVariants = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%"],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const BlogSearchBar = ({
  placeholder = "Search blogs, tags or authors",
  onSubmit,
}) => {
  const { searchTerm, setSearchTerm, performSearch, activeFilters } = useBlogs();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      // Use advanced search API
      await performSearch({
        q: searchTerm,
        category: activeFilters.category !== "all" ? activeFilters.category : undefined,
        tags: activeFilters.tags.length > 0 ? activeFilters.tags.join(",") : undefined,
        sortBy: activeFilters.sort || "recent",
      });
    }
    onSubmit?.(searchTerm);
  };

  return (
    <Motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full">
      <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-[#090909]/90 px-4 py-3 text-white shadow-[0_12px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <Motion.span
          variants={shimmerVariants}
          animate="animate"
          className="hidden h-16 w-16 rounded-full bg-gradient-to-r from-[#D4AF37]/30 via-transparent to-[#D4AF37]/30 blur-3xl lg:block"
        />

        <HiOutlineMagnifyingGlass className="h-5 w-5 flex-shrink-0 text-[#D4AF37]" />

        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none"
        />

        <div className="flex items-center gap-2">
          <Motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5D26A] px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/40 transition hover:brightness-110">
            Search
          </Motion.button>
        </div>
      </div>
    </Motion.form>
  );
};

export default BlogSearchBar;


