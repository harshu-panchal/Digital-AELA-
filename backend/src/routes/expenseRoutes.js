import express from "express";
import {
  createExpense,
  getAllExpenses,
  getExpenseDetails,
  updateExpense,
  deleteExpense,
  getFinancialDashboard,
  getExpensesByCategory,
  getMonthlyExpenses,
} from "../controllers/expenseController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Financial dashboard
router.get("/dashboard", authenticate, getFinancialDashboard);
router.get("/by-category", authenticate, getExpensesByCategory);
router.get("/monthly", authenticate, getMonthlyExpenses);

// Expenses CRUD
router.post("/", authenticate, createExpense);
router.get("/", authenticate, getAllExpenses);
router.get("/:expenseId", authenticate, getExpenseDetails);
router.put("/:expenseId", authenticate, updateExpense);
router.delete("/:expenseId", authenticate, deleteExpense);

export default router;

