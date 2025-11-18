import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineFunnel,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineArrowTrendingUp,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import RecruiterAnalyticsDashboard from "./RecruiterAnalyticsDashboard";
import CandidatePipeline from "./CandidatePipeline";
import AdvancedCandidateFilter from "./AdvancedCandidateFilter";
import InterviewScheduling from "./InterviewScheduling";
import BulkApplicantActions from "./BulkApplicantActions";
import HiringStatistics from "./HiringStatistics";
import PerformanceReports from "./PerformanceReports";

const RecruiterAnalyticsHub = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Set active tab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/pipeline")) {
      setActiveTab("pipeline");
    } else if (path.includes("/candidates")) {
      setActiveTab("candidates");
    } else if (path.includes("/interviews")) {
      setActiveTab("interviews");
    } else if (path.includes("/bulk-actions")) {
      setActiveTab("bulk-actions");
    } else if (path.includes("/hiring-stats")) {
      setActiveTab("hiring-stats");
    } else if (path.includes("/performance-reports")) {
      setActiveTab("performance");
    } else {
      setActiveTab("dashboard");
    }
  }, [location.pathname]);

  const tabs = [
    {
      id: "dashboard",
      label: "Analytics Dashboard",
      icon: HiOutlineChartBar,
      component: RecruiterAnalyticsDashboard,
    },
    {
      id: "pipeline",
      label: "Candidate Pipeline",
      icon: HiOutlineUserGroup,
      component: CandidatePipeline,
    },
    {
      id: "candidates",
      label: "Advanced Search",
      icon: HiOutlineFunnel,
      component: AdvancedCandidateFilter,
    },
    {
      id: "interviews",
      label: "Interview Schedule",
      icon: HiOutlineCalendar,
      component: InterviewScheduling,
    },
    {
      id: "bulk-actions",
      label: "Bulk Actions",
      icon: HiOutlineDocumentText,
      component: BulkApplicantActions,
    },
    {
      id: "hiring-stats",
      label: "Hiring Statistics",
      icon: HiOutlineArrowTrendingUp,
      component: HiringStatistics,
    },
    {
      id: "performance",
      label: "Performance Reports",
      icon: HiOutlineClock,
      component: PerformanceReports,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="w-full text-white pt-24">
      <div className="w-full bg-black h-[200px]">.</div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Recruiter Analytics Hub
            </h1>
            <p className="text-gray-400">
              Comprehensive recruitment analytics and management tools
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className=" flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                  isActive
                    ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                    : "border-white/10 bg-black/60 text-gray-300 hover:border-white/20 hover:text-white"
                }`}>
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Content */}
        <div className="mt-6">
          {ActiveComponent ? <ActiveComponent /> : null}
        </div>
      </div>
    </div>
  );
};

export default RecruiterAnalyticsHub;
