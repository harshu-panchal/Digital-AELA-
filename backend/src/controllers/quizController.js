import mongoose from "mongoose";
import QuizAttempt from "../models/QuizAttempt.js";
import Quiz from "../models/Quiz.js";
import QuestionBank from "../models/QuestionBank.js";
import StudentPoints from "../models/StudentPoints.js";
import { emitQuizAttempt } from "../utils/socketEmitter.js";

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

    // Emit real-time event
    await emitQuizAttempt(attempt);

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
      settings = {},
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

    // Handle question bank or direct questions
    let finalQuestions = [];
    let questionBankIds = [];

    if (settings?.useQuestionBank && settings?.questionBankIds?.length > 0) {
      // Use question bank
      questionBankIds = settings.questionBankIds
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (questionBankIds.length === 0) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid question bank IDs are required when using question bank",
          },
        });
      }

      // Fetch questions from bank
      const bankQuestions = await QuestionBank.find({
        _id: { $in: questionBankIds },
        $or: [
          { isPublic: true },
          { createdBy: mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null },
        ],
      }).lean();

      if (bankQuestions.length === 0) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "No valid questions found in question bank",
          },
        });
      }

      // Randomize if requested
      const questionsToUse = settings.randomizeQuestions
        ? bankQuestions.sort(() => Math.random() - 0.5)
        : bankQuestions;

      // Limit number of questions if specified
      const numQuestions = settings.questionsPerQuiz > 0
        ? Math.min(settings.questionsPerQuiz, questionsToUse.length)
        : questionsToUse.length;

      finalQuestions = questionsToUse.slice(0, numQuestions).map((q) => ({
        question: q.question,
        options: settings.randomizeOptions ? q.options.sort(() => Math.random() - 0.5) : q.options,
        correctAnswer: settings.randomizeOptions
          ? q.options.indexOf(q.options[q.correctAnswer])
          : q.correctAnswer,
        explanation: q.explanation || "",
      }));

      // Update usage count for questions
      await QuestionBank.updateMany(
        { _id: { $in: questionBankIds } },
        { $inc: { usageCount: 1 } }
      );
    } else {
      // Use direct questions
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
        finalQuestions = questions;
      }
    }

    // Validate and set default settings
    const quizSettings = {
      timeLimit: settings.timeLimit || 0,
      timeLimitPerQuestion: settings.timeLimitPerQuestion || 0,
      allowPause: settings.allowPause !== undefined ? settings.allowPause : true,
      randomizeQuestions: settings.randomizeQuestions || false,
      randomizeOptions: settings.randomizeOptions || false,
      showQuestionNumbers: settings.showQuestionNumbers !== undefined ? settings.showQuestionNumbers : true,
      allowSkip: settings.allowSkip !== undefined ? settings.allowSkip : true,
      allowReview: settings.allowReview !== undefined ? settings.allowReview : true,
      showResultsImmediately: settings.showResultsImmediately !== undefined ? settings.showResultsImmediately : true,
      showCorrectAnswers: settings.showCorrectAnswers !== undefined ? settings.showCorrectAnswers : true,
      showExplanations: settings.showExplanations !== undefined ? settings.showExplanations : true,
      showScore: settings.showScore !== undefined ? settings.showScore : true,
      passingScore: settings.passingScore !== undefined ? Math.max(0, Math.min(100, settings.passingScore)) : 60,
      requirePassingScore: settings.requirePassingScore || false,
      maxAttempts: settings.maxAttempts !== undefined ? Math.max(0, settings.maxAttempts) : 0,
      allowMultipleAttempts: settings.allowMultipleAttempts !== undefined ? settings.allowMultipleAttempts : true,
      useQuestionBank: settings.useQuestionBank || false,
      questionBankIds: questionBankIds,
      questionsPerQuiz: settings.questionsPerQuiz || 0,
    };

    // Store teacher's ID in metadata.createdBy to track quiz ownership
    // This ensures each teacher only sees their own quizzes in the dashboard
    const quiz = await Quiz.create({
      title,
      description,
      category,
      difficulty,
      rewardCoins,
      duration,
      questions: finalQuestions,
      status,
      settings: quizSettings,
      metadata: {
        createdBy: userId, // Store as string for consistent querying
      },
    });

    // Create notifications for all students when quiz is published
    if (status === "published") {
      try {
        const User = (await import("../models/User.js")).default;
        const { createBulkNotifications } = await import("../utils/notificationHelper.js");
        
        // Get all active students
        const students = await User.find({ role: "student", isActive: true })
          .select("_id")
          .lean();
        
        if (students.length > 0) {
          const studentIds = students.map((s) => s._id);
          const quizTitle = title;
          const rewardText = rewardCoins > 0 ? ` Earn up to ${rewardCoins} coins!` : "";
          
          await createBulkNotifications(
            studentIds,
            "New Quiz Available",
            `A new quiz "${quizTitle}" is now available.${rewardText}`,
            "quiz",
            {
              quizId: quiz._id.toString(),
              quizTitle: quizTitle,
              rewardCoins: rewardCoins,
            },
            `/learn-earn/activities`
          );
        }
      } catch (notifError) {
        // eslint-disable-next-line no-console
        console.error("[Quiz] Error creating notifications:", notifError);
        // Don't fail quiz creation if notification fails
      }
    }
    
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

