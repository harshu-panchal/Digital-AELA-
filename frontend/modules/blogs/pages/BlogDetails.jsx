import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  HiOutlineArrowLeft,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineHandThumbUp,
  HiOutlineHeart,
  HiOutlineMegaphone,
} from "react-icons/hi2";
import { FaShareNodes } from "react-icons/fa6";
import CommentBox from "../components/CommentBox";
import BlogList from "../components/BlogList";
import SEO from "../../../src/components/SEO";
import { useBlogs } from "../../../src/contexts/BlogContext";
import { useDynamicTranslation } from "../../../src/hooks/useDynamicTranslation";
import { useLanguage } from "../../../src/contexts/LanguageContext";
import { normalizeLanguageCode } from "../../../src/utils/languageUtils";
import TranslatedText from "../../../src/components/TranslatedText";

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
  const location = useLocation();

  const blog = useMemo(() => blogs.find((item) => item.id === id), [blogs, id]);
  
  // Translation hooks
  const { language } = useLanguage();
  const { translate, translateObject } = useDynamicTranslation();
  const [translatedBlog, setTranslatedBlog] = useState(null);

  // Use translated blog if available, otherwise use original
  const displayBlog = translatedBlog || blog;

  const structuredData = useMemo(() => {
    if (!displayBlog) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: displayBlog.title,
      description: displayBlog.excerpt,
      image: displayBlog.banner || displayBlog.thumbnail,
      datePublished: displayBlog.publishedAt,
      dateModified: displayBlog.updatedAt || displayBlog.publishedAt,
      author: {
        "@type": "Person",
        name: displayBlog.author.name,
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
        "@id": `https://digitalaela.com/blogs/${displayBlog.id}`,
      },
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: displayBlog.likeCount,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/CommentAction",
          userInteractionCount: displayBlog.commentCount,
        },
      ],
    };
  }, [displayBlog]);

  // Register view only once when blog ID changes, not when blog object changes
  useEffect(() => {
    if (id) {
      registerView(id);
    }
  }, [id, registerView]); // Only depend on id and registerView, not blog object (which changes when views update)

  // Scroll to top and reset when blog ID or location changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, location.key]);

  // Helper function to translate HTML content by preserving structure
  const translateHTMLContent = async (htmlContent) => {
    if (!htmlContent || normalizeLanguageCode(language) === "en") {
      return htmlContent;
    }

    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;

      // Extract all text nodes (excluding script, style, and other non-translatable elements)
      const textNodes = [];
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip text nodes inside script, style, and other non-translatable tags
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            
            const tagName = parent.tagName?.toLowerCase();
            const skipTags = ['script', 'style', 'noscript', 'code', 'pre'];
            if (skipTags.includes(tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            
            // Only include text nodes with actual content
            const text = node.textContent?.trim();
            if (!text || text.length === 0) {
              return NodeFilter.FILTER_REJECT;
            }
            
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let node;
      const nodeMap = new Map(); // Map to store original text and its node
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          textNodes.push(text);
          nodeMap.set(text, node);
        }
      }

      if (textNodes.length === 0) {
        return htmlContent;
      }

      // Translate all text nodes in batch
      const { translateBatch } = await import("../../../src/services/translationService");
      const normalizedLang = normalizeLanguageCode(language);
      const translatedTexts = await translateBatch(textNodes, language, "en");

      // Replace text in nodes
      translatedTexts.forEach((translatedText, index) => {
        const originalText = textNodes[index];
        const node = nodeMap.get(originalText);
        if (node && translatedText) {
          node.textContent = translatedText;
        }
      });

      // Return the translated HTML
      return tempDiv.innerHTML;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[BlogDetails] Error translating HTML content:", error);
      return htmlContent; // Return original on error
    }
  };

  // Translate blog content when language changes
  useEffect(() => {
    const translateBlogContent = async () => {
      if (!blog) {
        setTranslatedBlog(null);
        return;
      }

      if (normalizeLanguageCode(language) === "en") {
        setTranslatedBlog(blog);
        return;
      }

      try {
        // Translate title and excerpt
        const translatedTitle = await translate(blog.title);
        const translatedExcerpt = blog.excerpt ? await translate(blog.excerpt) : blog.excerpt;
        
        // Translate HTML content while preserving structure
        const translatedContent = await translateHTMLContent(blog.content || "");
        
        setTranslatedBlog({
          ...blog,
          title: translatedTitle,
          excerpt: translatedExcerpt,
          content: translatedContent,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[BlogDetails] Error translating blog:", error);
        setTranslatedBlog(blog);
      }
    };

    translateBlogContent();
  }, [blog, language, translate]);

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-black pt-[94px] md:pt-[104px] text-white">
        <SEO
          title={<TranslatedText>Blog not found | Digital AELA</TranslatedText>}
          description={<TranslatedText>The blog you are looking for may have been unpublished or moved. Discover other inspiring stories from the Digital AELA community.</TranslatedText>}
          keywords="blog missing, digital aela blog"
        />
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold"><TranslatedText>The blog you are looking for is unavailable.</TranslatedText></h1>
          <p className="text-sm text-gray-400">
            <TranslatedText>It may have been unpublished or moved. Explore other inspiring stories from the community.</TranslatedText>
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-2xl border border-white/15 bg-[#121212] px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
            <TranslatedText>Go Back</TranslatedText>
          </button>
        </div>
      </div>
    );
  }

  const relatedBlogs = blogs
    .filter((item) => item.id !== displayBlog.id && item.category === displayBlog.category)
    .slice(0, 3);

  const handleShare = async (platform) => {
    if (platform) {
      await shareBlogPost(displayBlog.id, platform);
    } else {
      try {
        if (navigator.share) {
          await navigator.share({
            title: displayBlog.title,
            text: displayBlog.excerpt,
            url: window.location.href,
          });
        } else {
          await shareBlogPost(displayBlog.id, "copy");
        }
      } catch (error) {
        console.error("Share action failed", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-black pt-[94px] md:pt-[104px] text-white">
      <SEO
        title={`${displayBlog.title} | AELA Blogs`}
        description={displayBlog.excerpt}
        keywords={`${displayBlog.tags.join(", ")}, ${displayBlog.category}, Digital AELA blog`}
        image={displayBlog.banner || displayBlog.thumbnail}
        type="article"
      />
      {structuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      )}
      <div key={displayBlog.id} className="mx-auto flex w-full max-w-[1080px] flex-col gap-10 px-4 pb-20 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#101010]/70 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
            <HiOutlineArrowLeft className="h-4 w-4" />
            <TranslatedText>Back</TranslatedText>
          </button>

          <div className="space-y-4">
            <Motion.h1
              key={`title-${displayBlog.id}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
              <TranslatedText>{displayBlog.title}</TranslatedText>
            </Motion.h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span>{formatTimestamp(displayBlog.publishedAt)}</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D26A]">
                <TranslatedText>{displayBlog.category}</TranslatedText>
              </span>
              <span><TranslatedText>{displayBlog.readTime}</TranslatedText> <TranslatedText>min read</TranslatedText></span>
            </div>
          </div>
        </header>

        <Motion.div
          key={`banner-${displayBlog.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
          <img
            src={displayBlog.banner || displayBlog.thumbnail}
            alt={displayBlog.title}
            className="h-[340px] w-full object-cover"
          />
        </Motion.div>

        <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#060606]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:flex-row">
          <div className="flex flex-1 items-start gap-4">
            <img
              src={displayBlog.author.avatar}
              alt={displayBlog.author.name}
              className="h-16 w-16 rounded-full border border-[#D4AF37]/40 object-cover"
            />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-white"><TranslatedText>{displayBlog.author.name}</TranslatedText></p>
              <p className="text-sm text-gray-300"><TranslatedText>{displayBlog.author.bio}</TranslatedText></p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span><TranslatedText>{displayBlog.author.role}</TranslatedText></span>
                <span>·</span>
                <span><TranslatedText>{displayBlog.author.followers.toLocaleString()} followers</TranslatedText></span>
              </div>
              {displayBlog.author.social?.url && (
                <a
                  href={displayBlog.author.social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5D26A] transition hover:underline">
                  <TranslatedText>Connect on</TranslatedText> <TranslatedText>{displayBlog.author.social.platform}</TranslatedText>
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleLike(displayBlog.id)}
              className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-[#F5D26A]">
              <HiOutlineHeart className="h-5 w-5" />
              <TranslatedText>{displayBlog.likeCount} likes</TranslatedText>
            </Motion.button>

            {/* Reactions Dropdown */}
            <div className="relative group">
              <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101010]/80 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                <HiOutlineHandThumbUp className="h-4 w-4" />
                <TranslatedText>React</TranslatedText>
              </Motion.button>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10">
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-2 shadow-lg flex flex-col gap-1 min-w-[150px]">
                  <button
                    onClick={() => addReaction(displayBlog.id, "love")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    ❤️ <TranslatedText>Love</TranslatedText>
                  </button>
                  <button
                    onClick={() => addReaction(displayBlog.id, "insightful")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    💡 <TranslatedText>Insightful</TranslatedText>
                  </button>
                  <button
                    onClick={() => addReaction(displayBlog.id, "helpful")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    👍 <TranslatedText>Helpful</TranslatedText>
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
                <TranslatedText>Share</TranslatedText>
              </Motion.button>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10">
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-2 shadow-lg flex flex-col gap-1 min-w-[150px]">
                  <button
                    onClick={() => handleShare("facebook")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    📘 <TranslatedText>Facebook</TranslatedText>
                  </button>
                  <button
                    onClick={() => handleShare("twitter")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    🐦 <TranslatedText>Twitter</TranslatedText>
                  </button>
                  <button
                    onClick={() => handleShare("linkedin")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    💼 <TranslatedText>LinkedIn</TranslatedText>
                  </button>
                  <button
                    onClick={() => handleShare("copy")}
                    className="text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-[#D4AF37] transition">
                    📋 <TranslatedText>Copy Link</TranslatedText>
                  </button>
                </div>
              </div>
            </div>

            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => followAuthor(displayBlog.author.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isFollowing(displayBlog.author.id)
                  ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                  : "border border-white/10 bg-[#101010]/80 text-gray-200 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
              }`}>
              <HiOutlineMegaphone className="h-4 w-4" />
              {isFollowing(displayBlog.author.id) ? <TranslatedText>Following</TranslatedText> : <TranslatedText>Follow Author</TranslatedText>}
            </Motion.button>
          </div>
        </section>

        <article className="prose prose-invert max-w-none rounded-3xl border border-white/10 bg-[#050505]/80 p-8 shadow-[0_28px_75px_rgba(0,0,0,0.55)] [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-white [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-white [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-white [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-white [&_p]:text-gray-300 [&_p]:my-4 [&_strong]:text-[#F5D26A] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_li]:text-gray-300 [&_li]:my-1.5 [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#D4AF37]/40 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:my-4 [&_blockquote]:text-[#F5D26A] [&_blockquote]:italic [&_blockquote]:text-base [&_blockquote]:bg-[#0a0a0a]/50 [&_blockquote]:py-2 [&_blockquote]:rounded-r [&_blockquote_p]:my-0">
          <div dangerouslySetInnerHTML={{ __html: displayBlog.content }} />
        </article>

        <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#080808]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
          <h3 className="text-lg font-semibold text-white"><TranslatedText>More from this author</TranslatedText></h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {blogs
              .filter((item) => item.author.id === displayBlog.author.id && item.id !== displayBlog.id)
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
                      <TranslatedText>{item.title}</TranslatedText>
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
            <h3 className="text-lg font-semibold text-white"><TranslatedText>Related blogs</TranslatedText></h3>
          </div>
          <BlogList
            blogs={relatedBlogs}
            layout="slider"
            emptyState={<TranslatedText>Explore other categories in the main Blogs hub.</TranslatedText>}
          />
        </section>
      </div>
    </div>
  );
};

export default BlogDetails;


