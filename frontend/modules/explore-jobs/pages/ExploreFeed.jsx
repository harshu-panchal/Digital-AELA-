import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HiOutlineCalendarDays } from "react-icons/hi2";
import PostGrid from "../components/PostGrid";
import { useExploreJobs } from "../context/ExploreJobsContext";

const ExploreFeed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recruiterJobPosts, toggleSavePost, savedPostIds, appliedPostIds, applyToJob } =
    useExploreJobs();

  const sortedPosts = useMemo(
    () =>
      [...recruiterJobPosts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [recruiterJobPosts]
  );

  const openModal = (post) => {
    navigate(`/explore-jobs/post/${post.id}`, {
      state: { backgroundLocation: location },
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              Explore Feed
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Job opportunities from recruiters
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <HiOutlineCalendarDays className="h-4 w-4" />
            Updated daily
          </div>
        </div>

        <PostGrid
          posts={sortedPosts}
          savedPostIds={savedPostIds}
          appliedPostIds={appliedPostIds}
          onOpen={openModal}
          onSave={toggleSavePost}
          onApply={applyToJob}
          emptyState={
            <>
              <h3 className="text-lg font-semibold text-white">
                No posts yet — kickstart the feed!
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                Recruiters can post jobs here. Check back later for new opportunities.
              </p>
            </>
          }
        />
      </section>
    </div>
  );
};

export default ExploreFeed;


