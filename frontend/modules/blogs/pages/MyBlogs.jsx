import { useMemo, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineCubeTransparent, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { useBlogs } from "../../../src/contexts/BlogContext";
import { useUser } from "../../../src/contexts/UserContext";
import TranslatedText from "../../../src/components/TranslatedText";

const tabs = [
  { label: <TranslatedText>Published</TranslatedText>, id: "published" },
  { label: <TranslatedText>Drafts</TranslatedText>, id: "drafts" },
  { label: <TranslatedText>Pending Review</TranslatedText>, id: "pending" },
];

const MyBlogs = () => {
  const { blogs, drafts, deleteBlog, analytics } = useBlogs();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState("published");

  const publishedBlogs = useMemo(
    () => blogs.filter((blog) => blog.author.id === profile.id),
    [blogs, profile.id]
  );

  const draftBlogs = useMemo(
    () => drafts.filter((draft) => draft.status === "draft"),
    [drafts]
  );

  const pendingBlogs = useMemo(
    () => drafts.filter((draft) => draft.status === "pending"),
    [drafts]
  );

  const handleDelete = (id) => {
    deleteBlog(id);
    toast.info(<TranslatedText>Blog removed from your workspace</TranslatedText>);
  };

  const getTabData = () => {
    switch (activeTab) {
      case "drafts":
        return draftBlogs;
      case "pending":
        return pendingBlogs;
      default:
        return publishedBlogs;
    }
  };

  const currentBlogs = getTabData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-black pt-[94px] md:pt-[104px] text-white">
      <SEO
        title={<TranslatedText>My Blogs Dashboard | AELA</TranslatedText>}
        description={<TranslatedText>Track published, draft and review blogs, monitor views, likes, and comments in your personal creator hub.</TranslatedText>}
        keywords="my blogs, blog analytics, drafts dashboard, creator hub"
        type="profile"
      />
      <div className="mx-auto flex w-full max-w-[1150px] flex-col gap-10 px-4 pb-20 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4 pt-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#F5D26A]">
            <TranslatedText>My Blogs Hub</TranslatedText>
          </span>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            <TranslatedText>Lead conversations with your published insights.</TranslatedText>
          </h1>
          <p className="text-sm text-gray-300">
            <TranslatedText>Track performance, continue drafts, and plan your publishing calendar with aela-level analytics.</TranslatedText>
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#080808]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70"><TranslatedText>Total Blogs</TranslatedText></p>
            <p className="mt-3 text-3xl font-semibold text-white">{analytics.totalBlogs}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#080808]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70"><TranslatedText>Total Views</TranslatedText></p>
            <p className="mt-3 text-3xl font-semibold text-white">{analytics.totalViews.toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#080808]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70"><TranslatedText>Total Likes</TranslatedText></p>
            <p className="mt-3 text-3xl font-semibold text-white">{analytics.totalLikes.toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#080808]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70"><TranslatedText>Total Comments</TranslatedText></p>
            <p className="mt-3 text-3xl font-semibold text-white">{analytics.totalComments.toLocaleString()}</p>
          </div>
        </section>

        <nav className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-[#080808]/80 p-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#F5D26A] text-black shadow-lg shadow-[#D4AF37]/30"
                    : "text-gray-300 hover:text-[#D4AF37]"
                }`}>
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className="space-y-4">
          <AnimatePresence>
            {currentBlogs.map((blog) => (
              <Motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#080808]/80 p-6 shadow-[0_28px_75px_rgba(0,0,0,0.55)] md:flex-row md:items-center">
                <img
                  src={blog.thumbnail || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80"}
                  alt={blog.title}
                  className="h-28 w-full rounded-2xl object-cover md:h-24 md:w-48"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#F5D26A]">
                      {blog.status?.toUpperCase() || "PUBLISHED"}
                    </span>
                    <p className="text-sm text-gray-400">
                      <TranslatedText>Updated</TranslatedText> {new Date(blog.updatedAt || blog.publishedAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <h3 className="text-lg font-semibold text-white"><TranslatedText>{blog.title}</TranslatedText></h3>
                  <p className="text-sm text-gray-300 line-clamp-2">
                    <TranslatedText>{blog.excerpt || blog.content?.replace(/<[^>]+>/g, " ").slice(0, 140)}</TranslatedText>
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span><TranslatedText>Likes</TranslatedText> · {blog.likeCount ?? blog.likes ?? 0}</span>
                    <span><TranslatedText>Comments</TranslatedText> · {blog.commentCount ?? 0}</span>
                    <span><TranslatedText>Views</TranslatedText> · {blog.views?.toLocaleString?.() ?? 0}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:w-[160px]">
                  <Link
                    to={blog.status === "draft" ? "/blogs/create" : `/blogs/${blog.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#101010]/80 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
                    <HiOutlinePencil className="h-4 w-4" />
                    {blog.status === "draft" ? <TranslatedText>Continue</TranslatedText> : <TranslatedText>View</TranslatedText>}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(blog.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#101010]/80 px-4 py-2 text-sm font-semibold text-red-300/80 transition hover:border-red-400/60 hover:text-red-200">
                    <HiOutlineTrash className="h-4 w-4" />
                    <TranslatedText>Delete</TranslatedText>
                  </button>
                </div>
              </Motion.article>
            ))}
          </AnimatePresence>

          {currentBlogs.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/15 bg-[#070707]/70 p-12 text-center text-gray-300">
              <HiOutlineCubeTransparent className="h-12 w-12 text-[#D4AF37]" />
              <h3 className="text-lg font-semibold text-white"><TranslatedText>No blogs yet</TranslatedText></h3>
              <p className="text-sm">
                <TranslatedText>Start a new story to inspire the community.</TranslatedText>
              </p>
              <Link
                to="/blogs/create"
                className="rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F5D26A] px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/30">
                <TranslatedText>Create your first blog</TranslatedText>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MyBlogs;


