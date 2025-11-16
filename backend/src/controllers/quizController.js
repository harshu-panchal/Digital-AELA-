import mongoose from "mongoose";
import QuizAttempt from "../models/QuizAttempt.js";
import Quiz from "../models/Quiz.js";
import StudentPoints from "../models/StudentPoints.js";

export const submitQuizAttempt = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const {
      quizId,
      quizName,
      category,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      answers,
      rewardCoins,
    } = req.body;

    if (!quizName) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Quiz name is required",
        },
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const studentObjectId = new mongoose.Types.ObjectId(userId);

    if (!studentObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Calculate coins to award based on score percentage
    // If user scores 80%, they get 80% of the total reward coins
    const baseRewardCoins = rewardCoins || 0;
    const scorePercentage = score || 0; // score is already a percentage (0-100)
    const coinsToAward = Math.round((scorePercentage / 100) * baseRewardCoins);

    // Create quiz attempt record
    const attemptData = {
      student: studentObjectId,
      quizName,
      category: category || "quiz",
      score: score || 0,
      totalQuestions: totalQuestions || 0,
      correctAnswers: correctAnswers || 0,
      timeSpent: timeSpent || 0,
      coinsEarned: coinsToAward,
      answers: answers || [],
    };

    // If quizId is a valid ObjectId and quiz exists in DB, link it
    if (quizId && mongoose.isValidObjectId(quizId)) {
      try {
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          attemptData.quiz = new mongoose.Types.ObjectId(quizId);
          // Also store as string for easier matching
          attemptData.quizId = quizId.toString();
        } else {
          // Quiz ID is valid ObjectId but doesn't exist - store as string ID
          attemptData.quizId = quizId.toString();
        }
      } catch (error) {
        // If quiz lookup fails, just store as string ID
        // eslint-disable-next-line no-console
        console.warn("Quiz lookup failed, storing as string ID:", error);
        attemptData.quizId = quizId.toString();
      }
    } else if (quizId) {
      // quizId is not a valid ObjectId (e.g., "quiz-grammar") - store as string
      attemptData.quizId = quizId.toString();
    }
    // If no quizId provided at all, quiz field will be undefined (optional)

    const attempt = await QuizAttempt.create(attemptData);

    // Update student points
    let studentPoints = await StudentPoints.findOne({ student: studentObjectId });
    if (!studentPoints) {
      studentPoints = await StudentPoints.create({
        student: studentObjectId,
        totalCoins: coinsToAward,
        pendingCoins: 0,
        redeemedCoins: 0,
        streak: 1,
        lastActivityDate: new Date(),
        transactions: [
          {
            type: "earned",
            amount: coinsToAward,
            reason: `Completed ${quizName}`,
            source: "quiz",
          },
        ],
      });
    } else {
      // Update existing points
      const newTotal = (studentPoints.totalCoins || 0) + coinsToAward;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastActivity = studentPoints.lastActivityDate
        ? new Date(studentPoints.lastActivityDate)
        : null;
      const lastActivityDate = lastActivity ? new Date(lastActivity.setHours(0, 0, 0, 0)) : null;

      // Update streak if activity is today or consecutive
      let newStreak = studentPoints.streak || 0;
      if (!lastActivityDate || lastActivityDate.getTime() === today.getTime()) {
        // Same day - no change
      } else if (
        lastActivityDate &&
        today.getTime() - lastActivityDate.getTime() === 24 * 60 * 60 * 1000
      ) {
        // Consecutive day
        newStreak = (studentPoints.streak || 0) + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      studentPoints.totalCoins = newTotal;
      studentPoints.streak = newStreak;
      studentPoints.lastActivityDate = new Date();

      // Add transaction
      studentPoints.transactions = studentPoints.transactions || [];
      studentPoints.transactions.push({
        type: "earned",
        amount: coinsToAward,
        reason: `Completed ${quizName}`,
        source: "quiz",
        createdAt: new Date(),
      });

      // Keep only last 100 transactions
      if (studentPoints.transactions.length > 100) {
        studentPoints.transactions = studentPoints.transactions.slice(-100);
      }

      await studentPoints.save();
    }

    return res.status(201).json({
      attempt: {
        id: attempt._id.toString(),
        quizName: attempt.quizName,
        score: attempt.score,
        coinsEarned: attempt.coinsEarned,
        completedAt: attempt.completedAt,
      },
      points: {
        totalCoins: studentPoints.totalCoins,
        availableCoins: studentPoints.totalCoins - (studentPoints.redeemedCoins || 0),
        streak: studentPoints.streak,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getStudentQuizHistory = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const { page = 1, pageSize = 20, category } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const studentObjectId = new mongoose.Types.ObjectId(userId);

    if (!studentObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const query = { student: studentObjectId };
    if (category) {
      query.category = category;
    }

    const [attempts, total] = await Promise.all([
      QuizAttempt.find(query)
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      QuizAttempt.countDocuments(query),
    ]);

    // Format attempts to ensure quiz ID is always available as string
    const formattedAttempts = attempts.map((attempt) => ({
      ...attempt,
      quiz: attempt.quiz ? attempt.quiz.toString() : null,
      quizId: attempt.quizId || (attempt.quiz ? attempt.quiz.toString() : null),
    }));

    return res.json({
      data: formattedAttempts,
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all published quizzes (public endpoint for students)
 */
export const getPublishedQuizzes = async (req, res, next) => {
  try {
    const { category, difficulty, page = 1, pageSize = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const query = { status: "published" };
    if (category) {
      query.category = category;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Exclude questions array from list view for better performance
    // Only include metadata needed for listing
    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .select("-questions") // Exclude questions array to reduce payload size
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Quiz.countDocuments(query),
    ]);

    const formattedQuizzes = quizzes.map((quiz) => ({
      id: quiz._id.toString(),
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      rewardCoins: quiz.rewardCoins || 0,
      duration: quiz.duration || 0,
      totalQuestions: quiz.questions?.length || 0,
      createdAt: quiz.createdAt,
    }));

    return res.json({
      quizzes: formattedQuizzes,
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a single quiz by ID (public endpoint, but only published quizzes)
 */
export const getQuizById = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    if (!mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid quiz ID",
        },
      });
    }

    const quiz = await Quiz.findOne({
      _id: quizId,
      status: "published",
    }).lean();

    if (!quiz) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Quiz not found or not published",
        },
      });
    }

    // Return quiz with correct answers for authenticated users (needed to calculate score)
    // For public access, we could hide answers, but for authenticated students taking the quiz,
    // we need them to calculate results. Answers will be shown in results anyway.
    const formattedQuiz = {
      _id: quiz._id.toString(),
      id: quiz._id.toString(),
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      rewardCoins: quiz.rewardCoins || 0,
      duration: quiz.duration || 0,
      questions: quiz.questions?.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer, // Include for score calculation
        explanation: q.explanation || "",
      })) || [],
      createdAt: quiz.createdAt,
    };

    return res.json({ quiz: formattedQuiz });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new quiz (admin/teacher only)
 */
export const createQuiz = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Only admin and teacher can create quizzes
    if (!["admin", "teacher"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins and teachers can create quizzes",
        },
      });
    }

    const {
      title,
      description,
      category,
      difficulty = "intermediate",
      rewardCoins = 0,
      duration = 0,
      questions = [],
      status = "published",
    } = req.body;

    if (!title || !category) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title and category are required",
        },
      });
    }

    if (!["quiz", "vocabulary", "speaking"].includes(category)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Category must be one of: quiz, vocabulary, speaking",
        },
      });
    }

    // Validate questions
    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Each question must have a question text and at least 2 options",
            },
          });
        }
        if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Each question must have a valid correctAnswer index",
            },
          });
        }
      }
    }

    // Store teacher's ID in metadata.createdBy to track quiz ownership
    // This ensures each teacher only sees their own quizzes in the dashboard
    const quiz = await Quiz.create({
      title,
      description,
      category,
      difficulty,
      rewardCoins,
      duration,
      questions,
      status,
      metadata: {
        createdBy: userId, // Store as string for consistent querying
      },
    });
    
    // Debug: Log quiz creation for verification
    // eslint-disable-next-line no-console
    console.log(`[Quiz] Created quiz "${title}" by teacher ${userId} (${userRole})`);

    return res.status(201).json({ quiz });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a quiz (admin/teacher only - only if they created it)
 */
export const deleteQuiz = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Only admin and teacher can delete quizzes
    if (!["admin", "teacher"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins and teachers can delete quizzes",
        },
      });
    }

    const { quizId } = req.params;

    if (!mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid quiz ID",
        },
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Quiz not found",
        },
      });
    }

    // Check if user is admin or the creator of the quiz
    const isAdmin = userRole === "admin";
    const isCreator = quiz.metadata?.createdBy?.toString() === userId.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only delete quizzes you created",
        },
      });
    }

    // Delete the quiz
    await quiz.deleteOne();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

