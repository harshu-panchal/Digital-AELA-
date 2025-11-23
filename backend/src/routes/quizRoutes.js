import { Router } from "express";
import {
  submitQuizAttempt,
  getStudentQuizHistory,
  getPublishedQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizAnalytics,
  getQuizLeaderboard,
} from "../controllers/quizController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFeature } from "../middleware/featureFlagMiddleware.js";

const router = Router();

// Apply feature flag check for quizzes
router.use(requireFeature("quizzes"));

// Get all published quizzes (public endpoint)
router.get("/", getPublishedQuizzes);

// Submit quiz attempt and earn coins (authenticated student)
// Must come before /:quizId route to avoid matching "attempts" as a quizId
router.post("/attempts", requireAuth(["student"]), submitQuizAttempt);

// Get student quiz history (authenticated student)
// Must come before /:quizId route to avoid matching "attempts" as a quizId
router.get("/attempts", requireAuth(["student"]), getStudentQuizHistory);

// Create a new quiz (admin/teacher only)
router.post("/", requireAuth(["admin", "teacher"]), createQuiz);

// Update a quiz (admin/teacher only)
router.patch("/:quizId", requireAuth(["admin", "teacher"]), updateQuiz);

// Delete a quiz (admin/teacher only)
router.delete("/:quizId", requireAuth(["admin", "teacher"]), deleteQuiz);

// Get quiz analytics (admin/teacher only)
router.get("/:quizId/analytics", requireAuth(["admin", "teacher"]), getQuizAnalytics);

// Get quiz leaderboard (public endpoint)
router.get("/:quizId/leaderboard", getQuizLeaderboard);

// Get a single quiz by ID (public endpoint)
// Must come last to avoid matching other routes
router.get("/:quizId", getQuizById);

export default router;
