import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaChartLine, FaSpinner } from "react-icons/fa";
import { fetchBranchAnalytics } from "../../../src/services/api/branchOwner";

const BranchAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchBranchAnalytics()
      .then((response) => {
        if (mounted) setAnalytics(response.analytics || {});
      })
      .catch((error) => toast.error(error.message || "Failed to load analytics"))
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

  const approvals = analytics?.approvalBreakdown || [];
  const growth = analytics?.userGrowth || [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F5D26A]">
          Branch Analytics
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Performance Overview</h1>
        <p className="mt-2 text-sm text-gray-400">
          Real branch activity from registrations, approvals, courses, and books.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-[#F5D26A]" />
            <h2 className="text-lg font-semibold text-white">New Content: 30 Days</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-gray-400">Courses</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {analytics?.newCourses30d || 0}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-gray-400">Books</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {analytics?.newBooks30d || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
          <h2 className="text-lg font-semibold text-white">Approval Breakdown</h2>
          <div className="mt-4 space-y-3">
            {approvals.length === 0 ? (
              <p className="text-sm text-gray-500">No approval activity yet.</p>
            ) : (
              approvals.map((item) => (
                <div
                  key={`${item._id.role}-${item._id.approvalStatus}`}
                  className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                  <span className="text-sm text-gray-300">
                    {item._id.role} - {item._id.approvalStatus || "approved"}
                  </span>
                  <span className="text-sm font-semibold text-white">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        <h2 className="text-lg font-semibold text-white">Registration Growth</h2>
        <div className="mt-4 overflow-x-auto">
          {growth.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No new branch registrations in the last 30 days.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3">Count</th>
                </tr>
              </thead>
              <tbody>
                {growth.map((item) => (
                  <tr
                    key={`${item._id.day}-${item._id.role}`}
                    className="border-b border-white/5">
                    <td className="py-3 pr-4 text-gray-300">{item._id.day}</td>
                    <td className="py-3 pr-4 text-gray-300">{item._id.role}</td>
                    <td className="py-3 font-semibold text-white">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchAnalytics;
