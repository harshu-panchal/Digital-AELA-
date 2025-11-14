import { Router } from "express";
import {
  submitQuizAttempt,
  getStudentQuizHistory,
  getPublishedQuizzes,
  getQuizById,
  createQuiz,
} from "../controllers/quizController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get all published quizzes (public endpoint)
router.get("/", getPublishedQuizzes);

// Get a single quiz by ID (public endpoint)
router.get("/:quizId", getQuizById);

// Create a new quiz (admin/teacher only)
router.post("/", requireAuth(["admin", "teacher"]), createQuiz);

// Submit quiz attempt and earn coins (authenticated student)
router.post("/attempts", requireAuth(["student"]), submitQuizAttempt);

// Get student quiz history (authenticated student)
router.get("/attempts", requireAuth(["student"]), getStudentQuizHistory);

export default router;
