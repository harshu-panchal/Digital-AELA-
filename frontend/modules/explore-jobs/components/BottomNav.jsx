import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineBriefcase,
  HiOutlineSparkles,
  HiOutlinePlusCircle,
} from "react-icons/hi2";

const bottomItems = [
  { to: "/explore-jobs", label: "Feed", icon: HiOutlineHome },
  {
    to: "/explore-jobs/recruiter-dashboard",
    label: "Recruit",
    icon: HiOutlineBriefcase,
  },
  {
    to: "/explore-jobs/seeker-dashboard",
    label: "Apply",
    icon: HiOutlineSparkles,
  },
];

const ExploreJobsBottomNav = ({ onCreatePost }) => {
  const location = useLocation();
  const isRecruiterDashboard = location.pathname.includes("recruiter-dashboard");

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 flex justify-center lg:hidden">
      <div className="flex w-[94%] max-w-xl items-center justify-between rounded-3xl border border-white/10 bg-black/80 px-4 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-6">
        {bottomItems
          .filter((item) => {
            // Hide "Seeker Dashboard" (Apply) when on recruiter dashboard
            if (isRecruiterDashboard && item.to.includes("seeker-dashboard")) {
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
                  `flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white"
                  }`
                }>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

        {isRecruiterDashboard && (
          <button
            type="button"
            onClick={onCreatePost}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-lg shadow-white/30 transition hover:-translate-y-0.5">
            <HiOutlinePlusCircle className="h-6 w-6" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default ExploreJobsBottomNav;
