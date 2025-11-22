import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import PostDetailContent from "../components/PostDetailContent";
import { useExploreJobs } from "../context/ExploreJobsContext";

const PostDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getPostById, applyToJob, appliedPostIds } = useExploreJobs();

  const post = getPostById(id);
  const backgroundLocation = location.state?.backgroundLocation;
  const hasApplied = post ? appliedPostIds.has(post.id) : false;

  const handleBack = () => {
    if (backgroundLocation?.pathname) {
      navigate(backgroundLocation.pathname + (backgroundLocation.search || ""), {
        replace: false,
        state: backgroundLocation.state,
      });
    } else {
      navigate("/explore-jobs");
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15">
        <HiOutlineArrowLeft className="h-5 w-5" />
        Back to Feed
      </button>

      <div className="rounded-[32px] border border-white/10 bg-white/5">
        <PostDetailContent 
          post={post} 
          variant="page" 
          onApply={applyToJob}
          hasApplied={hasApplied}
        />
      </div>
    </div>
  );
};

export default PostDetailPage;


