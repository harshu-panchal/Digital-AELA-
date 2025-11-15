import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { FaCheck, FaTimes, FaClock, FaCoins, FaArrowLeft, FaSpinner, FaLock } from "react-icons/fa";
import { fetchQuizById, submitQuizAttempt, fetchQuizHistory } from "../../../src/services/api/quizzes";
import { useAuth } from "../../../src/contexts/AuthContext";
import { usePoints } from "../../../src/contexts/PointsContext";
import SEO from "../../../src/components/SEO";

const QuizPlay = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user: authUser, tokens } = useAuth();
  const { refreshPoints } = usePoints();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [submittedQuizId, setSubmittedQuizId] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        
        // Check if user has already attempted this quiz
        if (authUser && tokens?.accessToken && authUser.role === "student") {
          try {
            const historyResponse = await fetchQuizHistory({ pageSize: 100 });
            if (historyResponse?.data) {
              const attempted = historyResponse.data.some((attempt) => {
                const attemptQuizId = attempt.quiz?.toString() || attempt.quizId;
                return attemptQuizId === quizId;
              });
              if (attempted) {
                setHasAttempted(true);
                toast.error("You have already attempted this quiz. Each quiz can only be taken once.");
                setTimeout(() => navigate("/learn-earn/activities"), 2000);
                return;
              }
            }
          } catch (error) {
            // If history check fails, continue loading quiz
            console.warn("Failed to check quiz history:", error);
          }
        }
        
        const response = await fetchQuizById(quizId);
        if (response?.quiz) {
          setQuiz(response.quiz);
          // Initialize timer if duration is set
          if (response.quiz.duration && response.quiz.duration > 0) {
            setTimeRemaining(response.quiz.duration * 60); // Convert minutes to seconds
          }
          startTimeRef.current = Date.now();
        } else {
          toast.error("Quiz not found");
          navigate("/learn-earn/activities");
        }
      } catch (error) {
        console.error("Failed to load quiz:", error);
        toast.error("Failed to load quiz");
        navigate("/learn-earn/activities");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      loadQuiz();
    }
  }, [quizId, navigate, authUser, tokens]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !results) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeRemaining, results]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !authUser) {
      toast.error("Please log in to submit quiz");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Calculate results
      const questions = quiz.questions || [];
      let correctAnswers = 0;
      const submittedAnswers = [];

      questions.forEach((question, index) => {
        const userAnswer = answers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        if (isCorrect) correctAnswers++;
        
        submittedAnswers.push({
          questionIndex: index,
          question: question.question,
          userAnswer: userAnswer !== undefined ? userAnswer : -1,
          correctAnswer: question.correctAnswer,
          isCorrect,
        });
      });

      const totalQuestions = questions.length;
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const timeSpent = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;

      // Submit to backend - ensure quizId is a string
      const quizIdToSubmit = (quiz._id || quiz.id || '').toString();
      setSubmittedQuizId(quizIdToSubmit); // Store for use in results section
      console.log("Submitting quiz with ID:", quizIdToSubmit, "Quiz object:", quiz);
      
      const result = await submitQuizAttempt({
        quizId: quizIdToSubmit,
        quizName: quiz.title,
        category: quiz.category || "quiz",
        score,
        totalQuestions,
        correctAnswers,
        timeSpent,
        answers: submittedAnswers,
        rewardCoins: quiz.rewardCoins || 0,
      });
      
      console.log("Quiz submission result:", result);

      // Update points
      const coinsEarned = result.attempt?.coinsEarned || quiz.rewardCoins || 0;
      const newAvailableCoins = result.points?.availableCoins;
      const newTotalCoins = result.points?.totalCoins;

      if (newAvailableCoins !== undefined) {
        localStorage.setItem("aelaPoints", newAvailableCoins.toString());
        if (refreshPoints) {
          setTimeout(() => refreshPoints(), 300);
        }
      }

      // Set results
      setResults({
        score,
        correctAnswers,
        totalQuestions,
        coinsEarned,
        submittedAnswers,
        timeSpent,
      });

      // Dispatch event to refresh activities page
      console.log("Dispatching quizCompleted event...");
      window.dispatchEvent(new CustomEvent("quizCompleted", { 
        detail: { quizId: quizIdToSubmit } 
      }));

      toast.success(`Quiz completed! You earned ${coinsEarned} coins! 🎉`);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      toast.error(error?.message || "Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060D] flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <p className="text-white">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (hasAttempted) {
    return (
      <div className="min-h-screen bg-[#05060D] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <FaLock className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Already Attempted</h2>
          <p className="text-gray-400 mb-6">
            You have already completed this quiz. Each quiz can only be attempted once.
          </p>
          <button
            onClick={() => navigate("/learn-earn/activities")}
            className="bg-[#D4AF37] text-black py-3 px-6 rounded-lg font-bold hover:bg-[#E5C158] transition-colors">
            Back to Activities
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const allQuestionsAnswered = questions.every((_, index) => answers[index] !== undefined);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`${quiz.title} | Quiz | Digital AELA`}
        description={quiz.description || "Take this quiz to earn AELA coins"}
        keywords="quiz, learn and earn, aela coins"
        url={`https://digitalaela.com/learn-earn/quiz/${quizId}`}
      />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0E1C]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/learn-earn/activities")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors">
              <FaArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <FaClock className="w-4 h-4" />
                <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-white">{quiz.title}</h1>
              <span className="text-sm text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {results ? (
          // Results View
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6">
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E5C158] flex items-center justify-center">
                <span className="text-4xl font-bold text-black">
                  {results.score}%
                </span>
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
              <p className="text-gray-400 mb-6">
                You got {results.correctAnswers} out of {results.totalQuestions} questions correct
              </p>
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
                    <FaCoins className="w-6 h-6" />
                    {results.coinsEarned}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Coins Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.floor(results.timeSpent / 60)}:{(results.timeSpent % 60).toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Time Taken</div>
                </div>
              </div>
            </div>

            {/* Question Review */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Question Review</h3>
              {results.submittedAnswers.map((answer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-xl border ${
                    answer.isCorrect
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-400">
                      Question {index + 1}
                    </span>
                    {answer.isCorrect ? (
                      <FaCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <FaTimes className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <p className="text-white font-semibold mb-3">{answer.question}</p>
                  <div className="space-y-2">
                    <div
                      className={`p-3 rounded-lg ${
                        answer.userAnswer === answer.correctAnswer
                          ? "bg-green-500/20 border border-green-500/50"
                          : answer.userAnswer !== -1
                          ? "bg-red-500/20 border border-red-500/50"
                          : "bg-gray-800 border border-gray-700"
                      }`}>
                      <span className="text-xs text-gray-400">Your Answer: </span>
                      <span className="text-white">
                        {answer.userAnswer !== -1
                          ? answer.userAnswer + 1
                          : "Not answered"}
                      </span>
                    </div>
                    {!answer.isCorrect && (
                      <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50">
                        <span className="text-xs text-gray-400">Correct Answer: </span>
                        <span className="text-white">{answer.correctAnswer + 1}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  // Dispatch event before navigating to ensure it's caught
                  const quizId = submittedQuizId || (quiz?._id || quiz?.id || '').toString();
                  console.log("Navigating back with quiz ID:", quizId);
                  window.dispatchEvent(new CustomEvent("quizCompleted", { 
                    detail: { quizId } 
                  }));
                  // Small delay to ensure event is processed
                  setTimeout(() => {
                    navigate("/learn-earn/activities");
                  }, 100);
                }}
                className="w-full bg-[#D4AF37] text-black py-3 rounded-lg font-bold hover:bg-[#E5C158] transition-colors">
                Back to Activities
              </button>
            </div>
          </motion.div>
        ) : (
          // Quiz Questions View
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6">
              {currentQuestion && (
                <>
                  <div className="bg-[#0A0E1C] rounded-xl p-6 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6">
                      {currentQuestion.question}
                    </h2>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, optionIndex) => (
                        <button
                          key={optionIndex}
                          onClick={() => handleAnswerSelect(currentQuestionIndex, optionIndex)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            answers[currentQuestionIndex] === optionIndex
                              ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white"
                              : "bg-[#1a1a1a] border-white/10 text-gray-300 hover:border-[#D4AF37]/50"
                          }`}>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                answers[currentQuestionIndex] === optionIndex
                                  ? "border-[#D4AF37] bg-[#D4AF37]"
                                  : "border-gray-500"
                              }`}>
                              {answers[currentQuestionIndex] === optionIndex && (
                                <div className="w-2 h-2 rounded-full bg-black" />
                              )}
                            </div>
                            <span>{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="px-6 py-2 rounded-lg border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#D4AF37] transition-colors">
                      Previous
                    </button>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <button
                        onClick={handleNext}
                        className="px-6 py-2 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] transition-colors">
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !allQuestionsAnswered}
                        className="px-6 py-2 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSubmitting ? (
                          <>
                            <FaSpinner className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Quiz"
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default QuizPlay;

