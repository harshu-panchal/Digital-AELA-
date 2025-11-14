import { useMemo, useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { useTimer } from "react-timer-hook";
import { toast } from "react-toastify";
import { FaPuzzlePiece, FaHeadset, FaBookReader, FaSpinner } from "react-icons/fa";
import { useUser } from "../../../src/contexts/UserContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import { usePoints } from "../../../src/contexts/PointsContext";
import { submitQuizAttempt, fetchQuizzes, fetchQuizHistory } from "../../../src/services/api/quizzes";

const ActivitiesHub = () => {
  const { rewardCoins } = useUser();
  const { user: authUser, tokens } = useAuth();
  const { refreshPoints } = usePoints();
  const [activeCategory, setActiveCategory] = useState("quiz");
  const [submitting, setSubmitting] = useState(new Set());
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizAttempts, setQuizAttempts] = useState(new Map()); // Track user's quiz attempts

  const expiry = useMemo(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);

  const { hours, minutes, seconds } = useTimer({ expiryTimestamp: expiry, autoStart: true });

  // Load quizzes from backend
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        const response = await fetchQuizzes({ pageSize: 100 });
        if (response?.quizzes) {
          setQuizzes(response.quizzes);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load quizzes:", error);
        toast.error("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  // Load user's quiz history to show progress
  useEffect(() => {
    const loadQuizHistory = async () => {
      if (!authUser || !tokens?.accessToken || authUser.role !== "student") {
        return;
      }

      try {
        const response = await fetchQuizHistory({ pageSize: 100 });
        if (response?.data) {
          const attemptsMap = new Map();
          response.data.forEach((attempt) => {
            const quizId = attempt.quiz?.toString() || attempt.quizId;
            if (quizId) {
              attemptsMap.set(quizId, {
                score: attempt.score || 0,
                completedAt: attempt.completedAt,
              });
            }
          });
          setQuizAttempts(attemptsMap);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load quiz history:", error);
        // Don't show error toast - it's okay if history fails
      }
    };

    loadQuizHistory();
  }, [authUser, tokens]);

  // Map difficulty from backend to display format
  const formatDifficulty = (difficulty) => {
    const map = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      "all-levels": "All Levels",
    };
    return map[difficulty] || difficulty;
  };

  // Group quizzes by category
  const categories = useMemo(() => {
    const grouped = {
      quiz: {
        title: "Daily English Quizzes",
        icon: FaBookReader,
        description: "Sharpen grammar, comprehension, and listening with adaptive quizzes.",
        items: [],
      },
      vocabulary: {
        title: "Vocabulary Games",
        icon: FaPuzzlePiece,
        description: "Gamified flashcards, match-ups, and speed rounds to boost recall.",
        items: [],
      },
      speaking: {
        title: "Listening & Speaking",
        icon: FaHeadset,
        description: "Voice prompts, interview drills, and pronunciation feedback sessions.",
        items: [],
      },
    };

    quizzes.forEach((quiz) => {
      const category = quiz.category || "quiz";
      if (grouped[category]) {
        const attempt = quizAttempts.get(quiz.id);
        const progress = attempt ? attempt.score || 0 : 0;

        grouped[category].items.push({
          id: quiz.id,
          name: quiz.title,
          difficulty: formatDifficulty(quiz.difficulty),
          reward: quiz.rewardCoins || 0,
          progress,
          description: quiz.description,
          totalQuestions: quiz.totalQuestions || 0,
          duration: quiz.duration || 0,
        });
      }
    });

    return grouped;
  }, [quizzes, quizAttempts]);

  const categoryKeys = Object.keys(categories);
  const activeData = categories[activeCategory];

  const handleStart = async (item) => {
    const itemId = item.id;
    
    // Prevent duplicate submissions
    if (submitting.has(itemId)) {
      return;
    }

    // For now, we'll simulate quiz completion
    // In a full implementation, you'd navigate to a quiz-taking page
    toast.info("Quiz feature coming soon! For now, simulating completion...", { icon: "📝" });

    setSubmitting((prev) => new Set(prev).add(itemId));

    try {
      // Simulate quiz completion with a random score
      const simulatedScore = Math.floor(Math.random() * 40) + 60; // 60-100%
      const simulatedCorrectAnswers = Math.round((simulatedScore / 100) * (item.totalQuestions || 10));
      const simulatedTimeSpent = Math.floor(Math.random() * 180) + 120; // 2-5 minutes

      // If user has backend auth, submit to backend
      if (authUser && tokens?.accessToken && authUser.role === "student") {
        try {
          const result = await submitQuizAttempt({
            quizId: itemId,
            quizName: item.name,
            category: activeCategory,
            score: simulatedScore,
            totalQuestions: item.totalQuestions || 10,
            correctAnswers: simulatedCorrectAnswers,
            timeSpent: simulatedTimeSpent,
            rewardCoins: item.reward,
          });

          const coinsEarned = result.attempt?.coinsEarned || item.reward;
          // Backend returns totalCoins (total in account) and availableCoins (total - redeemed)
          const newAvailableCoins = result.points?.availableCoins;
          const newTotalCoins = result.points?.totalCoins;
          
          // eslint-disable-next-line no-console
          console.log("Quiz completed - backend response:", {
            coinsEarned,
            newAvailableCoins,
            newTotalCoins,
            fullResult: result,
          });
          
          // If backend returned coins data, use it as source of truth
          if (newAvailableCoins !== undefined) {
            // Backend already saved the coins, so use the backend value directly
            // Update localStorage immediately with backend value (this is the source of truth)
            localStorage.setItem("aelaPoints", newAvailableCoins.toString());
            // Update local state to match backend (don't add again, backend already did)
            // We need to set the total, not add to it
            if (refreshPoints) {
              // Refresh will load the correct value from backend
              setTimeout(() => refreshPoints(), 300);
            } else {
              // If refreshPoints not available, manually update via addPoints
              // But calculate the difference to add
              const currentCoins = parseInt(localStorage.getItem("aelaPoints") || "0", 10);
              const coinsToAdd = newAvailableCoins - currentCoins;
              if (coinsToAdd > 0) {
                rewardCoins(coinsToAdd, `${item.name} completed`);
              }
            }
          } else {
            // Backend didn't return coins - update locally and refresh
            rewardCoins(coinsEarned, `${item.name} completed`);
            if (refreshPoints) {
              setTimeout(() => refreshPoints(), 800);
              setTimeout(() => refreshPoints(), 2000);
            }
          }

          toast.success(
            `+${coinsEarned} coins awarded for completing ${item.name}`,
            { icon: "🏆" }
          );

          // Update quiz attempts map with the new attempt
          setQuizAttempts((prev) => {
            const next = new Map(prev);
            next.set(itemId, {
              score: simulatedScore,
              completedAt: new Date(),
            });
            return next;
          });

          // Dispatch event to refresh student dashboard
          window.dispatchEvent(new CustomEvent("quizCompleted"));
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to submit quiz to backend:", error);
          // Fall back to local reward
          const gained = rewardCoins(item.reward, `${item.name} completed`);
          toast.success(`+${gained} coins awarded for completing ${item.name}`, { icon: "🏆" });
        }
      } else {
        // No backend auth - use local only
        const gained = rewardCoins(item.reward, `${item.name} completed`);
        toast.success(`+${gained} coins awarded for completing ${item.name}`, { icon: "🏆" });
      }
    } finally {
      setSubmitting((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#161616] via-[#0c0c0c] to-black p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Daily streak reset</p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-sm text-gray-300">Complete at least one challenge before midnight</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds
                .toString()
                .padStart(2, "0")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#151515] px-4 py-2 text-xs text-[#D4AF37]">
            3-day streak active · +60 bonus coins on completion
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-3xl border border-white/5 bg-[#0f0f0f] p-2">
        {categoryKeys.map((key) => {
          const CategoryIcon = categories[key].icon;
          const isActive = key === activeCategory;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              className={`flex flex-1 min-w-[180px] items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs transition sm:text-sm ${
                isActive
                  ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#E5C158]/20 text-[#D4AF37]"
                  : "text-gray-400 hover:text-white"
              }`}>
              <CategoryIcon className={`h-5 w-5 ${isActive ? "text-[#D4AF37]" : "text-gray-500"}`} />
              {categories[key].title}
            </button>
          );
        })}
      </div>

      <Motion.div
        key={activeCategory}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6 rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">{activeData.title}</p>
          <p className="mt-3 text-sm text-gray-300">{activeData.description}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
            </div>
          ) : activeData.items.length === 0 ? (
            <div className="col-span-2 rounded-2xl border border-white/5 bg-[#111] p-8 text-center">
              <p className="text-sm text-gray-400">No {activeData.title.toLowerCase()} available at the moment.</p>
              <p className="mt-2 text-xs text-gray-500">
                Check back later or ask your teacher/admin to upload new quizzes!
              </p>
            </div>
          ) : (
            activeData.items.map((item) => (
            <Motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25 }}
              className="space-y-4 rounded-2xl border border-white/5 bg-[#111] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.difficulty}</p>
                </div>
                <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-semibold text-[#D4AF37]">
                  +{item.reward} coins
                </span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
                  <Motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${item.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158]"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                <span>Complete in under 6 minutes</span>
                <button
                  type="button"
                  onClick={() => handleStart(item)}
                  disabled={submitting.has(item.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#151515] px-4 py-2 font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting.has(item.id) ? "Submitting..." : "Start challenge"}
                </button>
              </div>
            </Motion.div>
            ))
          )}
        </div>
      </Motion.div>
    </div>
  );
};

export default ActivitiesHub;


