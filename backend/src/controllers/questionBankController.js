import mongoose from "mongoose";
import QuestionBank from "../models/QuestionBank.js";
import Quiz from "../models/Quiz.js";

/**
 * Create a question in the question bank
 * POST /api/v1/question-bank
 */
export const createQuestion = async (req, res, next) => {
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

    if (!["admin", "teacher"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins and teachers can create questions",
        },
      });
    }

    const {
      question,
      options,
      correctAnswer,
      explanation = "",
      category = "quiz",
      difficulty = "intermediate",
      tags = [],
      isPublic = false,
    } = req.body;

    if (!question || !options || correctAnswer === undefined) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Question, options, and correctAnswer are required",
        },
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "At least 2 options are required",
        },
      });
    }

    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Correct answer index is invalid",
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

    const createdBy = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!createdBy) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const questionBank = await QuestionBank.create({
      question,
      options,
      correctAnswer,
      explanation,
      category,
      difficulty,
      tags: Array.isArray(tags) ? tags : [],
      isPublic,
      createdBy,
    });

    return res.status(201).json({ question: questionBank });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get questions from the question bank
 * GET /api/v1/question-bank
 */
export const getQuestions = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth;
    const { category, difficulty, tags, isPublic, search, page = 1, pageSize = 20 } = req.query;

    const query = {};

    // If not admin/teacher, only show public questions or own questions
    if (!["admin", "teacher"].includes(userRole)) {
      if (userId && mongoose.isValidObjectId(userId)) {
        query.$or = [
          { isPublic: true },
          { createdBy: new mongoose.Types.ObjectId(userId) },
        ];
      } else {
        query.isPublic = true;
      }
    } else if (userId && mongoose.isValidObjectId(userId)) {
      // Admin/teacher can see all questions, but filter by creator if specified
      if (req.query.createdBy) {
        query.createdBy = new mongoose.Types.ObjectId(req.query.createdBy);
      }
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      query.tags = { $in: tagArray };
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === "true";
    }

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { explanation: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const [questions, total] = await Promise.all([
      QuestionBank.find(query)
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QuestionBank.countDocuments(query),
    ]);

    return res.json({
      questions,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a single question by ID
 * GET /api/v1/question-bank/:questionId
 */
export const getQuestionById = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth;
    const { questionId } = req.params;

    if (!mongoose.isValidObjectId(questionId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid question ID",
        },
      });
    }

    const question = await QuestionBank.findById(questionId)
      .populate("createdBy", "fullName email")
      .lean();

    if (!question) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Question not found",
        },
      });
    }

    // Check access permissions
    if (!["admin", "teacher"].includes(userRole)) {
      if (!question.isPublic && question.createdBy._id.toString() !== userId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to view this question",
          },
        });
      }
    }

    return res.json({ question });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update a question in the question bank
 * PATCH /api/v1/question-bank/:questionId
 */
export const updateQuestion = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth;
    const { questionId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(questionId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid question ID",
        },
      });
    }

    const question = await QuestionBank.findById(questionId);

    if (!question) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Question not found",
        },
      });
    }

    // Check permissions (admin or creator)
    const isAdmin = userRole === "admin";
    const isCreator = question.createdBy.toString() === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You don't have permission to update this question",
        },
      });
    }

    const {
      question: questionText,
      options,
      correctAnswer,
      explanation,
      category,
      difficulty,
      tags,
      isPublic,
    } = req.body;

    if (questionText !== undefined) question.question = questionText;
    if (options !== undefined) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "At least 2 options are required",
          },
        });
      }
      question.options = options;
    }
    if (correctAnswer !== undefined) {
      if (correctAnswer < 0 || correctAnswer >= (question.options || options || []).length) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Correct answer index is invalid",
          },
        });
      }
      question.correctAnswer = correctAnswer;
    }
    if (explanation !== undefined) question.explanation = explanation;
    if (category !== undefined) {
      if (!["quiz", "vocabulary", "speaking"].includes(category)) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Category must be one of: quiz, vocabulary, speaking",
          },
        });
      }
      question.category = category;
    }
    if (difficulty !== undefined) question.difficulty = difficulty;
    if (tags !== undefined) question.tags = Array.isArray(tags) ? tags : [];
    if (isPublic !== undefined && (isAdmin || isCreator)) {
      question.isPublic = isPublic;
    }

    await question.save();

    return res.json({ question });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a question from the question bank
 * DELETE /api/v1/question-bank/:questionId
 */
export const deleteQuestion = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth;
    const { questionId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(questionId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid question ID",
        },
      });
    }

    const question = await QuestionBank.findById(questionId);

    if (!question) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Question not found",
        },
      });
    }

    // Check permissions (admin or creator)
    const isAdmin = userRole === "admin";
    const isCreator = question.createdBy.toString() === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You don't have permission to delete this question",
        },
      });
    }

    // Check if question is used in any quizzes
    const quizzesUsingQuestion = await Quiz.find({
      "settings.useQuestionBank": true,
      "settings.questionBankIds": questionId,
    });

    if (quizzesUsingQuestion.length > 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Cannot delete question. It is used in ${quizzesUsingQuestion.length} quiz(es).`,
        },
      });
    }

    await QuestionBank.findByIdAndDelete(questionId);

    return res.json({
      message: "Question deleted successfully",
      questionId,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get question bank statistics
 * GET /api/v1/question-bank/stats
 */
export const getQuestionBankStats = async (req, res, next) => {
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

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const query = ["admin", "teacher"].includes(userRole)
      ? {}
      : { $or: [{ isPublic: true }, { createdBy: userObjectId }] };

    const [total, byCategory, byDifficulty, myQuestions] = await Promise.all([
      QuestionBank.countDocuments(query),
      QuestionBank.aggregate([
        { $match: query },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      QuestionBank.aggregate([
        { $match: query },
        { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      ]),
      QuestionBank.countDocuments({ createdBy: userObjectId }),
    ]);

    return res.json({
      total,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byDifficulty: byDifficulty.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      myQuestions,
    });
  } catch (error) {
    return next(error);
  }
};

