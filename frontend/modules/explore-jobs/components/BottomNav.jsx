import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineBriefcase,
  HiOutlineSparkles,
  HiOutlinePlusCircle,
} from "react-icons/hi2";
import { useAuth } from "../../../src/contexts/AuthContext";
import TranslatedText from "../../../src/components/TranslatedText";

const bottomItems = [
  { to: "/explore-jobs", label: <TranslatedText>Feed</TranslatedText>, icon: HiOutlineHome },
  {
    to: "/recruiter/dashboard",
    label: <TranslatedText>Recruit</TranslatedText>,
    icon: HiOutlineBriefcase,
  },
  {
    to: "/explore-jobs/seeker-dashboard",
    label: <TranslatedText>Apply</TranslatedText>,
    icon: HiOutlineSparkles,
  },
];

const ExploreJobsBottomNav = ({ onCreatePost }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isRecruiter = user?.role === "recruiter";
  const isRecruiterDashboard = location.pathname.includes(
    "/recruiter/"
  );

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 flex justify-center lg:hidden">
      <div className="flex w-[94%] max-w-xl items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/80 px-4 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-6">
        {bottomItems
          .filter((item) => {
            // Hide "Recruit" button if user is not a recruiter
            if (item.to.includes("/recruiter/dashboard") && !isRecruiter) {
              return false;
            }
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
