import express from "express";
import {
  createAssignment,
  getTeacherAssignments,
  getAssignmentDetails,
  gradeSubmission,
  getStudentAssignments,
  submitAssignment,
  getStudentAssignmentDetails,
} from "../controllers/assignmentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Teacher routes
router.post("/teacher/assignments", authenticate, createAssignment);
router.get("/teacher/assignments", authenticate, getTeacherAssignments);
router.get("/teacher/assignments/:assignmentId", authenticate, getAssignmentDetails);
router.put(
  "/teacher/assignments/:assignmentId/submissions/:submissionId/grade",
  authenticate,
  gradeSubmission
);

// Student routes
router.get("/student/assignments", authenticate, getStudentAssignments);
router.get("/student/assignments/:assignmentId", authenticate, getStudentAssignmentDetails);
router.post("/student/assignments/:assignmentId/submit", authenticate, submitAssignment);

export default router;

