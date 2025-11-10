import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineUserPlus, HiOutlineSparkles } from "react-icons/hi2";
import PostGrid from "../components/PostGrid";
import ProfileHeader from "../components/ProfileHeader";
import { useExploreJobs } from "../context/ExploreJobsContext";

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    getProfileByUsername,
    getPostsByUsername,
    savedPostIds,
    appliedPostIds,
    toggleSavePost,
    applyToJob,
  } = useExploreJobs();

  const profile = getProfileByUsername(username);
  const allPosts = getPostsByUsername(username);
  // Only show job posts (seekers can't create posts)
  const posts = allPosts.filter((post) => post.type === "job");

  if (!profile) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
        <h2 className="text-2xl font-semibold text-white">Profile not found</h2>
        <p className="mt-2 text-sm text-gray-400">
          The profile you are looking for might have been moved or does not exist.
          Explore the feed to discover more job opportunities.
        </p>
      </div>
    );
  }

  const isRecruiter =
    posts.some((post) => post.type === "job") ||
    profile.badges?.includes("Top Recruiter 2025");

  return (
    <div className="space-y-10">
      <ProfileHeader
        profile={profile}
        roleBadge={
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            <HiOutlineSparkles className="h-4 w-4" />
            {isRecruiter ? "Recruiter" : "Job Seeker"}
          </span>
        }
        actionSlot={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5">
            <HiOutlineUserPlus className="h-5 w-5" />
            Follow
          </button>
        }
        metrics={[
          { label: "Job Posts", value: posts.length },
          {
            label: "Hires",
            value: profile.stats?.hires ?? 0,
          },
          {
            label: "Followers",
            value: profile.stats?.followers ?? 0,
          },
          {
            label: "Following",
            value: profile.stats?.following ?? 0,
          },
        ]}
      />

      <section className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              Posts
            </p>
            <h2 className="text-xl font-semibold text-white">
              Job posts
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            <span className="rounded-full border border-white/10 px-4 py-2">
              {profile.location}
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2">
              Active since 2024
            </span>
          </div>
        </header>

        <PostGrid
          posts={posts}
          onOpen={(post) =>
            navigate(`/explore-jobs/post/${post.id}`, {
              state: { backgroundLocation: location },
            })
          }
          onSave={toggleSavePost}
          onApply={isRecruiter ? applyToJob : undefined}
          savedPostIds={savedPostIds}
          appliedPostIds={appliedPostIds}
          emptyState={
            <>
              <h3 className="text-lg font-semibold text-white">No job posts yet</h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                This recruiter hasn't posted any job opportunities yet.
              </p>
            </>
          }
        />
      </section>
    </div>
  );
};

export default ProfilePage;


