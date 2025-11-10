import { motion as Motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiOutlineArrowRight, HiOutlinePencilSquare } from "react-icons/hi2";
import BlogSearchBar from "../components/BlogSearchBar";
import BlogCategoryFilter from "../components/BlogCategoryFilter";
import BlogList from "../components/BlogList";
import SEO from "../../../src/components/SEO";
import { useBlogs } from "../../../src/contexts/BlogContext";

const BlogsHome = () => {
  const {
    trendingBlogs,
    recentBlogs,
    filteredBlogs,
    isAuthenticated,
    setSearchTerm,
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
      "Explore trending learner and mentor stories inside the Digital AELA community. Discover tips, speaking challenges, and learning opportunities.";

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

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-[#050505] to-black pt-[124px] text-white">
      <SEO
        title="AELA Blogs - Learn & Earn Stories"
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
              AELA Blogs
            </span>
            <h1 className="clamp-heading font-semibold text-balance">
              Stories, strategies, and wins from the Digital AELA community.
            </h1>
            <p className="text-sm text-gray-300 sm:text-base text-balance">
              Explore the journeys of speakers, educators, and learners. Publish your ideas, grow your influence, and connect with the community.
            </p>

            {isAuthenticated && (
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/blogs/create"
                  className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-[#D4AF37] to-[#F5D26A] px-5 py-3 text-sm font-semibold text-black shadow-xl shadow-[#D4AF37]/30 transition hover:brightness-110">
                  <HiOutlinePencilSquare className="h-5 w-5" />
                  Create Blog
                </Link>
                <Link
                  to="/my-blogs"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-[#101010]/80 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                  Manage My Blogs
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

        <div className="grid gap-8 lg:grid-cols-[2.5fr_1fr]">
          <div className="space-y-8">
            <BlogCategoryFilter />

            <BlogList
              title="Trending Blogs"
              description="Most loved this week across the AELA community."
              blogs={trendingBlogs}
              limit={6}
            />

            <BlogList
              title="Latest from Learners"
              description="Fresh insights and reflections from our creators."
              blogs={recentBlogs}
              limit={6}
            />

            <BlogList
              title="All Results"
              description="Personalized feed based on your filters and search."
              blogs={filteredBlogs}
              emptyState="No blogs match your current filters. Try adjusting categories or tags."
            />
          </div>

          <aside className="flex w-full items-start">
            <section className="w-full rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-emerald-100 shadow-[0_20px_45px_rgba(16,185,129,0.2)]">
              <h3 className="text-lg font-semibold text-white">Engagement Tips</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Publish quality content regularly</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Engage with comments and feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Share insights and experiences</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Connect with other learners</span>
                </li>
              </ul>
              <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/70">
                Keep engaging · Grow your influence
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogsHome;


