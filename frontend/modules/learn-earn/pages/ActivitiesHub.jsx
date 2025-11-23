import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { useTimer } from "react-timer-hook";
import { toast } from "react-toastify";
import { FaBookReader, FaSpinner } from "react-icons/fa";
import { useUser } from "../../../src/contexts/UserContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import { usePoints } from "../../../src/contexts/PointsContext";
import { submitQuizAttempt, fetchQuizzes, fetchQuizHistory } from "../../../src/services/api/quizzes";

const ActivitiesHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Load quizzes and quiz history from backend in parallel for better performance
  useEffect(() => {
    const loadQuizHistory = async () => {
      if (!authUser || !tokens?.accessToken || authUser.role !== "student") {
        return;
      }

      try {
        const response = await fetchQuizHistory({ pageSize: 50 }); // Reduced from 100 to 50
        if (response?.data) {
          const attemptsMap = new Map();
          response.data.forEach((attempt) => {
            // Normalize quiz ID - handle both ObjectId and string formats
            let quizId = null;
            if (attempt.quiz) {
              quizId = typeof attempt.quiz === 'object' && attempt.quiz._id 
                ? attempt.quiz._id.toString() 
                : attempt.quiz.toString();
            } else if (attempt.quizId) {
              quizId = attempt.quizId.toString();
            }
            
            if (quizId) {
              // Store with normalized string ID
              attemptsMap.set(quizId, {
                score: attempt.score || 0,
                correctAnswers: attempt.correctAnswers || 0,
                totalQuestions: attempt.totalQuestions || 0,
                coinsEarned: attempt.coinsEarned || 0,
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

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load quizzes and quiz history in parallel for faster loading
        const [quizzesResponse, historyResponse] = await Promise.allSettled([
          fetchQuizzes({ pageSize: 50 }), // Reduced from 100 to 50 for faster initial load
          authUser && tokens?.accessToken && authUser.role === "student"
            ? fetchQuizHistory({ pageSize: 50 })
            : Promise.resolve(null),
        ]);

        // Handle quizzes response
        if (quizzesResponse.status === "fulfilled" && quizzesResponse.value?.quizzes) {
          setQuizzes(quizzesResponse.value.quizzes);
        } else if (quizzesResponse.status === "rejected") {
          // eslint-disable-next-line no-console
          console.error("Failed to load quizzes:", quizzesResponse.reason);
          toast.error("Failed to load quizzes");
        }

        // Handle quiz history response
        if (historyResponse.status === "fulfilled" && historyResponse.value?.data) {
          const attemptsMap = new Map();
          historyResponse.value.data.forEach((attempt) => {
            let quizId = null;
            if (attempt.quiz) {
              quizId = typeof attempt.quiz === 'object' && attempt.quiz._id 
                ? attempt.quiz._id.toString() 
                : attempt.quiz.toString();
            } else if (attempt.quizId) {
              quizId = attempt.quizId.toString();
            }
            
            if (quizId) {
              attemptsMap.set(quizId, {
                score: attempt.score || 0,
                correctAnswers: attempt.correctAnswers || 0,
                totalQuestions: attempt.totalQuestions || 0,
                coinsEarned: attempt.coinsEarned || 0,
                completedAt: attempt.completedAt,
              });
            }
          });
          setQuizAttempts(attemptsMap);
        } else if (historyResponse.status === "rejected") {
          // eslint-disable-next-line no-console
          console.warn("Failed to load quiz history:", historyResponse.reason);
          // Don't show error toast - it's okay if history fails
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load data:", error);
        toast.error("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Listen for quiz completion events to refresh attempts
    const handleQuizCompleted = (event) => {
      console.log("Quiz completed event received, refreshing history...", event.detail);
      // Add a delay to ensure backend has processed the attempt, then retry a few times
      let retries = 0;
      const maxRetries = 3;
      
      const tryRefresh = () => {
        setTimeout(() => {
          console.log(`Refreshing quiz history (attempt ${retries + 1}/${maxRetries})...`);
          loadQuizHistory();
          retries++;
          if (retries < maxRetries) {
            tryRefresh();
          }
        }, 500 * (retries + 1)); // Increasing delay: 500ms, 1000ms, 1500ms
      };
      
      tryRefresh();
    };
    
    // Also refresh when page becomes visible (user returns from quiz page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page visible, refreshing quiz history...");
        loadQuizHistory();
      }
    };
    
    window.addEventListener("quizCompleted", handleQuizCompleted);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("quizCompleted", handleQuizCompleted);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authUser, tokens]);
  
  // Refresh quiz history when returning to this page or when location changes
  useEffect(() => {
    if (location.pathname === "/learn-earn/activities" && authUser && tokens?.accessToken) {
      const loadQuizHistory = async () => {
        try {
          console.log("Refreshing quiz history on location change...");
          const response = await fetchQuizHistory({ pageSize: 100 });
          if (response?.data) {
            const attemptsMap = new Map();
            response.data.forEach((attempt) => {
              let quizId = null;
              if (attempt.quiz) {
                quizId = typeof attempt.quiz === 'object' && attempt.quiz._id 
                  ? attempt.quiz._id.toString() 
                  : attempt.quiz.toString();
              } else if (attempt.quizId) {
                quizId = attempt.quizId.toString();
              }
              
              if (quizId) {
                attemptsMap.set(quizId, {
                  score: attempt.score || 0,
                  correctAnswers: attempt.correctAnswers || 0,
                  totalQuestions: attempt.totalQuestions || 0,
                  coinsEarned: attempt.coinsEarned || 0,
                  completedAt: attempt.completedAt,
                });
              }
            });
            console.log("Quiz history refreshed, attempts:", Array.from(attemptsMap.keys()));
            setQuizAttempts(attemptsMap);
          }
        } catch (error) {
          console.error("Failed to load quiz history:", error);
        }
      };
      // Small delay to ensure backend has processed
      const timeoutId = setTimeout(loadQuizHistory, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, location.key, authUser, tokens]);
  
  // Also refresh when window gains focus (user switches back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (location.pathname === "/learn-earn/activities" && authUser && tokens?.accessToken) {
        console.log("Window focused, refreshing quiz history...");
        const loadQuizHistory = async () => {
          try {
            const response = await fetchQuizHistory({ pageSize: 100 });
            if (response?.data) {
              const attemptsMap = new Map();
              response.data.forEach((attempt) => {
                let quizId = null;
                if (attempt.quiz) {
                  quizId = typeof attempt.quiz === 'object' && attempt.quiz._id 
                    ? attempt.quiz._id.toString() 
                    : attempt.quiz.toString();
                } else if (attempt.quizId) {
                  quizId = attempt.quizId.toString();
                }
                
                if (quizId) {
                  attemptsMap.set(quizId, {
                    score: attempt.score || 0,
                    correctAnswers: attempt.correctAnswers || 0,
                    totalQuestions: attempt.totalQuestions || 0,
                    coinsEarned: attempt.coinsEarned || 0,
                    completedAt: attempt.completedAt,
                  });
                }
              });
              setQuizAttempts(attemptsMap);
            }
          } catch (error) {
            console.error("Failed to load quiz history on focus:", error);
          }
        };
        loadQuizHistory();
      }
    };
    
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [location.pathname, authUser, tokens]);

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
        title: "Quizzes",
        icon: FaBookReader,
        description: "Test your knowledge and earn coins with interactive quizzes covering various topics.",
        items: [],
      },
    };

    quizzes.forEach((quiz) => {
      const category = quiz.category || "quiz";
      if (grouped[category]) {
        // Normalize quiz ID to string for matching
        const quizId = (quiz.id || quiz._id || '').toString();
        
        // Try to find attempt by normalized ID
        const attempt = quizAttempts.get(quizId);
        const hasAttempted = quizAttempts.has(quizId);
        
        // Debug logging (only log mismatches to reduce noise)
        if (!hasAttempted && quizAttempts.size > 0) {
          // Only log if we have attempts but this quiz isn't found
          const availableIds = Array.from(quizAttempts.keys());
          const isCloseMatch = availableIds.some(id => id.includes(quizId) || quizId.includes(id));
          if (!isCloseMatch) {
            console.log(`⚠ Quiz ${quizId} (${quiz.title}) not found in attempts. Available IDs:`, availableIds);
          }
        }

        grouped[category].items.push({
          id: quizId,
          name: quiz.title,
          difficulty: formatDifficulty(quiz.difficulty),
          reward: quiz.rewardCoins || 0,
          description: quiz.description,
          totalQuestions: quiz.totalQuestions || 0,
          duration: quiz.duration || 0,
          hasAttempted,
          attemptResult: attempt ? {
            score: attempt.score || 0,
            correctAnswers: attempt.correctAnswers || 0,
            totalQuestions: attempt.totalQuestions || 0,
            coinsEarned: attempt.coinsEarned || 0,
            completedAt: attempt.completedAt,
          } : null,
        });
      }
    });

    return grouped;
  }, [quizzes, quizAttempts]);

  const categoryKeys = Object.keys(categories);
  const activeData = categories[activeCategory];

  const handleStart = async (item) => {
    const itemId = item.id;
    
    // Navigate to quiz play page
    navigate(`/learn-earn/quiz/${itemId}`);
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
              className={`space-y-4 rounded-2xl border p-5 ${
                item.hasAttempted 
                  ? "border-[#D4AF37]/30 bg-[#111]/80" 
                  : "border-white/5 bg-[#111]"
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.difficulty}</p>
                </div>
                <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-semibold text-[#D4AF37]">
                  +{item.reward} coins
                </span>
              </div>
              
              {/* Show result if attempted */}
              {item.hasAttempted && item.attemptResult && (
                <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Your Score</span>
                    <span className="text-lg font-bold text-[#D4AF37]">
                      {item.attemptResult.score}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {item.attemptResult.correctAnswers} / {item.attemptResult.totalQuestions} correct
                    </span>
                    <span className="text-[#D4AF37] font-semibold">
                      +{item.attemptResult.coinsEarned} coins earned
                    </span>
                </div>
                </div>
              )}
              
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                {!item.hasAttempted && <span>Complete in under 6 minutes</span>}
                <button
                  type="button"
                  onClick={() => !item.hasAttempted && handleStart(item)}
                  disabled={submitting.has(item.id) || item.hasAttempted}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold transition ${
                    item.hasAttempted
                      ? "border-gray-600/40 bg-[#1a1a1a] text-gray-500 cursor-not-allowed"
                      : "border-[#D4AF37]/40 bg-[#151515] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}>
                  {submitting.has(item.id) 
                    ? "Submitting..." 
                    : item.hasAttempted 
                    ? "Attempted" 
                    : "Start challenge"}
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


