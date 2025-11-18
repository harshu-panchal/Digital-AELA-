import { Router } from "express";
import {
  getMyProfile,
  upsertMyProfile,
  getRecruiterProfile,
} from "../controllers/recruiterController.js";
import {
  getRecruiterAnalyticsDashboard,
  getJobApplicationAnalytics,
  getCandidatePipelineMetrics,
  getHiringStatistics,
  getPerformanceReport,
  bulkApplicantActions,
  advancedCandidateFilter,
  scheduleInterview,
  getInterviewSchedule,
  updateInterviewStatus,
} from "../controllers/recruiterAnalyticsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public endpoint to get recruiter profile by userId
router.get("/:userId/profile", getRecruiterProfile);

// Authenticated endpoints for own profile
router.get("/profile", requireAuth(["recruiter"]), getMyProfile);
router.patch("/profile", requireAuth(["recruiter"]), upsertMyProfile);

// Analytics endpoints
router.get("/analytics/dashboard", requireAuth(["recruiter"]), getRecruiterAnalyticsDashboard);
router.get("/analytics/jobs/:jobId", requireAuth(["recruiter"]), getJobApplicationAnalytics);
router.get("/analytics/pipeline", requireAuth(["recruiter"]), getCandidatePipelineMetrics);
router.get("/analytics/hiring-stats", requireAuth(["recruiter"]), getHiringStatistics);
router.get("/analytics/performance-report", requireAuth(["recruiter"]), getPerformanceReport);

// Applicant management endpoints
router.post("/applicants/bulk-action", requireAuth(["recruiter"]), bulkApplicantActions);
router.get("/applicants/search", requireAuth(["recruiter"]), advancedCandidateFilter);

// Interview scheduling endpoints
router.post("/applicants/:applicationId/schedule-interview", requireAuth(["recruiter"]), scheduleInterview);
router.get("/interviews", requireAuth(["recruiter"]), getInterviewSchedule);
router.patch("/applicants/:applicationId/interview", requireAuth(["recruiter"]), updateInterviewStatus);

export default router;

