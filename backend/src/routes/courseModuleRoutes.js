import express from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import {
  uploadModuleFiles,
  handleModuleUploadError,
} from "../middleware/moduleUploadMiddleware.js";
import {
  createModule,
  getCourseModules,
  getModule,
  updateModule,
  deleteModule,
  addFilesToModule,
  removeFileFromModule,
} from "../controllers/courseModuleController.js";

const router = express.Router();

// Create module for a course (Teacher/Super Admin)
router.post(
  "/courses/:courseId/modules",
  requireAuth(),
  uploadModuleFiles("files", 20),
  handleModuleUploadError,
  createModule
);

// Get all modules for a course (requires enrollment)
router.get("/courses/:courseId/modules", optionalAuth, getCourseModules);

// Get single module (requires enrollment)
router.get("/modules/:moduleId", optionalAuth, getModule);

// Update module metadata (Teacher/Super Admin)
router.put("/modules/:moduleId", requireAuth(), updateModule);

// Delete module (Teacher/Super Admin)
router.delete("/modules/:moduleId", requireAuth(), deleteModule);

// Add files to module (Teacher/Super Admin)
router.post(
  "/modules/:moduleId/files",
  requireAuth(),
  uploadModuleFiles("files", 20),
  handleModuleUploadError,
  addFilesToModule
);

// Remove file from module (Teacher/Super Admin)
router.delete("/modules/:moduleId/files/:fileIndex", requireAuth(), removeFileFromModule);

export default router;

