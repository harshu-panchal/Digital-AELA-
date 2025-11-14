import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUserCircle,
  HiOutlineBriefcase,
  HiOutlineSparkles,
  HiOutlinePlusCircle,
} from "react-icons/hi2";

const navItems = [
  {
    label: "Explore Feed",
    to: "/explore-jobs",
    icon: HiOutlineHome,
  },
  {
    label: "Recruiter Dashboard",
    to: "/explore-jobs/recruiter-dashboard",
    icon: HiOutlineBriefcase,
  },
  {
    label: "Seeker Dashboard",
    to: "/explore-jobs/seeker-dashboard",
    icon: HiOutlineSparkles,
  },
];

const ExploreJobsSidebar = ({ onCreatePost }) => {
  const location = useLocation();
  const isProfileRoute = location.pathname.startsWith("/explore-jobs/profile/");
  const isRecruiterDashboard = location.pathname.includes("recruiter-dashboard");
  const isSeekerDashboard = location.pathname.includes("seeker-dashboard");

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-white/5 bg-[#050505]/80 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="flex h-full flex-col gap-8 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Explore Jobs
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Opportunities
            </h2>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems
            .filter((item) => {
              // Hide "Seeker Dashboard" when on recruiter dashboard
              if (isRecruiterDashboard && item.label === "Seeker Dashboard") {
                return false;
              }
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "border-white/10 bg-white/5 text-white shadow-[0_0_18px_rgba(255,255,255,0.08)]"
                        : "text-gray-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                    }`}>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
        </nav>

        {isRecruiterDashboard && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onCreatePost?.()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-white/20 transition hover:-translate-y-0.5 hover:shadow-white/30 active:translate-y-0">
              <HiOutlinePlusCircle className="h-5 w-5" />
              Create Job Post
            </button>
          </div>
        )}

        {isProfileRoute ? (
          <div className="mt-auto rounded-3xl border border-white/5 bg-[#090909]/60 p-4">
            <p className="text-sm font-semibold text-white">
              Viewing recruiter profile
            </p>
            <p className="mt-1 text-xs text-gray-400">
              See job posts and opportunities from this recruiter.
            </p>
          </div>
        ) : (
          <div className="mt-auto space-y-3 rounded-3xl border border-white/5 bg-[#090909]/60 p-4">
            <div className="flex items-center gap-3">
              <HiOutlineUserCircle className="h-8 w-8 text-gray-300" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Smart Matching (Soon)
                </p>
                <p className="text-xs text-gray-400">
                  Activate AI-matched roles & referrals when backend is ready.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ExploreJobsSidebar;
