import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineGift,
  HiOutlineNewspaper,
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineMegaphone,
  HiOutlineAcademicCap,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { useUser } from "../../src/contexts/UserContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { usePoints } from "../../src/contexts/PointsContext";
import { getStudentDashboard } from "../../src/services/studentDashboard";
import { fetchStudentDashboard, fetchDashboardWidgets } from "../../src/services/api/student";
import { getStudentAssignments } from "../../src/services/api/assignments";

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const StudentDashboard = () => {
  const { profile, notifications, followers } = useUser();
  const { user: authUser, tokens } = useAuth();
  const { aelaPoints, refreshPoints } = usePoints(); // Get live coin balance

  const [dashboardData, setDashboardData] = useState(() => getStudentDashboard());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [widgetsData, setWidgetsData] = useState({
    recentActivity: [],
    achievements: [],
    weeklyProgress: [],
    learningGoals: {},
    recommendations: [],
  });
  const [loadingWidgets, setLoadingWidgets] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Load real-time data from backend
  const loadDashboard = useCallback(async () => {
    // Only fetch from backend if user is authenticated with backend tokens
    if (!authUser || authUser.role !== "student" || !tokens?.accessToken) {
      // Fall back to mock data
      setDashboardData(getStudentDashboard());
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const backendData = await fetchStudentDashboard();
      // Use backend data for all sections, fall back to mock data only if backend data is missing
      const mockData = getStudentDashboard();
      setDashboardData({
        ...mockData,
        journeyStats: backendData.journeyStats || mockData.journeyStats,
        ongoingCourses: backendData.ongoingCourses || mockData.ongoingCourses,
        learnEarnProgress: backendData.learnEarnProgress || mockData.learnEarnProgress,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load dashboard from backend:", error);
      setLoadError(error.message);
      // Fall back to mock data
      setDashboardData(getStudentDashboard());
      toast.warning("Using cached data. Some metrics may not be up to date.");
    } finally {
      setIsLoading(false);
    }
  }, [authUser, tokens]);

  // Load dashboard widgets
  const loadWidgets = useCallback(async () => {
    if (!authUser || authUser.role !== "student" || !tokens?.accessToken) {
      return;
    }

    setLoadingWidgets(true);
    try {
      const widgets = await fetchDashboardWidgets();
      setWidgetsData(widgets);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load dashboard widgets:", error);
    } finally {
      setLoadingWidgets(false);
    }
  }, [authUser, tokens]);

  // Load assignments
  const loadAssignments = useCallback(async () => {
    if (!authUser || authUser.role !== "student" || !tokens?.accessToken) {
      return;
    }

    setLoadingAssignments(true);
    try {
      const response = await getStudentAssignments({ page: 1, pageSize: 5, status: "pending" });
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoadingAssignments(false);
    }
  }, [authUser, tokens]);


  useEffect(() => {
    loadDashboard();
    loadWidgets();
    loadAssignments();

    // Keep storage listener for backward compatibility
    const handleStorage = (event) => {
      if (event.key === "aela.student.dashboard") {
        setDashboardData(getStudentDashboard());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadDashboard, loadWidgets, loadAssignments]);

  // Listen for quiz completion events to refresh dashboard and points
  useEffect(() => {
    const handleQuizComplete = () => {
      // Refresh points immediately (from PointsContext)
      if (refreshPoints) {
        setTimeout(() => {
          refreshPoints();
        }, 500);
      }
      // Refresh dashboard after a short delay to allow backend to process
      setTimeout(() => {
        loadDashboard();
      }, 1000);
    };

    window.addEventListener("quizCompleted", handleQuizComplete);
    return () => window.removeEventListener("quizCompleted", handleQuizComplete);
  }, [loadDashboard, refreshPoints]);

  const notificationsCount = useMemo(
    () => notifications.filter((notification) => notification.type !== "archived").length,
    [notifications]
  );

  const {
    journeyStats = [],
    ongoingCourses = [],
    learnEarnProgress = {},
    actionShortcuts = [],
  } = dashboardData || {};

  const streak = learnEarnProgress?.streak ?? 0;
  const badges = learnEarnProgress?.badges ?? [];
  // Use live coin balance from PointsContext instead of static dashboard data
  const coinsToRedeem = aelaPoints ?? learnEarnProgress?.coinsToRedeem ?? 0;
  const leaderboardPosition = learnEarnProgress?.leaderboardPosition ?? 0;
  const redeemRoute = learnEarnProgress?.redeemRoute ?? "/learn-earn/wallet";
  
  // Update journeyStats with live coin balance
  const updatedJourneyStats = useMemo(() => {
    return journeyStats.map((stat) => {
      if (stat.id === "aelaCoins") {
        return {
          ...stat,
          value: coinsToRedeem.toString(), // Use live balance
        };
      }
      return stat;
    });
  }, [journeyStats, coinsToRedeem]);


  const shortcutIcons = useMemo(
    () => ({
      gift: HiOutlineGift,
      sparkles: HiOutlineSparkles,
      blog: HiOutlineNewspaper,
    }),
    []
  );

  if (!dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <p className="text-sm text-slate-300/80">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <SEO
        title="Student Dashboard | Digital AELA"
        description="Track your courses, Learn & Earn progress, and upcoming sessions in the Digital AELA student dashboard."
        keywords="student dashboard, course progress, aela coins, learn and earn"
        url="https://digitalaela.com/student/dashboard"
      />

      <div className="space-y-10">
          <motion.header
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">
                  Learning journey
                </p>
                <h1 className="text-3xl font-semibold md:text-4xl">
                  Welcome back, {profile?.name?.split(" ")[0] ?? "Learner"}
                </h1>
                <p className="mt-2 text-sm text-slate-300/80">
                  Your courses, coins, and community progress at a glance.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Consistency streak ·{" "}
                  <span className="font-semibold text-sky-200">{streak} days</span>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Upcoming mentor call · <span className="font-semibold text-sky-200">Sunday</span>
                </div>
              </div>
            </div>
          </motion.header>

          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {updatedJourneyStats.map((stat) => (
              <motion.div
                key={stat.id}
                variants={cardVariants}
                className="rounded-3xl border border-sky-400/20 bg-[#060A17]/90 p-5 shadow-[0_24px_80px_rgba(20,30,60,0.4)]">
                <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-xs text-slate-300/80">{stat.delta}</p>
              </motion.div>
            ))}
          </motion.section>

          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {actionShortcuts.map((shortcut) => {
              const Icon = shortcutIcons[shortcut.icon] ?? HiOutlineSparkles;
              return (
                <motion.div key={shortcut.id} variants={cardVariants}>
                  <Link
                    to={shortcut.to}
                    className={`group block rounded-3xl border bg-[#060A17]/95 p-5 shadow-[0_24px_80px_rgba(20,30,60,0.35)] transition ${shortcut.tone}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{shortcut.title}</p>
                        <p className="mt-2 text-xs text-slate-200/80">{shortcut.description}</p>
                      </div>
                      <Icon className="h-6 w-6 opacity-80" />
                    </div>
                    <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80 transition group-hover:text-white">
                      Go to action <HiOutlineArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">In-progress courses</h2>
                <Link
                  to="/student/courses"
                  className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:border-sky-300/70 hover:text-sky-100">
                  View all
                </Link>
              </header>
              <div className="space-y-3">
                {ongoingCourses.map((course) => (
                  <Link
                    key={course.title}
                    to={course.route}
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/50">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{course.title}</p>
                        <p className="text-xs text-slate-400">Mentor · {course.mentor}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1">
                          <HiOutlineCalendarDays className="text-sky-200" />
                          {course.nextSession}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          Progress · {course.progress}%
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          {course.access}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${course.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Learn & Earn</h2>
                <div className="flex items-center gap-2">
                  <Link
                    to="/student/points/history"
                    className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:border-sky-300/70 hover:text-sky-100">
                    History
                  </Link>
                  <Link
                    to={redeemRoute}
                    className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:border-sky-300/70 hover:text-sky-100">
                    Redeem now
                  </Link>
                </div>
              </header>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <p className="font-semibold text-white">Current streak</p>
                <p className="mt-1 text-xs text-slate-300/80">
                  {streak} days · unlock bonus at day 10
                </p>
              </div>
              <div className="space-y-3">
                {badges.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
                    <span className="text-xl">{badge.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{badge.label}</p>
                      <p className="text-slate-300/80">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-[#0ea5e9]/40 bg-[#0ea5e9]/10 px-4 py-3 text-xs text-sky-100">
                Leaderboard position · <span className="font-semibold text-white">#{leaderboardPosition}</span>
                <br />
                Coins available · <span className="font-semibold text-white">{coinsToRedeem}</span>
              </div>
            </motion.div>
          </section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HiOutlineMegaphone className="h-5 w-5" />
                Announcements
              </h2>
              <Link
                to="/student/announcements"
                className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:border-sky-300/70 hover:text-sky-100">
                View all
              </Link>
            </header>
            <div className="text-center py-8 text-sm text-slate-400">
              <HiOutlineMegaphone className="h-12 w-12 mx-auto mb-3 text-slate-500" />
              <p>Stay updated with platform announcements</p>
              <Link
                to="/student/announcements"
                className="mt-4 inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold hover:from-sky-600 hover:to-sky-700 transition">
                View Announcements
              </Link>
            </div>
          </motion.section>

          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HiOutlineDocumentText className="h-5 w-5" />
                Due Assignments
              </h2>
              <Link
                to="/student/assignments"
                className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:border-sky-300/70 hover:text-sky-100">
                View all
              </Link>
            </header>
            {loadingAssignments ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
            ) : assignments.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No pending assignments</div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 3).map((assignment) => {
                  const isOverdue = new Date(assignment.dueDate) < new Date();
                  return (
                    <Link
                      key={assignment._id}
                      to={`/student/assignments/${assignment._id}`}
                      className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{assignment.title}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {assignment.course?.title || "Course"}
                          </p>
                          <p
                            className={`text-xs mt-1 flex items-center gap-1 ${
                              isOverdue ? "text-red-400" : "text-slate-300"
                            }`}>
                            <HiOutlineCalendarDays className="h-3 w-3" />
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        {isOverdue && (
                          <HiOutlineExclamationTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.section>

          {/* Enhanced Dashboard Widgets Section */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 lg:grid-cols-2">
            {/* Recent Activity Widget */}
            <motion.div
              variants={cardVariants}
              className="space-y-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              </header>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingWidgets ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
                ) : widgetsData.recentActivity.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No recent activity</div>
                ) : (
                  widgetsData.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                      <span className="text-lg">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{activity.title}</p>
                        <p className="mt-1 text-slate-400">{activity.timeAgo}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Weekly Progress Widget */}
            <motion.div
              variants={cardVariants}
              className="space-y-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Weekly Progress</h2>
              </header>
              <div className="space-y-2">
                {loadingWidgets ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
                ) : widgetsData.weeklyProgress.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No progress data</div>
                ) : (
                  widgetsData.weeklyProgress.map((day, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-12 text-xs text-slate-400">{day.day}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-300">{day.hours}h</span>
                          <span className="text-xs text-slate-400">{day.lessons} lessons</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(day.hours / 2) * 100}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Learning Goals Widget */}
            <motion.div
              variants={cardVariants}
              className="space-y-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Learning Goals</h2>
              </header>
              <div className="space-y-4">
                {loadingWidgets ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
                ) : !widgetsData.learningGoals || Object.keys(widgetsData.learningGoals).length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No goals set</div>
                ) : (
                  Object.entries(widgetsData.learningGoals).map(([key, goal]) => {
                    const percentage = Math.min((goal.current / goal.target) * 100, 100);
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                          <span className="text-slate-400">
                            {goal.current} / {goal.target} {goal.unit}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Course Recommendations Widget */}
            <motion.div
              variants={cardVariants}
              className="space-y-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recommended Courses</h2>
                <Link
                  to="/learn-earn/courses"
                  className="text-xs text-sky-200 hover:text-sky-100 transition">
                  View all
                </Link>
              </header>
              <div className="space-y-3">
                {loadingWidgets ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
                ) : widgetsData.recommendations.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No recommendations</div>
                ) : (
                  widgetsData.recommendations.map((course) => (
                    <Link
                      key={course.id}
                      to={course.route}
                      className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-sky-400/50">
                      <p className="font-semibold text-white">{course.title}</p>
                      <p className="mt-1 text-xs text-slate-400">by {course.instructor}</p>
                      <p className="mt-1 text-xs text-sky-200">
                        {course.price === 0 ? "Free" : `AED ${course.price}`}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </motion.section>

        <motion.section
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
          <header className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <HiOutlineAcademicCap className="h-5 w-5" />
              Batch Information
            </h2>
            <Link
              to="/student/batch"
              className="flex items-center gap-2 rounded-full border border-sky-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200 transition hover:border-sky-300/70 hover:text-sky-100">
              View details →
            </Link>
          </header>
          <div className="text-center py-8 text-sm text-slate-400">
            <HiOutlineAcademicCap className="h-12 w-12 mx-auto mb-3 text-slate-500" />
            <p>View your batch schedule, classmates, and course details</p>
            <Link
              to="/student/batch"
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold hover:from-sky-600 hover:to-sky-700 transition">
              View Batch Information
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default StudentDashboard;

