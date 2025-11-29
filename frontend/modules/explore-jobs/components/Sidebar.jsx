import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUserCircle,
  HiOutlineBriefcase,
  HiOutlinePlusCircle,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineFunnel,
  HiOutlineCalendar,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import { useAuth } from "../../../src/contexts/AuthContext";
import TranslatedText from "../../../src/components/TranslatedText";

const baseNavItems = [
  {
    label: <TranslatedText>Explore Feed</TranslatedText>,
    to: "/explore-jobs",
    icon: HiOutlineHome,
  },
];

const recruiterNavItems = [
  {
    label: <TranslatedText>Analytics Hub</TranslatedText>,
    to: "/recruiter/analytics",
    icon: HiOutlineChartBar,
  },
];

const ExploreJobsSidebar = ({ onCreatePost }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isRecruiterDashboard = location.pathname.includes(
    "/recruiter/dashboard"
  );
  const isRecruiterPage = location.pathname.includes("/recruiter/");

  // Filter nav items based on user role
  const navItems = baseNavItems.filter((item) => {
    if (item.requiresRole) {
      return user?.role === item.requiresRole;
    }
    return true;
  });

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-white/5 bg-[#050505]/80 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="flex h-full flex-col gap-8 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              <TranslatedText>Explore Jobs</TranslatedText>
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              <TranslatedText>Opportunities</TranslatedText>
            </h2>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
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
                    }`
                  }>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
        </nav>

        {isRecruiterPage && user?.role === "recruiter" && (
          <div className="space-y-2">
            <p className="px-4 text-xs uppercase tracking-[0.3em] text-gray-500">
              <TranslatedText>Analytics & Tools</TranslatedText>
            </p>
            {recruiterNavItems.map((item) => {
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
                    }`
                  }>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        )}

        {isRecruiterDashboard && user?.role === "recruiter" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onCreatePost?.()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-white/20 transition hover:-translate-y-0.5 hover:shadow-white/30 active:translate-y-0">
              <HiOutlinePlusCircle className="h-5 w-5" />
              <TranslatedText>Create Job Post</TranslatedText>
            </button>
          </div>
        )}

          <div className="mt-auto space-y-3 rounded-3xl border border-white/5 bg-[#090909]/60 p-4">
            <div className="flex items-center gap-3">
              <HiOutlineUserCircle className="h-8 w-8 text-gray-300" />
              <div>
                <p className="text-sm font-semibold text-white">
                  <TranslatedText>Smart Matching (Soon)</TranslatedText>
                </p>
                <p className="text-xs text-gray-400">
                  <TranslatedText>Activate AI-matched roles & referrals when backend is ready.</TranslatedText>
                </p>
              </div>
            </div>
          </div>
      </div>
    </aside>
  );
};

export default ExploreJobsSidebar;
