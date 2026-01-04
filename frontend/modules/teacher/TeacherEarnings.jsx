import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getEarningsSummary,
  getMonthlyEarnings,
  getCourseEarnings,
  getReferralEarnings,
} from "../../src/services/api/earnings";
import { getTeacherCourses } from "../../src/services/teacherCourses";
import { formatCurrency } from "../../src/utils/currencyUtils";

const TeacherEarnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);
  const [courseEarnings, setCourseEarnings] = useState([]);
  const [referralEarnings, setReferralEarnings] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    courseId: "",
    month: "",
    year: new Date().getFullYear().toString(),
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadCourses();
    if (activeTab === "summary") {
      loadEarningsSummary();
    } else if (activeTab === "monthly") {
      loadMonthlyEarnings();
    } else if (activeTab === "courses") {
      loadCourseEarnings();
    } else if (activeTab === "referrals") {
      loadReferralEarnings();
    }
  }, [
    activeTab,
    filters.startDate,
    filters.endDate,
    filters.courseId,
    filters.month,
    filters.year,
  ]);

  const loadCourses = async () => {
    try {
      const coursesData = await getTeacherCourses();
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  const loadEarningsSummary = async () => {
    setIsLoading(true);
    try {
      const response = await getEarningsSummary({
        month: filters.month || undefined,
        year: filters.year || undefined,
        courseId: filters.courseId || undefined,
      });
      setEarnings(response.earnings || []);
      setSummary(response.summary || null);
    } catch (error) {
      toast.error(error.message || "Failed to load earnings");
      setEarnings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlyEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await getMonthlyEarnings({
        year: filters.year || undefined,
      });
      setMonthlyEarnings(response.monthly || []);
    } catch (error) {
      toast.error(error.message || "Failed to load monthly earnings");
      setMonthlyEarnings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await getCourseEarnings({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setCourseEarnings(response.courses || []);
    } catch (error) {
      toast.error(error.message || "Failed to load course earnings");
      setCourseEarnings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReferralEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await getReferralEarnings({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setReferralEarnings(response);
    } catch (error) {
      toast.error(error.message || "Failed to load referral earnings");
      setReferralEarnings(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Earnings | Digital AELA"
        description="View your course earnings"
      />

      <div className="layout-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Earnings</h1>
          <p className="text-slate-400">
            Track your course revenue and earnings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineCurrencyDollar className="h-6 w-6 text-[#F5D26A]" />
              <p className="text-sm text-slate-400">Total Earnings</p>
            </div>
            <p className="text-3xl font-semibold text-white">
              {formatCurrency(summary?.totalEarnings || 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineChartBar className="h-6 w-6 text-emerald-400" />
              <p className="text-sm text-slate-400">Total Payments</p>
            </div>
            <p className="text-3xl font-semibold text-white">
              {summary?.totalPayments || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineDocumentText className="h-6 w-6 text-sky-400" />
              <p className="text-sm text-slate-400">Active Courses</p>
            </div>
            <p className="text-3xl font-semibold text-white">
              {earnings.length}
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "summary"
                ? "text-[#F5D26A] border-b-2 border-[#F5D26A]"
                : "text-slate-400 hover:text-white"
            }`}>
            Summary
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "monthly"
                ? "text-[#F5D26A] border-b-2 border-[#F5D26A]"
                : "text-slate-400 hover:text-white"
            }`}>
            Monthly
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "courses"
                ? "text-[#F5D26A] border-b-2 border-[#F5D26A]"
                : "text-slate-400 hover:text-white"
            }`}>
            By Course
          </button>
          <button
            onClick={() => setActiveTab("referrals")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "referrals"
                ? "text-[#F5D26A] border-b-2 border-[#F5D26A]"
                : "text-slate-400 hover:text-white"
            }`}>
            Referrals & Bonuses
          </button>
        </div>

        {activeTab === "summary" && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Month
              </label>
              <select
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Year
              </label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) =>
                  setFilters({ ...filters, year: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Course
              </label>
              <select
                value={filters.courseId}
                onChange={(e) =>
                  setFilters({ ...filters, courseId: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option
                    key={course._id || course.id}
                    value={course._id || course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === "monthly" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Year
            </label>
            <input
              type="number"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full max-w-xs rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
            />
          </div>
        )}

        {(activeTab === "courses" || activeTab === "referrals") && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading earnings...</p>
          </div>
        ) : (
          <>
            {activeTab === "summary" && (
              <>
                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
                      <p className="text-sm text-slate-400 mb-1">
                        Total Earnings
                      </p>
                      <p className="text-2xl font-semibold text-white">
                        {formatCurrency(summary.totalEarnings || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
                      <p className="text-sm text-slate-400 mb-1">Available</p>
                      <p className="text-2xl font-semibold text-emerald-400">
                        {formatCurrency(summary.availableEarnings || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
                      <p className="text-sm text-slate-400 mb-1">Pending</p>
                      <p className="text-2xl font-semibold text-yellow-400">
                        {formatCurrency(summary.pendingEarnings || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-4">
                      <p className="text-sm text-slate-400 mb-1">Paid</p>
                      <p className="text-2xl font-semibold text-blue-400">
                        {formatCurrency(summary.paidEarnings || 0)}
                      </p>
                    </div>
                  </div>
                )}
                {Object.keys(summary?.byCourse || {}).length > 0 && (
                  <div className="space-y-4">
                    {Object.values(summary.byCourse).map((course) => (
                      <motion.div
                        key={course.courseId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">
                              {course.courseTitle}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                              <div>
                                <span className="text-slate-500">
                                  Earnings:{" "}
                                </span>
                                <span className="text-white font-semibold">
                                  {course.count}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-6 text-right">
                            <p className="text-2xl font-semibold text-[#F5D26A]">
                              {formatCurrency(course.earnings)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "monthly" && (
              <div className="space-y-4">
                {monthlyEarnings.length === 0 ? (
                  <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
                    <p className="text-slate-400">
                      No monthly earnings data found
                    </p>
                  </div>
                ) : (
                  monthlyEarnings.map((month) => (
                    <motion.div
                      key={`${month.year}-${month.month}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">
                            {new Date(2000, month.month - 1).toLocaleString(
                              "default",
                              {
                                month: "long",
                              }
                            )}{" "}
                            {month.year}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                            <div>
                              <span className="text-slate-500">Total: </span>
                              <span className="text-white font-semibold">
                                {formatCurrency(month.totalEarnings)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">
                                Available:{" "}
                              </span>
                              <span className="text-emerald-400">
                                {formatCurrency(month.availableEarnings)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Paid: </span>
                              <span className="text-blue-400">
                                {formatCurrency(month.paidEarnings)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">
                                Transactions:{" "}
                              </span>
                              <span className="text-white">{month.count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === "courses" && (
              <div className="space-y-4">
                {courseEarnings.length === 0 ? (
                  <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
                    <p className="text-slate-400">
                      No course earnings data found
                    </p>
                  </div>
                ) : (
                  courseEarnings.map((course) => (
                    <motion.div
                      key={course.courseId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">
                            {course.courseTitle}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                            <div>
                              <span className="text-slate-500">Total: </span>
                              <span className="text-white font-semibold">
                                {formatCurrency(course.totalEarnings)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">
                                Available:{" "}
                              </span>
                              <span className="text-emerald-400">
                                {formatCurrency(course.availableEarnings)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Paid: </span>
                              <span className="text-blue-400">
                                {formatCurrency(course.paidEarnings)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">
                                Transactions:{" "}
                              </span>
                              <span className="text-white">{course.count}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-6 text-right">
                          <p className="text-2xl font-semibold text-[#F5D26A]">
                            {formatCurrency(course.totalEarnings)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === "referrals" && (
              <div className="space-y-4">
                {referralEarnings ? (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">
                            Total Referral Earnings
                          </p>
                          <p className="text-3xl font-semibold text-white">
                            {formatCurrency(
                              referralEarnings.summary?.totalEarnings || 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">
                            Total Referrals
                          </p>
                          <p className="text-2xl font-semibold text-white">
                            {referralEarnings.summary?.count || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    {referralEarnings.referralEarnings?.length > 0 ? (
                      <div className="space-y-4">
                        {referralEarnings.referralEarnings.map((earning) => (
                          <motion.div
                            key={earning._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                  Referral Bonus
                                </h3>
                                <div className="text-sm text-slate-300">
                                  {earning.description ||
                                    earning.referralCode ||
                                    "Referral earning"}
                                </div>
                                <div className="text-xs text-slate-400 mt-2">
                                  {formatDate(earning.createdAt)}
                                </div>
                              </div>
                              <div className="ml-6 text-right">
                                <p className="text-xl font-semibold text-[#F5D26A]">
                                  {formatCurrency(earning.amount)}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {earning.status}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
                        <p className="text-slate-400">
                          No referral earnings found
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
                    <p className="text-slate-400">
                      No referral earnings data found
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherEarnings;

