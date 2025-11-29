import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineAdjustmentsHorizontal,
} from "react-icons/hi2";
import { useExploreJobs } from "../context/ExploreJobsContext";
import JobSearchBar from "./JobSearchBar";
import TranslatedText from "../../../src/components/TranslatedText";

const ExploreJobsTopbar = ({ onFilterToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useExploreJobs();

  const isRecruiter = location.pathname.includes("/recruiter/");
  const isSeeker = location.pathname.includes("seeker-dashboard");

  return (
    <header className="sticky top-[104px] z-40 border-b border-white/5 bg-[#010101]/80 backdrop-blur-xl">
      <div className="layout-container flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center rounded-2xl border border-white/10 bg-black/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-400 transition hover:border-white/20 hover:text-white"
              onClick={() => navigate("/explore-jobs")}>
              <TranslatedText>Explore Jobs</TranslatedText>
            </button>
            <div className="hidden h-8 w-px bg-white/10 lg:block" />
            <p className="text-sm text-gray-400 lg:text-base">
              {isRecruiter && <TranslatedText>Recruiter Mode · Post & manage roles</TranslatedText>}
              {isSeeker && <TranslatedText>Seeker Mode · Explore & apply to jobs</TranslatedText>}
              {!isRecruiter && !isSeeker && <TranslatedText>Discover job opportunities from recruiters</TranslatedText>}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onFilterToggle}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-white/20 hover:text-white">
              <HiOutlineAdjustmentsHorizontal className="h-5 w-5" />
              <TranslatedText>Filters</TranslatedText>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <JobSearchBar
            initialQuery={searchQuery}
            onSearch={setSearchQuery}
          />
        </div>
      </div>
    </header>
  );
};

export default ExploreJobsTopbar;


