import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  HiOutlineArrowLeft,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineHeart,
  HiOutlineMegaphone,
} from "react-icons/hi2";
import { FaShareNodes } from "react-icons/fa6";
import CommentBox from "../components/CommentBox";
import BlogList from "../components/BlogList";
import SEO from "../../../src/components/SEO";
import { useBlogs } from "../../../src/contexts/BlogContext";

const BlogDetails = () => {
  const {
    blogs,
    toggleLike,
    registerView,
    followAuthor,
    isFollowing,
    formatTimestamp,
    addReaction,
    shareBlogPost,
  } = useBlogs();
  const { id } = useParams();
  const navigate = useNavigate();

  const blog = useMemo(() => blogs.find((item) => item.id === id), [blogs, id]);

  const structuredData = useMemo(() => {
    if (!blog) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blog.title,
      description: blog.excerpt,
      image: blog.banner || blog.thumbnail,
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt || blog.publishedAt,
      author: {
        "@type": "Person",
        name: blog.author.name,
      },
      publisher: {
        "@type": "Organization",
        name: "Digital AELA",
        logo: {
          "@type": "ImageObject",
          url: "https://digitalaela.com/og-image.jpg",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://digitalaela.com/blogs/${blog.id}`,
      },
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: blog.likeCount,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/CommentAction",
          userInteractionCount: blog.commentCount,
        },
      ],
    };
  }, [blog]);

  useEffect(() => {
    if (blog) {
      registerView(blog.id);
    }
  }, [blog, registerView]);

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-black pt-[124px] text-white">
        <SEO
          title="Blog not found | Digital AELA"
          description="The blog you are looking for may have been unpublished or moved. Discover other inspiring stories from the Digital AELA community."
          keywords="blog missing, digital aela blog"
        />
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold">The blog you are looking for is unavailable.</h1>
          <p className="text-sm text-gray-400">
            It may have been unpublished or moved. Explore other inspiring stories from the community.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-2xl border border-white/15 bg-[#121212] px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const relatedBlogs = blogs
    .filter((item) => item.id !== blog.id && item.category === blog.category)
    .slice(0, 3);

  const handleShare = async (platform) => {
    if (platform) {
      await shareBlogPost(blog.id, platform);
    } else {
      try {
        if (navigator.share) {
          await navigator.share({
            title: blog.title,
            text: blog.excerpt,
            url: window.location.href,
          });
        } else {
          await shareBlogPost(blog.id, "copy");
        }
      } catch (error) {
        console.error("Share action failed", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-black pt-[124px] text-white">
      <SEO
        title={`${blog.title} | AELA Blogs`}
        description={blog.excerpt}
        keywords={`${blog.tags.join(", ")}, ${blog.category}, Digital AELA blog`}
        image={blog.banner || blog.thumbnail}
        type="article"
      />
      {structuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      )}
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-10 px-4 pb-20 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#101010]/70 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
            <HiOutlineArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="space-y-4">
            <Motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
              {blog.title}
            </Motion.h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span>{formatTimestamp(blog.publishedAt)}</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
                {blog.category}
              </span>
              <span>{blog.readTime} min read</span>
            </div>
          </div>
        </header>

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
          <img
            src={blog.banner || blog.thumbnail}
            alt={blog.title}
            className="h-[340px] w-full object-cover"
          />
        </Motion.div>

        <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#060606]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:flex-row">
          <div className="flex flex-1 items-start gap-4">
            <img
              src={blog.author.avatar}
              alt={blog.author.name}
              className="h-16 w-16 rounded-full border border-[#D4AF37]/40 object-cover"
            />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-white">{blog.author.name}</p>
              <p className="text-sm text-gray-300">{blog.author.bio}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span>{blog.author.role}</span>
                <span>·</span>
                <span>{blog.author.followers.toLocaleString()} followers</span>
              </div>
              {blog.author.social?.url && (
                <a
                  href={blog.author.social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5D26A] transition hover:underline">
                  Connect on {blog.author.social.platform}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleLike(blog.id)}
              className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-[#F5D26A]">
              <HiOutlineHeart className="h-5 w-5" />
              {blog.likeCount} likes
            </Motion.button>

            {/* Reactions Dropdown */}
            <div className="relative group">
              <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101010]/80 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                <HiOutlineHandThumbUp className="h-4 w-4" />
                React
              </Motion.button>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10">
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-2 shadow-lg flex flex-col gap-1 min-w-[150px]">
                  <button
                    onClick={() => addReaction(blog.id, "love")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    ❤️ Love
                  </button>
                  <button
                    onClick={() => addReaction(blog.id, "insightful")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    💡 Insightful
                  </button>
                  <button
                    onClick={() => addReaction(blog.id, "helpful")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    👍 Helpful
                  </button>
                </div>
              </div>
            </div>

            {/* Share Dropdown */}
            <div className="relative group">
              <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101010]/80 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                <FaShareNodes className="h-4 w-4" />
                Share
              </Motion.button>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10">
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-2 shadow-lg flex flex-col gap-1 min-w-[150px]">
                  <button
                    onClick={() => handleShare("facebook")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    📘 Facebook
                  </button>
                  <button
                    onClick={() => handleShare("twitter")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    🐦 Twitter
                  </button>
                  <button
                    onClick={() => handleShare("linkedin")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    💼 LinkedIn
                  </button>
                  <button
                    onClick={() => handleShare("copy")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    📋 Copy Link
                  </button>
                </div>
              </div>
            </div>

            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => followAuthor(blog.author.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isFollowing(blog.author.id)
                  ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                  : "border border-white/10 bg-[#101010]/80 text-gray-200 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
              }`}>
              <HiOutlineMegaphone className="h-4 w-4" />
              {isFollowing(blog.author.id) ? "Following" : "Follow Author"}
            </Motion.button>
          </div>
        </section>

        <article className="prose prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-[#F5D26A] prose-blockquote:border-[#D4AF37]/40 prose-blockquote:text-[#F5D26A] prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-8 prose-h1:mb-4 prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-5 prose-h3:mb-2 prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-4 prose-h4:mb-2 max-w-none rounded-3xl border border-white/10 bg-[#050505]/80 p-8 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
          <div dangerouslySetInnerHTML={{ __html: blog.content }} />
        </article>

        <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#080808]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
          <h3 className="text-lg font-semibold text-white">More from this author</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {blogs
              .filter((item) => item.author.id === blog.author.id && item.id !== blog.id)
              .slice(0, 2)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/blogs/${item.id}`)}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101010]/80 p-3 text-left transition hover:border-[#D4AF37]/50">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white line-clamp-2">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatTimestamp(item.publishedAt)}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </section>

        <CommentBox blogId={blog.id} comments={blog.comments} />

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <HiOutlineChatBubbleOvalLeft className="h-5 w-5" />
            <h3 className="text-lg font-semibold text-white">Related blogs</h3>
          </div>
          <BlogList
            blogs={relatedBlogs}
            layout="slider"
            emptyState="Explore other categories in the main Blogs hub."
          />
        </section>
      </div>
    </div>
  );
};

export default BlogDetails;


