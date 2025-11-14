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

    // Calculate coins to award (use provided rewardCoins or default)
    const coinsToAward = rewardCoins || 0;

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
        } else {
          // Quiz ID is valid ObjectId but doesn't exist - store as string ID
          attemptData.quizId = quizId;
        }
      } catch (error) {
        // If quiz lookup fails, just store as string ID
        // eslint-disable-next-line no-console
        console.warn("Quiz lookup failed, storing as string ID:", error);
        attemptData.quizId = quizId;
      }
    } else if (quizId) {
      // quizId is not a valid ObjectId (e.g., "quiz-grammar") - store as string
      attemptData.quizId = quizId;
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
        .limit(Number(pageSize)),
      QuizAttempt.countDocuments(query),
    ]);

    return res.json({
      data: attempts,
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

