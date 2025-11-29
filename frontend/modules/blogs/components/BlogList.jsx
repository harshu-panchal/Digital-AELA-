import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineHeart,
} from "react-icons/hi2";
import { FaRegEye } from "react-icons/fa6";
import { useBlogs } from "../../../src/contexts/BlogContext";
import TranslatedText from "../../../src/components/TranslatedText";

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  // Ensure visible state for newly added items
  visible: {
    opacity: 1,
    y: 0,
  }
};

// Utility function to strip HTML tags and get plain text
const stripHtmlTags = (html) => {
  if (!html) return "";
  // Create a temporary DOM element to parse HTML
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  // Get text content and clean up extra whitespace
  return tmp.textContent || tmp.innerText || ""; 
};

const BlogList = ({
  title,
  description,
  blogs,
  emptyState,
  layout = "grid",
  limit,
}) => {
  const { toggleLike, registerView, formatTimestamp } = useBlogs();

  const visibleBlogs = useMemo(() => {
    if (!Array.isArray(blogs)) return [];
    return typeof limit === "number" ? blogs.slice(0, limit) : blogs;
  }, [blogs, limit]);

  if (!visibleBlogs || visibleBlogs.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/60 p-8 text-center text-gray-300">
        <h3 className="text-lg font-semibold text-white">{typeof title === "string" ? title : title}</h3>
        <p className="mt-2 text-sm text-gray-400">
          {emptyState || <TranslatedText>No blogs available yet. Be the first to create one!</TranslatedText>}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {layout === "slider" && (
        <style>{`
          .blog-slider-scroll::-webkit-scrollbar {
            height: 8px;
          }
          .blog-slider-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .blog-slider-scroll::-webkit-scrollbar-thumb {
            background: rgba(212, 175, 55, 0.3);
            border-radius: 4px;
          }
          .blog-slider-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(212, 175, 55, 0.5);
          }
        `}</style>
      )}
      {(title || description) && (
        <header className="space-y-2">
          {title && <h3 className="text-lg font-semibold text-white">{typeof title === "string" ? title : title}</h3>}
          {description && (
            <p className="text-sm text-gray-400">{typeof description === "string" ? description : description}</p>
          )}
        </header>
      )}

      <Motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={`blog-list-${visibleBlogs.length}-${visibleBlogs[0]?.id || ''}`}
        className={
          layout === "slider"
            ? "blog-slider-scroll flex gap-4 overflow-x-auto pb-4 scroll-smooth -mx-4 px-4"
            : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
        style={
          layout === "slider"
            ? {
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(212, 175, 55, 0.3) transparent",
                WebkitOverflowScrolling: "touch",
              }
            : {}
        }>
        {visibleBlogs.map((blog, index) => (
          <Motion.article
            key={`${blog.id}-${blog.publishedAt || index}`}
            variants={cardVariants}
            initial={false}
            animate="show"
            whileHover={{ y: -6, scale: 1.01 }}
            style={{ opacity: 1 }}
            className={`group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#111111] via-[#0c0c0c] to-black shadow-[0_20px_45px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#D4AF37]/50 ${
              layout === "slider" 
                ? "w-[320px] sm:w-[360px] h-[480px] flex-shrink-0" 
                : "h-full"
            }`}>
            <Link
              to={`/blogs/${blog.id}`}
              onClick={() => registerView(blog.id)}
              className="flex h-full flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={blog.thumbnail}
                  alt={blog.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                  <TranslatedText>{blog.category}</TranslatedText>
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex-shrink-0 flex items-center gap-3">
                  <img
                    src={blog.author.avatar}
                    alt={blog.author.name}
                    className="h-10 w-10 rounded-full border border-[#D4AF37]/40 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      <TranslatedText>{blog.author.name}</TranslatedText>
                    </p>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                      {formatTimestamp(blog.publishedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-h-0 space-y-3">
                  <h3 className="block text-lg font-semibold text-white transition hover:text-[#D4AF37] line-clamp-2">
                    <TranslatedText>{blog.title}</TranslatedText>
                  </h3>
                  <p className="text-sm text-gray-300 line-clamp-3">
                    <TranslatedText>{stripHtmlTags(blog.excerpt)}</TranslatedText>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex max-w-full items-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#F5D26A]">
                        <span className="truncate">#<TranslatedText>{tag}</TranslatedText></span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 mt-auto flex items-center justify-between text-sm text-gray-300">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <HiOutlineClock className="h-4 w-4 text-[#D4AF37]" />
                      <TranslatedText>{blog.readTime} min read</TranslatedText>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FaRegEye className="h-4 w-4 text-[#D4AF37]" />
                      {blog.views.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleLike(blog.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#111]/80 px-3 py-1 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                      <HiOutlineHeart className="h-4 w-4" />
                      {blog.likeCount}
                    </button>
                    <span className="inline-flex items-center gap-1 text-xs">
                      <HiOutlineChatBubbleLeftRight className="h-4 w-4 text-[#D4AF37]" />
                      {blog.commentCount}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </Motion.article>
        ))}
      </Motion.div>
    </section>
  );
};

export default BlogList;


