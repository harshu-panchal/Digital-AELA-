import { Router } from "express";
import {
  loginRecruiter,
  logout,
  refreshToken,
  registerRecruiter,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", registerRecruiter);
router.post("/login", loginRecruiter);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export default router;

