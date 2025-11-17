import React, { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ExploreJobsSidebar from "../components/Sidebar";
import ExploreJobsTopbar from "../components/Topbar";
import ExploreJobsBottomNav from "../components/BottomNav";
import FiltersPanel from "../components/FiltersPanel";
import JobSearchFilters from "../components/JobSearchFilters";
import { useExploreJobs } from "../context/ExploreJobsContext";

const ExploreJobsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { openComposer, searchFilters, setSearchFilters } = useExploreJobs();

  const handleCreatePost = () => {
    // Only allow recruiters to create posts
    if (!location.pathname.includes("recruiter-dashboard")) {
      navigate("/explore-jobs/recruiter-dashboard");
    }
    openComposer("job");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#040404] to-black pt-[20vh] text-white">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <ExploreJobsSidebar onCreatePost={handleCreatePost} />

        <div className="flex min-h-[80vh] flex-1 flex-col">
          <ExploreJobsTopbar onFilterToggle={() => setIsFiltersOpen(true)} />

          <main className="relative flex-1 pb-24 pt-8 sm:pb-12">
            <div className="layout-container space-y-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <ExploreJobsBottomNav onCreatePost={handleCreatePost} />

      <JobSearchFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
      />
    </div>
  );
};

export default ExploreJobsLayout;
