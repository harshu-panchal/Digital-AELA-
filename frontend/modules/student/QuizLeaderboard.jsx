import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineTrophy,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import { FaCoins, FaMedal } from "react-icons/fa";
import { toast } from "react-toastify";
import SEO from "../../src/components/SEO";
import { fetchQuizLeaderboard } from "../../src/services/api/quizzes";

const QuizLeaderboard = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (quizId) {
      loadLeaderboard();
    }
  }, [quizId, pagination.page]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuizLeaderboard(quizId, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setLeaderboard(data.leaderboard || []);
      setQuiz(data.quiz);
      setPagination(data.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load leaderboard");
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <HiOutlineTrophy className="h-6 w-6 text-yellow-400" />;
    if (rank === 2) return <FaMedal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <HiOutlineStar className="h-6 w-6 text-amber-600" />;
    return <span className="text-sm font-bold text-slate-400">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-[#03040B] text-white">
      <SEO
        title="Quiz Leaderboard | Digital AELA"
        description="View the leaderboard for this quiz"
        keywords="quiz leaderboard, quiz rankings, quiz scores"
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
              <button
                onClick={() => navigate(-1)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:border-sky-400/50 hover:bg-sky-500/10">
                <HiOutlineArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Quiz Leaderboard</p>
                <h1 className="text-3xl font-semibold md:text-4xl">{quiz?.title || "Loading..."}</h1>
              </div>
            </div>
          </motion.header>

          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-slate-300/80">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#060A17]/90 p-12 text-center">
              <HiOutlineTrophy className="mb-4 h-16 w-16 text-slate-400/50" />
              <h3 className="text-xl font-semibold text-white">No leaderboard data</h3>
              <p className="mt-2 text-sm text-slate-300/80">
                Be the first to complete this quiz and appear on the leaderboard!
              </p>
            </motion.div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-3 gap-4">
                  {/* 2nd Place */}
                  <div className="order-2 rounded-2xl border border-gray-500/40 bg-gray-500/20 p-4 text-center">
                    <div className="mb-2 flex justify-center">
                      <FaMedal className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-bold text-white">{leaderboard[1]?.studentName || "N/A"}</p>
                    <p className="text-2xl font-bold text-gray-400">{leaderboard[1]?.score || 0}%</p>
                    <p className="text-xs text-slate-400">2nd Place</p>
                  </div>

                  {/* 1st Place */}
                  <div className="order-1 rounded-2xl border border-yellow-500/40 bg-yellow-500/20 p-4 text-center">
                    <div className="mb-2 flex justify-center">
                      <HiOutlineTrophy className="h-8 w-8 text-yellow-400" />
                    </div>
                    <p className="text-lg font-bold text-white">{leaderboard[0]?.studentName || "N/A"}</p>
                    <p className="text-2xl font-bold text-yellow-400">{leaderboard[0]?.score || 0}%</p>
                    <p className="text-xs text-slate-400">1st Place</p>
                  </div>

                  {/* 3rd Place */}
                  <div className="order-3 rounded-2xl border border-amber-600/40 bg-amber-600/20 p-4 text-center">
                    <div className="mb-2 flex justify-center">
                      <HiOutlineStar className="h-8 w-8 text-amber-600" />
                    </div>
                    <p className="text-lg font-bold text-white">{leaderboard[2]?.studentName || "N/A"}</p>
                    <p className="text-2xl font-bold text-amber-600">{leaderboard[2]?.score || 0}%</p>
                    <p className="text-xs text-slate-400">3rd Place</p>
                  </div>
                </motion.div>
              )}

              {/* Leaderboard List */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Full Leaderboard</h3>
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.studentId}
                      className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                        entry.rank <= 3
                          ? "border-yellow-500/40 bg-yellow-500/10"
                          : "border-white/10 bg-white/5"
                      }`}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">{entry.studentName}</p>
                          <p className="text-xs text-slate-400">{entry.studentEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p
                            className={`text-lg font-bold ${
                              entry.score >= 90
                                ? "text-emerald-400"
                                : entry.score >= 70
                                  ? "text-green-400"
                                  : entry.score >= 50
                                    ? "text-yellow-400"
                                    : "text-red-400"
                            }`}>
                            {entry.score}%
                          </p>
                          <p className="text-xs text-slate-400">Score</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{formatTime(entry.timeSpent)}</p>
                          <p className="text-xs text-slate-400">Time</p>
                        </div>
                        {entry.coinsEarned > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-yellow-400">
                              <FaCoins className="inline h-4 w-4" /> {entry.coinsEarned}
                            </p>
                            <p className="text-xs text-slate-400">Coins</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                    Previous
                  </button>
                  <span className="text-sm text-slate-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                    Next
                  </button>
                </motion.div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default QuizLeaderboard;

