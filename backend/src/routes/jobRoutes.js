import { Router } from "express";
import {
  createJob,
  deleteJob,
  getApplicantDetails,
  getJob,
  listApplicants,
  listMyJobs,
  updateApplicantStage,
  updateJob,
} from "../controllers/jobController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFeature } from "../middleware/featureFlagMiddleware.js";

const router = Router();
const recruiterOnly = requireAuth(["recruiter"]);

// Apply feature flag check for jobs
router.use(requireFeature("jobs"));

router.get("/", recruiterOnly, listMyJobs);
router.post("/", recruiterOnly, createJob);
router.get("/:jobId", recruiterOnly, getJob);
router.patch("/:jobId", recruiterOnly, updateJob);
router.delete("/:jobId", recruiterOnly, deleteJob);
router.get("/:jobId/applicants", recruiterOnly, listApplicants);
router.get("/:jobId/applicants/:applicationId", recruiterOnly, getApplicantDetails);
router.patch("/:jobId/applicants/:applicationId", recruiterOnly, updateApplicantStage);

export default router;

