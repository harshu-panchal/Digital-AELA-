import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBriefcase,
  HiOutlinePlusCircle,
  HiOutlineFolderOpen,
  HiOutlineTrash,
} from "react-icons/hi2";
import PostGrid from "../components/PostGrid";
import ProfileHeader from "../components/ProfileHeader";
import CreateJobPostForm from "../components/CreateJobPostForm";
import { useExploreJobs } from "../context/ExploreJobsContext";
import {
  CURRENT_RECRUITER_USERNAME,
  highlightTags,
} from "../data/posts";

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


