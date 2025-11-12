import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBriefcase,
  HiOutlinePlusCircle,
  HiOutlineFolderOpen,
  HiOutlineTrash,
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlineNewspaper,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import PostGrid from "../components/PostGrid";
import ProfileHeader from "../components/ProfileHeader";
import CreateJobPostForm from "../components/CreateJobPostForm";
import { useExploreJobs } from "../context/ExploreJobsContext";
import {
  CURRENT_RECRUITER_USERNAME,
  highlightTags,
} from "../data/posts";
import { getRecruiterDashboard } from "../../../src/services/recruiterDashboard";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    recruiterPosts,
    currentRecruiterProfile,
    savedPostIds,
    appliedPostIds,
    toggleSavePost,
    deletePost,
    openComposer,
    closeComposer,
    composerState,
  } = useExploreJobs();
  const [dashboardData, setDashboardData] = useState(() => getRecruiterDashboard());

  useEffect(() => {
    setDashboardData(getRecruiterDashboard());
    const handleStorage = (event) => {
      if (event.key === "aela.recruiter.dashboard") {
        setDashboardData(getRecruiterDashboard());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const {
    actionShortcuts = [],
    applicantPipeline = [],
    talentSpotlight = [],
    ebookShelf = [],
    blogDrafts = [],
  } = dashboardData || {};

  const shortcutIcons = useMemo(
    () => ({
      briefcase: HiOutlineBriefcase,
      blog: HiOutlineNewspaper,
      users: HiOutlineUserGroup,
      book: HiOutlineBookOpen,
    }),
    []
  );

  const stats = useMemo(() => {
    const totalViews = recruiterPosts.reduce(
      (acc, post) => acc + (post.stats?.views ?? 0),
      0
    );
    const totalApplications = recruiterPosts.reduce(
      (acc, post) => acc + (post.stats?.applications ?? 0),
      0
    );
    const avgApplyRate = recruiterPosts.length
      ? Math.round(totalApplications / recruiterPosts.length)
      : 0;

    return [
      { label: "Active Roles", value: recruiterPosts.length },
      { label: "Total Views", value: totalViews },
      { label: "Applications", value: totalApplications },
      { label: "Avg. Applies / Post", value: `${avgApplyRate}` },
    ];
  }, [recruiterPosts]);

  const handleOpenPost = (post) => {
    navigate(`/explore-jobs/post/${post.id}`, {
      state: { backgroundLocation: location },
    });
  };

  const handleEdit = (post) => openComposer("job", post);

  const handleDelete = (postId) => deletePost(postId);

  const composerVisible = composerState.mode === "job";

  const handleShortcutClick = (shortcut) => {
    if (shortcut.to === "composer:job") {
      openComposer("job");
      return;
    }
    if (shortcut.to.startsWith("#")) {
      const target = document.querySelector(shortcut.to);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    navigate(shortcut.to);
  };

  return (
    <div className="space-y-10">
      <ProfileHeader
        profile={currentRecruiterProfile}
        roleBadge={
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            <HiOutlineBriefcase className="h-4 w-4" />
            Recruiter Mode
          </span>
        }
        actionSlot={
          <button
            type="button"
            onClick={() => openComposer("job")}
            className="inline-flex items-center gap-2 rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5">
            <HiOutlinePlusCircle className="h-5 w-5" />
            New Job Drop
          </button>
        }
        metrics={stats}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actionShortcuts.map((shortcut) => {
          const Icon =
            shortcutIcons[shortcut.icon] ?? HiOutlineBriefcase;
          return (
            <motion.button
              key={shortcut.id}
              onClick={() => handleShortcutClick(shortcut)}
              type="button"
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`group h-full rounded-3xl border bg-[#050505]/95 p-5 text-left shadow-[0_24px_80px_rgba(6,9,18,0.4)] transition ${shortcut.tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{shortcut.title}</p>
                  <p className="mt-2 text-xs text-slate-200/75">{shortcut.description}</p>
                </div>
                <Icon className="h-6 w-6 opacity-80" />
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80 transition group-hover:text-white">
                Open <HiOutlineArrowRight className="h-4 w-4" />
              </span>
            </motion.button>
          );
        })}
      </section>

      <section className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              Role Library
            </p>
            <h2 className="text-xl font-semibold text-white">
              Manage your active job drops
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {highlightTags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <PostGrid
          posts={recruiterPosts}
          onOpen={handleOpenPost}
          onSave={toggleSavePost}
          savedPostIds={savedPostIds}
          appliedPostIds={appliedPostIds}
          ownerUsername={CURRENT_RECRUITER_USERNAME}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyState={
            <>
              <h3 className="text-lg font-semibold text-white">
                Drop your first role to activate the feed
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                Post your active openings with visual storytelling. Perfect for
                Instagram-style recruiting.
              </p>
              <button
                type="button"
                onClick={() => openComposer("job")}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-black">
                <HiOutlinePlusCircle className="h-4 w-4" />
                Create Role
              </button>
            </>
          }
        />
      </section>

      <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="space-y-3 rounded-3xl border border-white/10 bg-black/70 p-5">
          <div className="flex items-center gap-3 text-sm text-gray-200">
            <HiOutlineFolderOpen className="h-5 w-5 text-white/80" />
            Draft roles & talent pools (Coming Soon)
          </div>
          <p className="text-sm text-gray-400">
            Build evergreen pools for product, engineering, and marketing hires.
            Auto-sync with your ATS when backend is live.
          </p>
        </div>

        <div className="space-y-3 rounded-3xl border border-white/10 bg-black/70 p-5">
          <div className="flex items-center gap-3 text-sm text-gray-200">
            <HiOutlineTrash className="h-5 w-5 text-white/80" />
            Archive & analytics
          </div>
          <p className="text-sm text-gray-400">
            Track performance by role, measure drop-off, and see cross-platform
            engagement.
          </p>
        </div>
      </section>

      <section id="pipeline" className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              Applicant Pipeline
            </p>
            <h2 className="text-xl font-semibold text-white">
              Track candidates across each role
            </h2>
          </div>
          <Link
            to="/explore-jobs"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-200 transition hover:border-white/20 hover:text-white">
            Open job board
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.25em] text-slate-400">
              <tr className="border-b border-white/10">
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Candidate</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applicantPipeline.flatMap((stage) =>
                stage.stages.map((applicant) => (
                  <tr key={`${stage.jobId}-${applicant.id}`} className="border-b border-white/5 last:border-b-0">
                    <td className="px-3 py-3 text-xs text-slate-300/85">{stage.jobTitle}</td>
                    <td className="px-3 py-3 text-xs text-slate-200">
                      <Link
                        to={applicant.profileUrl}
                        className="font-semibold text-white hover:text-sky-200">
                        {applicant.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-200">
                        {applicant.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400/75">
                      {applicant.submittedAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                Talent Spotlight
              </p>
              <h2 className="text-lg font-semibold text-white">
                Recommended student profiles
              </h2>
            </div>
          </header>
          <div className="space-y-3">
            {talentSpotlight.map((talent) => (
              <Link
                key={talent.id}
                to={talent.profileUrl}
                className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/50">
                <div>
                  <p className="font-semibold text-white">{talent.name}</p>
                  <p className="text-xs text-slate-400/80">{talent.headline}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                    {talent.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-white/10 px-2 py-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <HiOutlineUserGroup className="h-5 w-5 text-sky-200" />
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  Hiring Playbooks
                </p>
                <h3 className="text-lg font-semibold text-white">Recommended e-books</h3>
              </div>
              <Link
                to="/free-library"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:text-sky-100">
                View library
              </Link>
            </div>
            <div className="space-y-3">
              {ebookShelf.map((book) => (
                <Link
                  key={book.id}
                  to={book.url}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200 transition hover:border-sky-400/50">
                  <div>
                    <p className="font-semibold text-white">{book.title}</p>
                    <p className="text-slate-400/80">{book.pages} pages</p>
                  </div>
                  <HiOutlineBookOpen className="h-5 w-5 text-sky-200" />
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-white/10 bg-black/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                  Content Studio
                </p>
                <h3 className="text-lg font-semibold text-white">Blogs in progress</h3>
              </div>
              <Link
                to="/my-blogs"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 hover:text-sky-100">
                View drafts
              </Link>
            </div>
            <div className="space-y-3">
              {blogDrafts.map((draft) => (
                <Link
                  key={draft.id}
                  to={draft.url}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200 transition hover:border-sky-400/50">
                  <div>
                    <p className="font-semibold text-white">{draft.title}</p>
                    <p className="text-slate-400/80">{draft.status} · {draft.updatedAt}</p>
                  </div>
                  <HiOutlineNewspaper className="h-5 w-5 text-sky-200" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {composerVisible && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-0 bottom-0 z-[105] mx-auto w-full max-w-4xl px-4 pb-6">
            <div className="rounded-[36px] border border-white/10 bg-[#050505]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold text-white">
                  {composerState.post ? "Edit Job Post" : "Create Job Drop"}
                </h3>
                <button
                  type="button"
                  onClick={closeComposer}
                  className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-xs font-semibold text-gray-300 hover:border-white/20 hover:text-white">
                  Close
                </button>
              </div>
              <CreateJobPostForm
                initialData={
                  composerState.post
                    ? {
                        ...composerState.post,
                        tags: (composerState.post.tags ?? []).join(", "),
                        cultureHighlights: (composerState.post.cultureHighlights ?? []).join(
                          ", "
                        ),
                      }
                    : undefined
                }
                isEditing={Boolean(composerState.post)}
                onSubmitComplete={closeComposer}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruiterDashboard;