/**
 * Update a quiz (admin/teacher only - only if they created it)
 */
export const updateQuiz = async (req, res, next) => {
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

    // Only admin and teacher can update quizzes
    if (!["admin", "teacher"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins and teachers can update quizzes",
        },
      });
    }

    const { quizId } = req.params;
    const {
      title,
      description,
      category,
      difficulty,
      rewardCoins,
      duration,
      questions,
      status,
      settings,
    } = req.body;

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
          message: "You can only update quizzes you created",
        },
      });
    }

    // Validate category if provided
    if (category && !["quiz", "vocabulary", "speaking"].includes(category)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Category must be one of: quiz, vocabulary, speaking",
        },
      });
    }

    // Handle question bank or direct questions if settings are provided
    let finalQuestions = quiz.questions; // Keep existing questions by default
    let questionBankIds = quiz.settings?.questionBankIds || [];

    if (settings?.useQuestionBank && settings?.questionBankIds?.length > 0) {
      // Use question bank
      questionBankIds = settings.questionBankIds
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (questionBankIds.length > 0) {
        // Fetch questions from bank
        const bankQuestions = await QuestionBank.find({
          _id: { $in: questionBankIds },
          $or: [
            { isPublic: true },
            { createdBy: mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null },
          ],
        }).lean();

        if (bankQuestions.length > 0) {
          // Randomize if requested
          const questionsToUse = settings.randomizeQuestions
            ? bankQuestions.sort(() => Math.random() - 0.5)
            : bankQuestions;

          // Limit number of questions if specified
          const numQuestions = settings.questionsPerQuiz > 0
            ? Math.min(settings.questionsPerQuiz, questionsToUse.length)
            : questionsToUse.length;

          finalQuestions = questionsToUse.slice(0, numQuestions).map((q) => ({
            question: q.question,
            options: settings.randomizeOptions ? q.options.sort(() => Math.random() - 0.5) : q.options,
            correctAnswer: settings.randomizeOptions
              ? q.options.indexOf(q.options[q.correctAnswer])
              : q.correctAnswer,
            explanation: q.explanation || "",
          }));

          // Update usage count for questions
          await QuestionBank.updateMany(
            { _id: { $in: questionBankIds } },
            { $inc: { usageCount: 1 } }
          );
        }
      }
    } else if (Array.isArray(questions) && questions.length > 0) {
      // Use direct questions
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
      finalQuestions = questions;
    }

    // Update quiz fields
    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (category !== undefined) quiz.category = category;
    if (difficulty !== undefined) quiz.difficulty = difficulty;
    if (rewardCoins !== undefined) quiz.rewardCoins = rewardCoins;
    if (duration !== undefined) quiz.duration = duration;
    if (finalQuestions !== undefined) quiz.questions = finalQuestions;
    if (status !== undefined) quiz.status = status;

    // Update settings if provided
    if (settings !== undefined) {
      if (!quiz.settings) quiz.settings = {};
      
      if (settings.timeLimit !== undefined) quiz.settings.timeLimit = settings.timeLimit;
      if (settings.timeLimitPerQuestion !== undefined) quiz.settings.timeLimitPerQuestion = settings.timeLimitPerQuestion;
      if (settings.allowPause !== undefined) quiz.settings.allowPause = settings.allowPause;
      if (settings.randomizeQuestions !== undefined) quiz.settings.randomizeQuestions = settings.randomizeQuestions;
      if (settings.randomizeOptions !== undefined) quiz.settings.randomizeOptions = settings.randomizeOptions;
      if (settings.showQuestionNumbers !== undefined) quiz.settings.showQuestionNumbers = settings.showQuestionNumbers;
      if (settings.allowSkip !== undefined) quiz.settings.allowSkip = settings.allowSkip;
      if (settings.allowReview !== undefined) quiz.settings.allowReview = settings.allowReview;
      if (settings.showResultsImmediately !== undefined) quiz.settings.showResultsImmediately = settings.showResultsImmediately;
      if (settings.showCorrectAnswers !== undefined) quiz.settings.showCorrectAnswers = settings.showCorrectAnswers;
      if (settings.showExplanations !== undefined) quiz.settings.showExplanations = settings.showExplanations;
      if (settings.showScore !== undefined) quiz.settings.showScore = settings.showScore;
      if (settings.passingScore !== undefined) quiz.settings.passingScore = Math.max(0, Math.min(100, settings.passingScore));
      if (settings.requirePassingScore !== undefined) quiz.settings.requirePassingScore = settings.requirePassingScore;
      if (settings.maxAttempts !== undefined) quiz.settings.maxAttempts = Math.max(0, settings.maxAttempts);
      if (settings.allowMultipleAttempts !== undefined) quiz.settings.allowMultipleAttempts = settings.allowMultipleAttempts;
      if (settings.useQuestionBank !== undefined) quiz.settings.useQuestionBank = settings.useQuestionBank;
      if (questionBankIds.length > 0 || settings.questionBankIds !== undefined) {
        quiz.settings.questionBankIds = questionBankIds.length > 0 ? questionBankIds : (settings.questionBankIds || []);
      }
      if (settings.questionsPerQuiz !== undefined) quiz.settings.questionsPerQuiz = settings.questionsPerQuiz;
    }

    await quiz.save();

    return res.json({ quiz });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get quiz analytics (admin/teacher only - only for their quizzes)
 */
