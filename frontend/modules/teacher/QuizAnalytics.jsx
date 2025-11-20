import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineTrophy,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { fetchQuizAnalytics } from "../../src/services/api/quizzes";
import { useQuizAttemptUpdates } from "../../src/hooks/useRealtimeUpdates";

const QuizAnalytics = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuizAnalytics(quizId);
      setAnalytics(data);
    } catch (error) {
      toast.error(error.message || "Failed to load quiz analytics");
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    if (!isAuthenticated || !user || (user.role !== "teacher" && user.role !== "admin")) {
      toast.info("Only teachers and admins can view quiz analytics");
      navigate("/");
      return;
    }

    if (quizId) {
      loadAnalytics();
    }
  }, [quizId, isAuthenticated, user, navigate, loadAnalytics]);

  const formatTime = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Real-time quiz attempt updates
  const handleNewAttempt = useCallback((attempt) => {
    // Reload analytics when new attempt is submitted
    loadAnalytics();
  }, [loadAnalytics]);

  useQuizAttemptUpdates(quizId, handleNewAttempt);

  if (!isAuthenticated || !user || (user.role !== "teacher" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Quiz Analytics | Digital AELA"
        description="View detailed analytics for your quiz"
        keywords="quiz analytics, quiz statistics, quiz performance"
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
                to="/teacher/quizzes"
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:border-sky-400/50 hover:bg-sky-500/10">
                <HiOutlineArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Quiz Analytics</p>
                <h1 className="text-3xl font-semibold md:text-4xl">
                  {analytics?.quiz?.title || "Loading..."}
                </h1>
              </div>
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
                  <HiOutlineUsers className="mx-auto mb-2 h-8 w-8 text-blue-400" />
                  <p className="text-2xl font-semibold text-white">{analytics.analytics.totalAttempts}</p>
                  <p className="text-xs text-slate-400">Total Attempts</p>
                </div>
                <div className="text-center">
                  <HiOutlineUsers className="mx-auto mb-2 h-8 w-8 text-green-400" />
                  <p className="text-2xl font-semibold text-white">{analytics.analytics.uniqueStudents}</p>
                  <p className="text-xs text-slate-400">Unique Students</p>
                </div>
                <div className="text-center">
                  <HiOutlineChartBar className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                  <p className="text-2xl font-semibold text-white">{analytics.analytics.averageScore}%</p>
                  <p className="text-xs text-slate-400">Average Score</p>
                </div>
                <div className="text-center">
                  <HiOutlineClock className="mx-auto mb-2 h-8 w-8 text-purple-400" />
                  <p className="text-2xl font-semibold text-white">
                    {formatTime(analytics.analytics.averageTimeSpent)}
                  </p>
                  <p className="text-xs text-slate-400">Avg Time</p>
                </div>
              </motion.div>

              {/* Score Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Score Distribution</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/20 p-4 text-center">
                    <HiOutlineTrophy className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                    <p className="text-xl font-bold text-emerald-400">
                      {analytics.analytics.scoreDistribution.excellent}
                    </p>
                    <p className="text-xs text-slate-300">Excellent (90-100%)</p>
                  </div>
                  <div className="rounded-2xl border border-green-500/40 bg-green-500/20 p-4 text-center">
                    <HiOutlineCheckCircle className="mx-auto mb-2 h-6 w-6 text-green-400" />
                    <p className="text-xl font-bold text-green-400">
                      {analytics.analytics.scoreDistribution.good}
                    </p>
                    <p className="text-xs text-slate-300">Good (70-89%)</p>
                  </div>
                  <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/20 p-4 text-center">
                    <HiOutlineChartBar className="mx-auto mb-2 h-6 w-6 text-yellow-400" />
                    <p className="text-xl font-bold text-yellow-400">
                      {analytics.analytics.scoreDistribution.average}
                    </p>
                    <p className="text-xs text-slate-300">Average (50-69%)</p>
                  </div>
                  <div className="rounded-2xl border border-red-500/40 bg-red-500/20 p-4 text-center">
                    <HiOutlineXCircle className="mx-auto mb-2 h-6 w-6 text-red-400" />
                    <p className="text-xl font-bold text-red-400">
                      {analytics.analytics.scoreDistribution.poor}
                    </p>
                    <p className="text-xs text-slate-300">Poor (&lt;50%)</p>
                  </div>
                </div>
              </motion.div>

              {/* Question Statistics */}
              {analytics.analytics.questionStats && analytics.analytics.questionStats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Question Performance</h3>
                  <div className="space-y-3">
                    {analytics.analytics.questionStats.map((stat, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">
                            Q{stat.questionIndex + 1}: {stat.question}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              stat.accuracy >= 70
                                ? "bg-green-500/20 text-green-400"
                                : stat.accuracy >= 50
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}>
                            {stat.accuracy.toFixed(1)}% accuracy
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>{stat.correctCount} correct</span>
                          <span>{stat.totalAttempts - stat.correctCount} incorrect</span>
                          <span>{stat.totalAttempts} total attempts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recent Attempts */}
              {analytics.analytics.recentAttempts && analytics.analytics.recentAttempts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Recent Attempts</h3>
                  <div className="space-y-2">
                    {analytics.analytics.recentAttempts.map((attempt, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{attempt.studentName}</p>
                          <p className="text-xs text-slate-400">{attempt.studentEmail}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              attempt.score >= 90
                                ? "text-emerald-400"
                                : attempt.score >= 70
                                  ? "text-green-400"
                                  : attempt.score >= 50
                                    ? "text-yellow-400"
                                    : "text-red-400"
                            }`}>
                            {attempt.score}%
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(attempt.completedAt).toLocaleDateString()}
                          </p>
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

export default QuizAnalytics;

