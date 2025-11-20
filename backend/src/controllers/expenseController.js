import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Payment from "../models/Payment.js";
import PayoutRequest from "../models/PayoutRequest.js";
import User from "../models/User.js";

/**
 * Create Expense
 * POST /api/v1/expenses
 */
export const createExpense = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const expenseData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can create expenses",
        },
      });
    }

    if (!expenseData.title || !expenseData.amount || expenseData.amount <= 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title and valid amount are required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const expense = await Expense.create({
      ...expenseData,
      createdBy: userObjectId,
      status: expenseData.status || "pending",
      date: expenseData.date ? new Date(expenseData.date) : new Date(),
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("createdBy", "fullName email")
      .populate("approvedBy", "fullName")
      .lean();

    return res.status(201).json({
      expense: populatedExpense,
      message: "Expense created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get All Expenses
 * GET /api/v1/expenses
 */
export const getAllExpenses = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const {
      page = 1,
      pageSize = 20,
      category,
      status,
      month,
      year,
      startDate,
      endDate,
      search,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view expenses",
        },
      });
    }

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { vendor: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate("createdBy", "fullName email")
        .populate("approvedBy", "fullName")
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Expense.countDocuments(query),
    ]);

    return res.json({
      expenses,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Expense Details
 * GET /api/v1/expenses/:expenseId
 */
export const getExpenseDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { expenseId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view expenses",
        },
      });
    }

    if (!mongoose.isValidObjectId(expenseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid expense ID",
        },
      });
    }

    const expense = await Expense.findById(expenseId)
      .populate("createdBy", "fullName email")
      .populate("approvedBy", "fullName")
      .lean();

    if (!expense) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Expense not found",
        },
      });
    }

    return res.json({
      expense,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update Expense
 * PUT /api/v1/expenses/:expenseId
 */
export const updateExpense = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { expenseId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can update expenses",
        },
      });
    }

    if (!mongoose.isValidObjectId(expenseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid expense ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // If status is being updated to approved, set approvedBy and approvedAt
    if (updateData.status === "approved" && !updateData.approvedAt) {
      updateData.approvedBy = userObjectId;
      updateData.approvedAt = new Date();
    }

    // If status is being updated to paid, set paidAt
    if (updateData.status === "paid" && !updateData.paidAt) {
      updateData.paidAt = new Date();
    }

    // Update date if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const expense = await Expense.findByIdAndUpdate(expenseId, updateData, { new: true })
      .populate("createdBy", "fullName email")
      .populate("approvedBy", "fullName")
      .lean();

    if (!expense) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Expense not found",
        },
      });
    }

    return res.json({
      expense,
      message: "Expense updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete Expense
 * DELETE /api/v1/expenses/:expenseId
 */
export const deleteExpense = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { expenseId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can delete expenses",
        },
      });
    }

    if (!mongoose.isValidObjectId(expenseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid expense ID",
        },
      });
    }

    const expense = await Expense.findByIdAndDelete(expenseId).lean();

    if (!expense) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Expense not found",
        },
      });
    }

    return res.json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Financial Dashboard
 * GET /api/v1/expenses/dashboard
 */
export const getFinancialDashboard = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { month, year, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view financial dashboard",
        },
      });
    }

    // Build date query
    const dateQuery = {};
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      dateQuery.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) dateQuery.date.$lte = new Date(endDate);
    }

    // Get all expenses
    const expenses = await Expense.find(dateQuery).lean();

    // Calculate expenses by category
    const expensesByCategory = {};
    let totalExpenses = 0;
    expenses.forEach((expense) => {
      if (expense.status === "paid" || expense.status === "approved") {
        totalExpenses += expense.amount || 0;
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = {
            category: expense.category,
            total: 0,
            count: 0,
          };
        }
        expensesByCategory[expense.category].total += expense.amount || 0;
        expensesByCategory[expense.category].count += 1;
      }
    });

    // Get income from payments
    const paymentQuery = { status: "completed" };
    if (dateQuery.date) {
      paymentQuery.createdAt = dateQuery.date;
    }
    const payments = await Payment.find(paymentQuery).lean();
    const totalIncome = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Get refunds (as expenses)
    const refunds = expenses.filter((e) => e.category === "refunds");
    const totalRefunds = refunds.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Get teacher payouts (from payout requests)
    const payoutQuery = { status: "completed" };
    if (dateQuery.date) {
      payoutQuery.completedAt = dateQuery.date;
    }
    const payouts = await PayoutRequest.find(payoutQuery).lean();
    const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate net profit
    const netProfit = totalIncome - totalExpenses;

    // Get expenses by month (last 12 months)
    const monthlyExpenses = [];
    const monthlyIncome = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const monthExpenses = await Expense.find({
        date: { $gte: monthStart, $lte: monthEnd },
        status: { $in: ["paid", "approved"] },
      }).lean();
      const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      const monthPayments = await Payment.find({
        createdAt: { $gte: monthStart, $lte: monthEnd },
        status: "completed",
      }).lean();
      const monthIncomeTotal = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      monthlyExpenses.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        amount: monthExpenseTotal,
      });
      monthlyIncome.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        amount: monthIncomeTotal,
      });
    }

    // Get pending expenses
    const pendingExpenses = await Expense.find({ status: "pending" }).lean();
    const totalPendingExpenses = pendingExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return res.json({
      summary: {
        totalIncome,
        totalExpenses,
        totalRefunds,
        totalPayouts,
        netProfit,
        totalPendingExpenses,
        currency: "AED",
      },
      expensesByCategory: Object.values(expensesByCategory),
      monthlyExpenses,
      monthlyIncome,
      pendingExpenses: pendingExpenses.slice(0, 10), // Last 10 pending
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Expenses by Category
 * GET /api/v1/expenses/by-category
 */
export const getExpensesByCategory = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { month, year, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view expenses",
        },
      });
    }

    const dateQuery = {};
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      dateQuery.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) dateQuery.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find({
      ...dateQuery,
      status: { $in: ["paid", "approved"] },
    }).lean();

    const categoryBreakdown = {};
    expenses.forEach((expense) => {
      if (!categoryBreakdown[expense.category]) {
        categoryBreakdown[expense.category] = {
          category: expense.category,
          total: 0,
          count: 0,
          expenses: [],
        };
      }
      categoryBreakdown[expense.category].total += expense.amount || 0;
      categoryBreakdown[expense.category].count += 1;
      categoryBreakdown[expense.category].expenses.push(expense);
    });

    return res.json({
      categories: Object.values(categoryBreakdown),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Monthly Expenses
 * GET /api/v1/expenses/monthly
 */
export const getMonthlyExpenses = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { year } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view expenses",
        },
      });
    }

    const query = {};
    if (year) query.year = Number(year);

    const expenses = await Expense.find({
      ...query,
      status: { $in: ["paid", "approved"] },
    }).lean();

    const monthlyData = {};
    expenses.forEach((expense) => {
      const key = `${expense.year}-${String(expense.month).padStart(2, "0")}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          year: expense.year,
          month: expense.month,
          total: 0,
          count: 0,
        };
      }
      monthlyData[key].total += expense.amount || 0;
      monthlyData[key].count += 1;
    });

    return res.json({
      monthly: Object.values(monthlyData).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      }),
    });
  } catch (error) {
    return next(error);
  }
};

