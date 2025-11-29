import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HiOutlineCalendarDays } from "react-icons/hi2";
import PostGrid from "../components/PostGrid";
import { useExploreJobs } from "../context/ExploreJobsContext";
import TranslatedText from "../../../src/components/TranslatedText";

const ExploreFeed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recruiterJobPosts, toggleSavePost, savedPostIds, appliedPostIds, applyToJob, isSearching, searchQuery, searchResults, clearSearch } =
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
              {searchQuery || searchResults ? <TranslatedText>Search Results</TranslatedText> : <TranslatedText>Explore Feed</TranslatedText>}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              {searchQuery || searchResults
                ? <TranslatedText>Found {searchResults?.total || 0} job{searchResults?.total !== 1 ? "s" : ""}</TranslatedText>
                : <TranslatedText>Job opportunities from recruiters</TranslatedText>}
            </h1>
            {searchQuery && (
              <p className="mt-1 text-sm text-gray-400">
                <TranslatedText>Searching for:</TranslatedText> "<TranslatedText>{searchQuery}</TranslatedText>"
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {searchQuery || searchResults ? (
              <button
                onClick={clearSearch}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                <TranslatedText>Clear search</TranslatedText>
              </button>
            ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <HiOutlineCalendarDays className="h-4 w-4" />
            <TranslatedText>Updated daily</TranslatedText>
              </div>
            )}
          </div>
        </div>

        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#D4AF37] border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-400"><TranslatedText>Searching jobs...</TranslatedText></p>
            </div>
          </div>
        ) : (
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
                  {searchQuery || searchResults
                    ? <TranslatedText>No jobs found</TranslatedText>
                    : <TranslatedText>No posts yet — kickstart the feed!</TranslatedText>}
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                  {searchQuery || searchResults
                    ? <TranslatedText>Try adjusting your search or filters to find more opportunities.</TranslatedText>
                    : <TranslatedText>Recruiters can post jobs here. Check back later for new opportunities.</TranslatedText>}
              </p>
            </>
          }
        />
        )}
      </section>
    </div>
  );
};

export default ExploreFeed;


