import { Router } from "express";
import {
  createJob,
  deleteJob,
  getJob,
  listApplicants,
  listMyJobs,
  updateApplicantStage,
  updateJob,
} from "../controllers/jobController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const recruiterOnly = requireAuth(["recruiter"]);

router.get("/", recruiterOnly, listMyJobs);
router.post("/", recruiterOnly, createJob);
router.get("/:jobId", recruiterOnly, getJob);
router.patch("/:jobId", recruiterOnly, updateJob);
router.delete("/:jobId", recruiterOnly, deleteJob);
router.get("/:jobId/applicants", recruiterOnly, listApplicants);
router.patch("/:jobId/applicants/:applicationId", recruiterOnly, updateApplicantStage);

export default router;