export const getQuizAnalytics = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth;
    const { quizId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!["admin", "teacher"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins and teachers can view quiz analytics",
        },
      });
    }

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
          message: "You can only view analytics for quizzes you created",
        },
      });
    }

    // Get all attempts for this quiz
    const attempts = await QuizAttempt.find({ quiz: quizId }).populate("student", "fullName email");

    const totalAttempts = attempts.length;
    const uniqueStudents = new Set(attempts.map((a) => a.student._id.toString())).size;

    // Calculate average score
    const avgScore =
      attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
        : 0;

    // Calculate average time spent
    const avgTimeSpent =
      attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attempts.length
        : 0;

    // Score distribution
    const scoreRanges = {
      excellent: attempts.filter((a) => (a.score || 0) >= 90).length,
      good: attempts.filter((a) => (a.score || 0) >= 70 && (a.score || 0) < 90).length,
      average: attempts.filter((a) => (a.score || 0) >= 50 && (a.score || 0) < 70).length,
      poor: attempts.filter((a) => (a.score || 0) < 50).length,
    };

    // Question-level analytics
    const questionStats = quiz.questions?.map((question, index) => {
      const questionAttempts = attempts.filter((a) => {
        const answer = a.answers?.find((ans) => ans.questionIndex === index);
        return answer !== undefined;
      });

      const correctCount = questionAttempts.filter((a) => {
        const answer = a.answers?.find((ans) => ans.questionIndex === index);
        return answer?.isCorrect === true;
      }).length;

      const accuracy = questionAttempts.length > 0 ? (correctCount / questionAttempts.length) * 100 : 0;

      return {
        questionIndex: index,
        question: question.question,
        totalAttempts: questionAttempts.length,
        correctCount,
        accuracy: Math.round(accuracy * 100) / 100,
      };
    }) || [];

    // Recent attempts (last 10)
    const recentAttempts = attempts
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10)
      .map((a) => ({
        studentName: a.student?.fullName || "Unknown",
        studentEmail: a.student?.email || "",
        score: a.score || 0,
        completedAt: a.completedAt,
      }));

    return res.json({
      quiz: {
        id: quiz._id.toString(),
        title: quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        totalQuestions: quiz.questions?.length || 0,
      },
      analytics: {
        totalAttempts,
        uniqueStudents,
        averageScore: Math.round(avgScore * 100) / 100,
        averageTimeSpent: Math.round(avgTimeSpent),
        scoreDistribution: scoreRanges,
        questionStats,
        recentAttempts,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get quiz leaderboard
 */
export const getQuizLeaderboard = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

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

    // Get all attempts for this quiz, sorted by score (desc) and time (asc)
    const attempts = await QuizAttempt.find({ quiz: quizId })
      .populate("student", "fullName email")
      .sort({ score: -1, timeSpent: 1, completedAt: -1 })
      .lean();

    // Group by student and get their best attempt
    const studentBestAttempts = new Map();

    attempts.forEach((attempt) => {
      const studentId = attempt.student._id.toString();
      const existing = studentBestAttempts.get(studentId);

      if (!existing || attempt.score > existing.score || (attempt.score === existing.score && attempt.timeSpent < existing.timeSpent)) {
        studentBestAttempts.set(studentId, attempt);
      }
    });

    // Convert to array and sort
    const leaderboard = Array.from(studentBestAttempts.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.timeSpent !== b.timeSpent) return a.timeSpent - b.timeSpent;
        return new Date(b.completedAt) - new Date(a.completedAt);
      })
      .map((attempt, index) => ({
        rank: index + 1,
        studentId: attempt.student._id.toString(),
        studentName: attempt.student?.fullName || "Unknown",
        studentEmail: attempt.student?.email || "",
        score: attempt.score || 0,
        timeSpent: attempt.timeSpent || 0,
        completedAt: attempt.completedAt,
        coinsEarned: attempt.coinsEarned || 0,
      }));

    // Paginate
    const paginatedLeaderboard = leaderboard.slice(skip, skip + Number(pageSize));

    return res.json({
      quiz: {
        id: quiz._id.toString(),
        title: quiz.title,
      },
      leaderboard: paginatedLeaderboard,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: leaderboard.length,
        totalPages: Math.ceil(leaderboard.length / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

