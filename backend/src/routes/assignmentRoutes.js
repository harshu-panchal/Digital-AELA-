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
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Teacher routes (also accessible to super-admin)
const teacherOrAdmin = requireAuth(["teacher", "super-admin"]);
router.post("/teacher/assignments", teacherOrAdmin, createAssignment);
router.get("/teacher/assignments", teacherOrAdmin, getTeacherAssignments);
router.get("/teacher/assignments/:assignmentId", teacherOrAdmin, getAssignmentDetails);
router.put(
  "/teacher/assignments/:assignmentId/submissions/:submissionId/grade",
  teacherOrAdmin,
  gradeSubmission
);

// Student routes (allow all authenticated users)
const studentAuth = requireAuth([]);
router.get("/student/assignments", studentAuth, getStudentAssignments);
router.get("/student/assignments/:assignmentId", studentAuth, getStudentAssignmentDetails);
router.post("/student/assignments/:assignmentId/submit", studentAuth, submitAssignment);

export default router;

