import { useMemo } from "react";
import { motion as Motion } from "framer-motion";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { useBlogs } from "../../../src/contexts/BlogContext";

const FILTER_SORT_OPTIONS = [
  { label: "Trending", value: "trending" },
  { label: "Recent", value: "recent" },
  { label: "Most Viewed", value: "views" },
  { label: "Top Rated", value: "popular" },
];

const BlogCategoryFilter = () => {
  const { blogs, activeFilters, setActiveFilters, categories: apiCategories, tags: apiTags } = useBlogs();

  const { categories, tags } = useMemo(() => {
    // Use API categories/tags if available, otherwise extract from blogs
    if (apiCategories && apiCategories.length > 0) {
      const categorySet = new Set(["all", ...apiCategories.map((c) => c.name)]);
      const tagSet = new Set(apiTags?.map((t) => t.name) || []);
      return {
        categories: Array.from(categorySet),
        tags: Array.from(tagSet),
      };
    }

    // Fallback: extract from blogs
    const categorySet = new Set(["all"]);
    const tagSet = new Set();

    blogs.forEach((blog) => {
      if (blog.category) categorySet.add(blog.category);
      blog.tags?.forEach((tag) => tagSet.add(tag));
    });

    return {
      categories: Array.from(categorySet),
      tags: Array.from(tagSet),
    };
  }, [blogs, apiCategories, apiTags]);

  const handleCategoryChange = (category) => {
    setActiveFilters((prev) => ({
      ...prev,
      category,
    }));
  };

  const handleSortChange = (sort) => {
    setActiveFilters((prev) => ({
      ...prev,
      sort,
    }));
  };

  const handleTagToggle = (tag) => {
    setActiveFilters((prev) => {
      const alreadySelected = prev.tags.includes(tag);
      const nextTags = alreadySelected
        ? prev.tags.filter((item) => item !== tag)
        : [...prev.tags, tag];
      return {
        ...prev,
        tags: nextTags,
      };
    });
  };

  return (
    <Motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white">
          <HiOutlineAdjustmentsHorizontal className="h-5 w-5 text-[#D4AF37]" />
          <h3 className="text-base font-semibold">Refine Your Feed</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_SORT_OPTIONS.map((option) => {
            const isActive = activeFilters.sort === option.value;
            return (
              <Motion.button
                key={option.value}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSortChange(option.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#F5D26A] text-black shadow-lg"
                    : "border border-white/10 bg-[#121212] text-gray-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                }`}>
                {option.label}
              </Motion.button>
            );
          })}
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = activeFilters.category === category;
              return (
                <Motion.button
                  key={category}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCategoryChange(category)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
                    isActive
                      ? "bg-[#D4AF37]/20 text-[#F5D26A] border border-[#D4AF37]/60"
                      : "border border-white/10 bg-[#0d0d0d] text-gray-300 hover:text-[#D4AF37]"
                  }`}>
                  {category}
                </Motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
            Tags
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {tags.length === 0 && (
              <p className="col-span-full text-sm text-gray-400">
                Tags will appear as blogs are created.
              </p>
            )}
            {tags.map((tag) => {
              const isSelected = activeFilters.tags.includes(tag);
              return (
                <Motion.button
                  key={tag}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTagToggle(tag)}
                  className={`flex min-h-[40px] w-full items-center justify-center rounded-xl border px-3 py-2 text-center text-xs font-medium transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? "bg-gradient-to-r from-[#D4AF37]/30 to-[#F5D26A]/30 text-[#F5D26A] border-[#D4AF37]/50"
                      : "border-white/10 bg-[#0f0f0f] text-gray-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                  }`}>
                  <span className="truncate w-full">#{tag}</span>
                </Motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </Motion.section>
  );
};

export default BlogCategoryFilter;


