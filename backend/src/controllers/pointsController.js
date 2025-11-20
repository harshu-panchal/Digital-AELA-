import StudentPoints from "../models/StudentPoints.js";
import mongoose from "mongoose";

/**
 * Get student points
 * GET /api/v1/students/points
 */
export const getStudentPoints = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const studentObjectId = new mongoose.Types.ObjectId(userId);

    let studentPoints = await StudentPoints.findOne({ student: studentObjectId });

    if (!studentPoints) {
      // Create default points record
      studentPoints = await StudentPoints.create({
        student: studentObjectId,
        totalCoins: 0,
        redeemedCoins: 0,
        pendingCoins: 0,
        streak: 0,
        transactions: [],
      });
    }

    // Calculate available coins
    const availableCoins = (studentPoints.totalCoins || 0) - (studentPoints.redeemedCoins || 0);

    // Calculate total earned from transactions
    const totalEarned = (studentPoints.transactions || [])
      .filter((txn) => txn.type === "earned" || txn.type === "bonus")
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    // Calculate total redeemed
    const totalRedeemed = (studentPoints.transactions || [])
      .filter((txn) => txn.type === "redeemed")
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    return res.status(200).json({
      points: {
        totalCoins: studentPoints.totalCoins || 0,
        redeemedCoins: studentPoints.redeemedCoins || 0,
        pendingCoins: studentPoints.pendingCoins || 0,
        availableCoins,
        totalEarned,
        totalRedeemed,
        streak: studentPoints.streak || 0,
        leaderboardPosition: studentPoints.leaderboardPosition || 0,
        badges: studentPoints.badges || [],
        lastActivityDate: studentPoints.lastActivityDate,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update student points (admin/system use)
 * PATCH /api/v1/students/points
 */
export const updateStudentPoints = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { amount, type, reason, source } = req.body;

    if (amount === undefined || !type) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Amount and type are required",
        },
      });
    }

    if (!["earned", "redeemed", "bonus", "penalty", "sent", "received"].includes(type)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid transaction type",
        },
      });
    }

    const studentObjectId = new mongoose.Types.ObjectId(userId);

    let studentPoints = await StudentPoints.findOne({ student: studentObjectId });

    if (!studentPoints) {
      studentPoints = await StudentPoints.create({
        student: studentObjectId,
        totalCoins: 0,
        redeemedCoins: 0,
        pendingCoins: 0,
        streak: 0,
        transactions: [],
      });
    }

    // Add transaction
    const transaction = {
      type,
      amount: Math.abs(amount),
      reason: reason || "Points updated",
      source: source || "manual",
      createdAt: new Date(),
    };

    studentPoints.transactions = studentPoints.transactions || [];
    studentPoints.transactions.push(transaction);

    // Update points based on type
    if (type === "earned" || type === "bonus" || type === "received") {
      studentPoints.totalCoins = (studentPoints.totalCoins || 0) + Math.abs(amount);
    } else if (type === "redeemed" || type === "sent") {
      const availableCoins = (studentPoints.totalCoins || 0) - (studentPoints.redeemedCoins || 0);
      if (type === "redeemed") {
        if (availableCoins < Math.abs(amount)) {
          return res.status(400).json({
            error: {
              code: "INSUFFICIENT_POINTS",
              message: "Insufficient points available",
            },
          });
        }
        studentPoints.redeemedCoins = (studentPoints.redeemedCoins || 0) + Math.abs(amount);
      } else {
        // sent
        if (availableCoins < Math.abs(amount)) {
          return res.status(400).json({
            error: {
              code: "INSUFFICIENT_POINTS",
              message: "Insufficient points available",
            },
          });
        }
        studentPoints.totalCoins = (studentPoints.totalCoins || 0) - Math.abs(amount);
      }
    } else if (type === "penalty") {
      const availableCoins = (studentPoints.totalCoins || 0) - (studentPoints.redeemedCoins || 0);
      const deduction = Math.min(Math.abs(amount), availableCoins);
      studentPoints.totalCoins = (studentPoints.totalCoins || 0) - deduction;
    }

    // Keep only last 500 transactions
    if (studentPoints.transactions.length > 500) {
      studentPoints.transactions = studentPoints.transactions.slice(-500);
    }

    await studentPoints.save();

    // Calculate updated values
    const availableCoins = (studentPoints.totalCoins || 0) - (studentPoints.redeemedCoins || 0);

    return res.status(200).json({
      message: "Points updated successfully",
      points: {
        totalCoins: studentPoints.totalCoins,
        redeemedCoins: studentPoints.redeemedCoins,
        availableCoins,
        transaction,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get points transaction history
 * GET /api/v1/students/points/history
 */
export const getPointsHistory = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const studentObjectId = new mongoose.Types.ObjectId(userId);

    const { page = 1, pageSize = 50, type, source } = req.query;

    let studentPoints = await StudentPoints.findOne({ student: studentObjectId });

    if (!studentPoints) {
      return res.status(200).json({
        transactions: [],
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: 0,
          totalPages: 0,
        },
      });
    }

    let transactions = [...(studentPoints.transactions || [])];

    // Filter by type if provided
    if (type) {
      transactions = transactions.filter((txn) => txn.type === type);
    }

    // Filter by source if provided
    if (source) {
      transactions = transactions.filter((txn) => txn.source === source);
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    // Pagination
    const total = transactions.length;
    const totalPages = Math.ceil(total / parseInt(pageSize));
    const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    return res.status(200).json({
      transactions: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get points statistics/summary
 * GET /api/v1/students/points/stats
 */
export const getPointsStats = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
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

    let studentPoints = await StudentPoints.findOne({ student: studentObjectId });

    if (!studentPoints) {
      return res.status(200).json({
        stats: {
          totalEarned: 0,
          totalRedeemed: 0,
          availableCoins: 0,
          transactionsByType: {},
          transactionsBySource: {},
          recentActivity: [],
        },
      });
    }

    const transactions = studentPoints.transactions || [];

    // Calculate totals by type
    const transactionsByType = transactions.reduce((acc, txn) => {
      acc[txn.type] = (acc[txn.type] || 0) + (txn.amount || 0);
      return acc;
    }, {});

    // Calculate totals by source
    const transactionsBySource = transactions.reduce((acc, txn) => {
      const source = txn.source || "unknown";
      acc[source] = (acc[source] || 0) + (txn.amount || 0);
      return acc;
    }, {});

    // Get recent activity (last 10 transactions)
    const recentActivity = transactions
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 10);

    const totalEarned = transactions
      .filter((txn) => txn.type === "earned" || txn.type === "bonus")
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    const totalRedeemed = transactions
      .filter((txn) => txn.type === "redeemed")
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    const availableCoins = (studentPoints.totalCoins || 0) - (studentPoints.redeemedCoins || 0);

    return res.status(200).json({
      stats: {
        totalEarned,
        totalRedeemed,
        availableCoins,
        totalCoins: studentPoints.totalCoins || 0,
        redeemedCoins: studentPoints.redeemedCoins || 0,
        pendingCoins: studentPoints.pendingCoins || 0,
        streak: studentPoints.streak || 0,
        leaderboardPosition: studentPoints.leaderboardPosition || 0,
        badges: studentPoints.badges || [],
        transactionsByType,
        transactionsBySource,
        recentActivity,
        totalTransactions: transactions.length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

