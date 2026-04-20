import { Router } from "express";
import {
  getPublicBranchDetails,
  getPublicBranches,
} from "../controllers/branchController.js";

const router = Router();

router.get("/public", getPublicBranches);
router.get("/public/:identifier", getPublicBranchDetails);

export default router;
