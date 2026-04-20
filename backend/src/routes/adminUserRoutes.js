import { Router } from "express";
import {
  getUsersByRole,
  getUserById,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/adminUserController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// All routes require super-admin role
router.use(requireAuth(["super-admin"]));

// Get users by role
router.get("/users/:role", getUsersByRole);

// Get single user
router.get("/users/id/:userId", getUserById);

// Get user details (activity, purchases, etc.)
router.get("/users/id/:userId/details", getUserDetails);

// Create user
router.post("/users", createUser);

// Update user
router.patch("/users/:userId", updateUser);

// Delete user
router.delete("/users/:userId", deleteUser);

export default router;

