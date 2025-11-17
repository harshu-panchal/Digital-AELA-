import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { fetchTeacherAnalytics, fetchCourseAnalytics } from "../../src/services/api/teacher";

const TeacherAnalytics = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    if (!isAuthenticated || !user || (user.role !== "teacher" && user.role !== "admin")) {
      toast.info("Only teachers can view analytics");
      navigate("/");
      return;
    }

    loadAnalytics();
  }, [isAuthenticated, user, navigate, period]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTeacherAnalytics({ period });
      setAnalytics(data);
    } catch (error) {
      toast.error(error.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000) {
      return `AED ${(amount / 1000).toFixed(1)}K`;
    }
    return `AED ${Math.round(amount)}`;
  };

  if (!isAuthenticated || !user || (user.role !== "teacher" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Teacher Analytics | Digital AELA"
        description="View your teaching analytics and performance metrics"
        keywords="teacher analytics, teaching performance, student metrics"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(55,124,255,0.18),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20" style={{ paddingTop: "calc(6rem + 5vh)" }}>
        <section className="layout-container space-y-6">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4">
            <div className="flex items-center gap-4">
              <Link
                to="/teacher/dashboard"
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:border-sky-400/50 hover:bg-sky-500/10">
                <HiOutlineArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Analytics</p>
                <h1 className="text-3xl font-semibold md:text-4xl">Teaching Performance</h1>
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </motion.header>

          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-slate-300/80">Loading analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-slate-300/80">No analytics data available</p>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6 md:grid-cols-4">
                <div className="text-center">
                  <HiOutlineCurrencyDollar className="mx-auto mb-2 h-8 w-8 text-green-400" />
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(analytics.overview.totalRevenue)}
                  </p>
                  <p className="text-xs text-slate-400">Total Revenue</p>
                </div>
                <div className="text-center">
                  <HiOutlineUsers className="mx-auto mb-2 h-8 w-8 text-blue-400" />
                  <p className="text-2xl font-semibold text-white">{analytics.overview.totalEnrollments}</p>
                  <p className="text-xs text-slate-400">Total Enrollments</p>
                </div>
                <div className="text-center">
                  <HiOutlineUsers className="mx-auto mb-2 h-8 w-8 text-purple-400" />
                  <p className="text-2xl font-semibold text-white">{analytics.overview.uniqueStudents}</p>
                  <p className="text-xs text-slate-400">Unique Students</p>
                </div>
                <div className="text-center">
                  <HiOutlineAcademicCap className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                  <p className="text-2xl font-semibold text-white">{analytics.overview.avgQuizScore}%</p>
                  <p className="text-xs text-slate-400">Avg Quiz Score</p>
                </div>
              </motion.div>

              {/* Revenue Trend */}
              {analytics.revenueTrend && analytics.revenueTrend.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Revenue Trend (Last 7 Days)</h3>
                  <div className="space-y-2">
                    {analytics.revenueTrend.map((day, index) => {
                      const prevDay = index > 0 ? analytics.revenueTrend[index - 1] : null;
                      const trend = prevDay && day.revenue > prevDay.revenue ? "up" : prevDay && day.revenue < prevDay.revenue ? "down" : "neutral";

                      return (
                        <div
                          key={day.date}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-slate-400">{day.enrollments} enrollments</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-bold text-green-400">
                              {formatCurrency(day.revenue)}
                            </p>
                            {trend !== "neutral" && prevDay && (
                              <div
                                className={`flex items-center gap-1 ${
                                  trend === "up" ? "text-green-400" : "text-red-400"
                                }`}>
                                {trend === "up" ? (
                                  <HiOutlineArrowUp className="h-4 w-4" />
                                ) : (
                                  <HiOutlineArrowDown className="h-4 w-4" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Course Performance */}
              {analytics.coursePerformance && analytics.coursePerformance.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Course Performance</h3>
                  <div className="space-y-3">
                    {analytics.coursePerformance.map((course) => (
                      <div
                        key={course.courseId}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-semibold text-white">{course.title}</h4>
                          <Link
                            to={`/teacher/courses/${course.courseId}/analytics`}
                            className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200 transition hover:border-sky-300/70 hover:bg-sky-500/20">
                            View Details
                          </Link>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-lg font-bold text-blue-400">{course.enrollments}</p>
                            <p className="text-xs text-slate-400">Enrollments</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-green-400">
                              {formatCurrency(course.revenue)}
                            </p>
                            <p className="text-xs text-slate-400">Revenue</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-yellow-400">
                              {course.completionRate}%
                            </p>
                            <p className="text-xs text-slate-400">Completion</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default TeacherAnalytics;

