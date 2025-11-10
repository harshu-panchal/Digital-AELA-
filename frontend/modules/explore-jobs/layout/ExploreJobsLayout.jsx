import React, { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ExploreJobsSidebar from "../components/Sidebar";
import ExploreJobsTopbar from "../components/Topbar";
import ExploreJobsBottomNav from "../components/BottomNav";
import FiltersPanel from "../components/FiltersPanel";
import { useExploreJobs } from "../context/ExploreJobsContext";

const ExploreJobsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { openComposer } = useExploreJobs();

  const handleCreatePost = () => {
    // Only allow recruiters to create posts
    if (!location.pathname.includes("recruiter-dashboard")) {
      navigate("/explore-jobs/recruiter-dashboard");
    }
    openComposer("job");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#040404] to-black pt-[124px] text-white md:pt-[104px]">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <ExploreJobsSidebar onCreatePost={handleCreatePost} />

        <div className="flex min-h-[calc(100vh-124px)] flex-1 flex-col">
          <ExploreJobsTopbar onFilterToggle={() => setIsFiltersOpen(true)} />

          <main className="relative flex-1 pb-24 pt-8 sm:pb-12">
            <div className="layout-container space-y-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <ExploreJobsBottomNav onCreatePost={handleCreatePost} />

      <FiltersPanel isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />
    </div>
  );
};

export default ExploreJobsLayout;
