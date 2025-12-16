import { motion as Motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiOutlineArrowRight, HiOutlinePencilSquare } from "react-icons/hi2";
import BlogSearchBar from "../components/BlogSearchBar";
import BlogCategoryFilter from "../components/BlogCategoryFilter";
import BlogList from "../components/BlogList";
import SEO from "../../../src/components/SEO";
import { useBlogs } from "../../../src/contexts/BlogContext";
import TranslatedText from "../../../src/components/TranslatedText";

const BlogsHome = () => {
  const {
    trendingBlogs,
    recentBlogs,
    filteredBlogs,
    isAuthenticated,
    setSearchTerm,
    refreshBlogs,
    isLoading,
    loadError,
  } = useBlogs();
  const location = useLocation();

  const { metaDescription, metaKeywords } = useMemo(() => {
    const keywordSet = new Set([
      "AELA Blogs",
      "Digital AELA",
      "public speaking",
      "learning community",
      "soft skills",
      "teachers",
      "learners",
    ]);

    filteredBlogs.slice(0, 12).forEach((blog) => {
      blog.tags.forEach((tag) => keywordSet.add(tag));
      keywordSet.add(blog.category);
    });

    const descriptionBase =
      "Explore trending learner and mentor stories inside the Digital AELA community. Discover tips, speaking challenges, and learning opportunities."; // This will be translated via SEO component

    return {
      metaDescription: descriptionBase,
      metaKeywords: Array.from(keywordSet).join(", "),
    };
  }, [filteredBlogs]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authorParam = params.get("author");
    if (authorParam) {
      setSearchTerm(authorParam);
    }
  }, [location.search, setSearchTerm]);

  useEffect(() => {
    refreshBlogs();
  }, [refreshBlogs]);

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-[#050505] to-black pt-[94px] md:pt-[104px] text-white">
      <SEO
        title={<TranslatedText>AELA Blogs - Learn & Earn Stories</TranslatedText>}
        description={metaDescription}
        keywords={metaKeywords}
        type="website"
      />
      <div className="layout-container flex w-full flex-col gap-12 pb-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#0d0d0d] via-[#070707] to-black p-8 shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
          <Motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#F5D26A]">
              <TranslatedText>AELA Blogs</TranslatedText>
            </span>
            <h1 className="clamp-heading font-semibold text-balance">
              <TranslatedText>Stories, strategies, and wins from the Digital AELA community.</TranslatedText>
            </h1>
            <p className="text-sm text-gray-300 sm:text-base text-balance">
              <TranslatedText>Explore the journeys of speakers, educators, and learners. Publish your ideas, grow your influence, and connect with the community.</TranslatedText>
            </p>

            {isAuthenticated && (
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/blogs/create"
                  className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-[#D4AF37] to-[#F5D26A] px-5 py-3 text-sm font-semibold text-black shadow-xl shadow-[#D4AF37]/30 transition hover:brightness-110">
                  <HiOutlinePencilSquare className="h-5 w-5" />
                  <TranslatedText>Create Blog</TranslatedText>
                </Link>
                <Link
                  to="/my-blogs"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-[#101010]/80 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                  <TranslatedText>Manage My Blogs</TranslatedText>
                  <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="pointer-events-none absolute -right-16 top-8 hidden h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl lg:block"
          />
        </section>

        <BlogSearchBar />

        <div className="space-y-8">
          <div className="space-y-8">
            <BlogCategoryFilter />

            {loadError && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/15 p-4 text-sm text-red-200">
                {loadError.message || <TranslatedText>Unable to load blogs. Please try refreshing.</TranslatedText>}
              </div>
            )}

            {isLoading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <TranslatedText>Loading latest community posts…</TranslatedText>
              </div>
            )}

            <BlogList
              title={<TranslatedText>All Results</TranslatedText>}
              description={<TranslatedText>Personalized feed based on your filters and search.</TranslatedText>}
              blogs={filteredBlogs}
              emptyState={<TranslatedText>No blogs match your current filters. Try adjusting categories or tags.</TranslatedText>}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogsHome;
