import { Router } from "express";
import {
  approveBranch,
  getAdminBranchDetails,
  getAdminBranches,
  getAdminBranchSummary,
  getPendingBranches,
  reactivateBranch,
  rejectBranch,
  suspendBranch,
} from "../controllers/branchController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth(["super-admin", "admin"]));

router.get("/branches/summary", getAdminBranchSummary);
router.get("/branches/pending", getPendingBranches);
router.get("/branches", getAdminBranches);
router.get("/branches/:branchId", getAdminBranchDetails);
router.patch("/branches/:branchId/approve", approveBranch);
router.patch("/branches/:branchId/reject", rejectBranch);
router.patch("/branches/:branchId/suspend", suspendBranch);
router.patch("/branches/:branchId/reactivate", reactivateBranch);

export default router;
