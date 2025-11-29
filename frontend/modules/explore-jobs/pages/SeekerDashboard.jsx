import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineSparkles,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import PostGrid from "../components/PostGrid";
import ProfileHeader from "../components/ProfileHeader";
import { useExploreJobs } from "../context/ExploreJobsContext";
import TranslatedText from "../../../src/components/TranslatedText";

const SeekerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentSeekerProfile,
    recruiterJobPosts,
    appliedPostIds,
    savedPostIds,
    applyToJob,
    toggleSavePost,
  } = useExploreJobs();

  const appliedJobs = useMemo(() => {
    return recruiterJobPosts.filter((post) => appliedPostIds.has(post.id));
  }, [recruiterJobPosts, appliedPostIds]);

  const availableJobs = useMemo(() => {
    return recruiterJobPosts.filter((post) => !appliedPostIds.has(post.id));
  }, [recruiterJobPosts, appliedPostIds]);

  const stats = useMemo(() => {
    return [
      { label: <TranslatedText>Applied</TranslatedText>, value: appliedPostIds.size },
      { label: <TranslatedText>Saved</TranslatedText>, value: savedPostIds.size },
      { label: <TranslatedText>Available</TranslatedText>, value: availableJobs.length },
      { label: <TranslatedText>Total Jobs</TranslatedText>, value: recruiterJobPosts.length },
    ];
  }, [appliedPostIds, savedPostIds, availableJobs.length, recruiterJobPosts.length]);

  const handleOpenPost = (post) => {
    navigate(`/explore-jobs/post/${post.id}`, {
      state: { backgroundLocation: location },
    });
  };

  return (
    <div className="space-y-10">
      <ProfileHeader
        profile={currentSeekerProfile}
        roleBadge={
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            <HiOutlineSparkles className="h-4 w-4" />
            <TranslatedText>Job Seeker</TranslatedText>
          </span>
        }
        metrics={stats}
      />

      {appliedJobs.length > 0 && (
        <section className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                <TranslatedText>Applied Jobs</TranslatedText>
              </p>
              <h2 className="text-xl font-semibold text-white">
                <TranslatedText>Jobs you've applied to</TranslatedText>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <HiOutlineCheckCircle className="h-4 w-4" />
              <TranslatedText>{appliedJobs.length} application{appliedJobs.length !== 1 ? "s" : ""}</TranslatedText>
            </div>
          </header>

          <PostGrid
            posts={appliedJobs}
            onOpen={handleOpenPost}
            onSave={toggleSavePost}
            onApply={applyToJob}
            savedPostIds={savedPostIds}
            appliedPostIds={appliedPostIds}
            emptyState={
              <>
                <h3 className="text-lg font-semibold text-white">
                  <TranslatedText>No applications yet</TranslatedText>
                </h3>
                <p className="mt-2 max-w-md text-sm text-gray-400">
                  <TranslatedText>Start exploring available jobs and apply to positions that match your skills.</TranslatedText>
                </p>
              </>
            }
          />
        </section>
      )}

      <section className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              <TranslatedText>Available Jobs</TranslatedText>
            </p>
            <h2 className="text-xl font-semibold text-white">
              <TranslatedText>Explore and apply to new opportunities</TranslatedText>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <HiOutlineClipboardDocumentList className="h-4 w-4" />
            <TranslatedText>{availableJobs.length} job{availableJobs.length !== 1 ? "s" : ""} available</TranslatedText>
          </div>
        </header>

        <PostGrid
          posts={availableJobs}
          onOpen={handleOpenPost}
          onSave={toggleSavePost}
          onApply={applyToJob}
          savedPostIds={savedPostIds}
          appliedPostIds={appliedPostIds}
          emptyState={
            <>
              <h3 className="text-lg font-semibold text-white">
                <TranslatedText>No jobs available at the moment</TranslatedText>
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                <TranslatedText>Check back later for new job opportunities from recruiters.</TranslatedText>
              </p>
            </>
          }
        />
      </section>
    </div>
  );
};

export default SeekerDashboard;


