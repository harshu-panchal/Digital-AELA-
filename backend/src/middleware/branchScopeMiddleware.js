import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import { isAdminRole } from "./authMiddleware.js";

export const requireBranchOwner = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (isAdminRole(userRole)) {
      return next();
    }

    if (userRole !== "branch_owner") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only branch owners can access this endpoint",
        },
      });
    }

    const ownerObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!ownerObjectId) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid user ID" },
      });
    }

    const branch = await Branch.findOne({ ownerId: ownerObjectId });
    if (!branch) {
      return res.status(404).json({
        error: {
          code: "BRANCH_NOT_FOUND",
          message: "No branch is linked to this branch owner account",
        },
      });
    }

    req.branch = branch;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireLiveBranch = (req, res, next) => {
  if (!req.branch) {
    return res.status(403).json({
      error: {
        code: "BRANCH_REQUIRED",
        message: "A branch is required for this operation",
      },
    });
  }

  if (req.branch.status !== "approved" || req.branch.isLive !== true) {
    return res.status(403).json({
      error: {
        code: "BRANCH_NOT_ACTIVE",
        message:
          "This branch must be approved and live before this operation is available",
      },
    });
  }

  return next();
};
