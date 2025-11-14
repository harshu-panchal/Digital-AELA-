import { Router } from "express";
import {
  submitQuizAttempt,
  getStudentQuizHistory,
} from "../controllers/quizController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Submit quiz attempt and earn coins (authenticated student)
router.post("/attempts", requireAuth(["student"]), submitQuizAttempt);

// Get student quiz history (authenticated student)
router.get("/attempts", requireAuth(["student"]), getStudentQuizHistory);

export default router;
