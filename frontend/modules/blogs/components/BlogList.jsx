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
  show: { opacity: 1, y: 0 },
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
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-400">
          {emptyState || "No blogs available yet. Be the first to create one!"}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {(title || description) && (
        <header className="space-y-2">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {description && (
            <p className="text-sm text-gray-400">{description}</p>
          )}
        </header>
      )}

      <Motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={
          layout === "slider"
            ? "flex gap-4 overflow-x-auto pb-4"
            : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        }>
        {visibleBlogs.map((blog) => (
          <Motion.article
            key={blog.id}
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.01 }}
            className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111111] via-[#0c0c0c] to-black shadow-[0_20px_45px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#D4AF37]/50">
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={blog.thumbnail}
                alt={blog.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                {blog.category}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <img
                  src={blog.author.avatar}
                  alt={blog.author.name}
                  className="h-10 w-10 rounded-full border border-[#D4AF37]/40 object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {blog.author.name}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                    {formatTimestamp(blog.publishedAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to={`/blogs/${blog.id}`}
                  onClick={() => registerView(blog.id)}
                  className="block text-lg font-semibold text-white transition hover:text-[#D4AF37]">
                  {blog.title}
                </Link>
                <p className="text-sm text-gray-300 line-clamp-3">
                  {blog.excerpt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex max-w-full items-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#F5D26A]">
                      <span className="truncate">#{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between text-sm text-gray-300">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <HiOutlineClock className="h-4 w-4 text-[#D4AF37]" />
                    {blog.readTime} min read
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FaRegEye className="h-4 w-4 text-[#D4AF37]" />
                    {blog.views.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleLike(blog.id)}
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
          </Motion.article>
        ))}
      </Motion.div>
    </section>
  );
};

export default BlogList;


