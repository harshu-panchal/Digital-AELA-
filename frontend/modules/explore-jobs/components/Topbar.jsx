import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineAdjustmentsHorizontal,
} from "react-icons/hi2";
import { useExploreJobs } from "../context/ExploreJobsContext";

const ExploreJobsTopbar = ({ onFilterToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRecruiterProfile, currentSeekerProfile } = useExploreJobs();

  const isRecruiter = location.pathname.includes("recruiter-dashboard");
  const isSeeker = location.pathname.includes("seeker-dashboard");

  const activeProfile = isRecruiter
    ? currentRecruiterProfile
    : isSeeker
    ? currentSeekerProfile
    : currentSeekerProfile;

  return (
    <header className="sticky top-[104px] z-40 border-b border-white/5 bg-[#010101]/80 backdrop-blur-xl">
      <div className="layout-container flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center rounded-2xl border border-white/10 bg-black/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-400 transition hover:border-white/20 hover:text-white"
              onClick={() => navigate("/explore-jobs")}>
              Explore Jobs
            </button>
            <div className="hidden h-8 w-px bg-white/10 lg:block" />
            <p className="text-sm text-gray-400 lg:text-base">
              {isRecruiter && "Recruiter Mode · Post & manage roles"}
              {isSeeker && "Seeker Mode · Explore & apply to jobs"}
              {!isRecruiter && !isSeeker && "Discover job opportunities from recruiters"}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onFilterToggle}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-white/20 hover:text-white">
              <HiOutlineAdjustmentsHorizontal className="h-5 w-5" />
              Filters
            </button>
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/70 text-gray-200 transition hover:border-white/20 hover:text-white">
              <HiOutlineBell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                3
              </span>
            </button>
            <Link
              to={`/explore-jobs/profile/${activeProfile?.username}`}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/20">
              <img
                src={activeProfile?.avatar}
                alt={activeProfile?.name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="hidden sm:block">{activeProfile?.name}</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              placeholder="Search roles, skills, companies, or people"
              className="w-full rounded-2xl border border-white/10 bg-black/60 py-3 pl-12 pr-4 text-sm text-gray-100 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default ExploreJobsTopbar;


