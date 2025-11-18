import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionBankStats,
} from "../controllers/questionBankController.js";

const router = Router();

// All routes require authentication
router.use(requireAuth());

// Get question bank statistics
router.get("/stats", getQuestionBankStats);

// Get questions from question bank
router.get("/", getQuestions);

// Create a question in question bank
router.post("/", requireAuth(["admin", "teacher"]), createQuestion);

// Get a single question by ID
router.get("/:questionId", getQuestionById);

// Update a question
router.patch("/:questionId", requireAuth(["admin", "teacher"]), updateQuestion);

// Delete a question
router.delete("/:questionId", requireAuth(["admin", "teacher"]), deleteQuestion);

export default router;

