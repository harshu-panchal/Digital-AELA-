import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaBook, FaBullhorn, FaGraduationCap, FaSpinner, FaUsers } from "react-icons/fa";
import { fetchBranchDashboard } from "../../../src/services/api/branchOwner";

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-white">{value ?? 0}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5D26A]/15 text-[#F5D26A]">
        {Icon({ className: "h-5 w-5" })}
      </div>
    </div>
  </div>
);

const MotionDiv = motion.div;

const statusClasses = {
  approved: "bg-emerald-500/20 text-emerald-300",
  pending: "bg-amber-500/20 text-amber-300",
  rejected: "bg-red-500/20 text-red-300",
  suspended: "bg-gray-500/20 text-gray-300",
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchBranchDashboard()
      .then((response) => {
        if (mounted) setData(response);
      })
      .catch((error) => toast.error(error.message || "Failed to load dashboard"))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FaSpinner className="h-8 w-8 animate-spin text-[#F5D26A]" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const branch = data?.branch || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F5D26A]">
            Institute Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {branch.instituteName || "Branch Dashboard"}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {branch.branchName}
            {branch.city ? ` - ${branch.city}` : ""}
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            statusClasses[branch.status] || statusClasses.pending
          }`}>
          {branch.status || "pending"}
        </span>
      </div>

      {branch.status === "suspended" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          This branch is suspended. Approval and publishing actions are disabled until admin reactivation.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Teachers" value={stats.totalTeachers} icon={FaUsers} />
        <StatCard label="Students" value={stats.totalStudents} icon={FaUsers} />
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={FaGraduationCap} />
        <StatCard label="Announcements" value={stats.totalAnnouncements} icon={FaBullhorn} />
        <StatCard label="Courses" value={stats.totalCourses} icon={FaGraduationCap} />
        <StatCard label="Pending Courses" value={stats.pendingCourses} icon={FaGraduationCap} />
        <StatCard label="Books" value={stats.totalBooks} icon={FaBook} />
        <StatCard label="Pending Books" value={stats.pendingBooks} icon={FaBook} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          ["Recent Members", data?.recentActivity?.users || [], (item) => item.fullName, (item) => `${item.role} - ${item.approvalStatus}`],
          ["Recent Courses", data?.recentActivity?.courses || [], (item) => item.title, (item) => `${item.status} - ${item.approvalStatus}`],
          ["Recent Books", data?.recentActivity?.books || [], (item) => item.title, (item) => `${item.isPublic ? "public" : "private"} - ${item.approvalStatus}`],
        ].map(([title, items, getTitle, getSubtitle]) => (
          <MotionDiv
            key={title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-5">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-gray-500">No activity yet.</p>
              ) : (
                items.map((item) => (
                  <div key={item._id} className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <p className="text-sm font-semibold text-white">{getTitle(item)}</p>
                    <p className="mt-1 text-xs text-gray-400">{getSubtitle(item)}</p>
                  </div>
                ))
              )}
            </div>
          </MotionDiv>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
