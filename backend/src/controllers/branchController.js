import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import User from "../models/User.js";
import BranchMembership from "../models/BranchMembership.js";
import {
  BRANCH_STATUSES,
  buildBranchPublicQuery,
  validateObjectId,
} from "../services/branchService.js";
import { isAdminRole } from "../middleware/authMiddleware.js";

const trimmed = (value) => String(value || "").trim();

const sendValidationError = (res, message, status = 422) =>
  res.status(status).json({
    error: {
      code: "VALIDATION_ERROR",
      message,
    },
  });

const getPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page || "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(query.pageSize || "20", 10))
  );
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
};

export const getPublicBranches = async (req, res, next) => {
  try {
    const { search = "", city, state, country } = req.query;
    const includeAll =
      String(req.query.includeAll || "")
        .trim()
        .toLowerCase() === "true" || String(req.query.includeAll || "").trim() === "1";

    // Default: public directory only shows approved/live branches.
    // Registration pages can opt in to seeing all registered branches via `includeAll=1`,
    // but we return a reduced field set in that mode.
    const query = includeAll ? {} : buildBranchPublicQuery();

    if (city) query.city = { $regex: trimmed(city), $options: "i" };
    if (state) query.state = { $regex: trimmed(state), $options: "i" };
    if (country) query.country = { $regex: trimmed(country), $options: "i" };
    if (search) {
      query.$or = [
        { instituteName: { $regex: trimmed(search), $options: "i" } },
        { branchName: { $regex: trimmed(search), $options: "i" } },
        { city: { $regex: trimmed(search), $options: "i" } },
        { state: { $regex: trimmed(search), $options: "i" } },
      ];
    }

    const branches = await Branch.find(query)
      .select(
        includeAll
          ? "instituteName branchName slug city state country status isLive"
          : "instituteName branchName slug contactEmail contactPhone address city state country postalCode description logoUrl bannerUrl status isLive"
      )
      .sort({ instituteName: 1, branchName: 1 })
      .lean();

    return res.json({ branches });
  } catch (error) {
    return next(error);
  }
};

export const getPublicBranchDetails = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const query = mongoose.isValidObjectId(identifier)
      ? { _id: identifier }
      : { slug: String(identifier || "").toLowerCase().trim() };

    const branch = await Branch.findOne(buildBranchPublicQuery(query))
      .select(
        "instituteName branchName slug contactEmail contactPhone address city state country postalCode description logoUrl bannerUrl status isLive"
      )
      .lean();

    if (!branch) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch not found",
        },
      });
    }

    return res.json({ branch });
  } catch (error) {
    return next(error);
  }
};

export const getAdminBranches = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can access branch management",
        },
      });
    }

    const { status, search = "" } = req.query;
    const { page, pageSize, skip } = getPagination(req.query);
    const query = {};

    if (status) {
      if (!BRANCH_STATUSES.includes(status)) {
        return sendValidationError(res, "Invalid branch status");
      }
      query.status = status;
    }

    if (search) {
      query.$or = [
        { instituteName: { $regex: trimmed(search), $options: "i" } },
        { branchName: { $regex: trimmed(search), $options: "i" } },
        { contactEmail: { $regex: trimmed(search), $options: "i" } },
        { city: { $regex: trimmed(search), $options: "i" } },
      ];
    }

    const [branches, total, stats] = await Promise.all([
      Branch.find(query)
        .populate("ownerId", "fullName email isActive approvalStatus")
        .populate("approvedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Branch.countDocuments(query),
      Branch.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts = stats.reduce(
      (acc, item) => ({
        ...acc,
        [item._id]: item.count,
      }),
      { pending: 0, approved: 0, rejected: 0, suspended: 0 }
    );

    return res.json({
      branches,
      stats: {
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
        ...statusCounts,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getPendingBranches = async (req, res, next) => {
  req.query.status = "pending";
  return getAdminBranches(req, res, next);
};

export const getAdminBranchDetails = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can access branch details",
        },
      });
    }

    const branchObjectId = validateObjectId(req.params.branchId, "branch ID");
    const branch = await Branch.findById(branchObjectId)
      .populate("ownerId", "fullName email isActive approvalStatus")
      .populate("approvedBy", "fullName email")
      .lean();

    if (!branch) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch not found",
        },
      });
    }

    const [teacherCount, studentCount, pendingUsers] = await Promise.all([
      User.countDocuments({ branchId: branchObjectId, role: "teacher" }),
      User.countDocuments({ branchId: branchObjectId, role: "student" }),
      User.countDocuments({ branchId: branchObjectId, approvalStatus: "pending" }),
    ]);

    return res.json({
      branch,
      stats: {
        teachers: teacherCount,
        students: studentCount,
        pendingUsers,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateBranchState = async ({
  branchId,
  adminId,
  status,
  isLive,
  rejectionReason = null,
}) => {
  const branch = await Branch.findById(branchId);
  if (!branch) {
    const error = new Error("Branch not found");
    error.status = 404;
    error.code = "RESOURCE_NOT_FOUND";
    throw error;
  }

  branch.status = status;
  branch.isLive = isLive;
  branch.approvedBy = adminId;
  branch.approvedAt = status === "approved" ? new Date() : branch.approvedAt;
  branch.rejectionReason = status === "rejected" ? rejectionReason : null;
  await branch.save();

  const ownerUpdate = {
    branchId: branch._id,
    branchJoinType: "branch",
  };

  if (status === "approved") {
    ownerUpdate.approvalStatus = "approved";
    ownerUpdate.isActive = true;
    ownerUpdate.approvedBy = adminId;
    ownerUpdate.approvedAt = new Date();
    ownerUpdate.rejectionReason = null;
  } else if (status === "rejected") {
    ownerUpdate.approvalStatus = "rejected";
    ownerUpdate.rejectionReason = rejectionReason;
  }

  await User.findByIdAndUpdate(branch.ownerId, ownerUpdate, {
    runValidators: true,
  });

  return Branch.findById(branch._id)
    .populate("ownerId", "fullName email isActive approvalStatus")
    .populate("approvedBy", "fullName email")
    .lean();
};

export const approveBranch = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Only admins can approve branches" },
      });
    }

    const branchObjectId = validateObjectId(req.params.branchId, "branch ID");
    const adminObjectId = validateObjectId(userId, "admin user ID");
    const branch = await updateBranchState({
      branchId: branchObjectId,
      adminId: adminObjectId,
      status: "approved",
      isLive: true,
    });

    return res.json({ branch, message: "Branch approved successfully" });
  } catch (error) {
    return next(error);
  }
};

export const rejectBranch = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Only admins can reject branches" },
      });
    }

    const reason = trimmed(req.body.rejectionReason || req.body.reason);
    if (!reason) {
      return sendValidationError(res, "Rejection reason is required");
    }

    const branchObjectId = validateObjectId(req.params.branchId, "branch ID");
    const adminObjectId = validateObjectId(userId, "admin user ID");
    const branch = await updateBranchState({
      branchId: branchObjectId,
      adminId: adminObjectId,
      status: "rejected",
      isLive: false,
      rejectionReason: reason,
    });

    return res.json({ branch, message: "Branch rejected successfully" });
  } catch (error) {
    return next(error);
  }
};

export const suspendBranch = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Only admins can suspend branches" },
      });
    }

    const branchObjectId = validateObjectId(req.params.branchId, "branch ID");
    const branch = await Branch.findByIdAndUpdate(
      branchObjectId,
      {
        status: "suspended",
        isLive: false,
        rejectionReason: trimmed(req.body.reason || req.body.rejectionReason) || null,
      },
      { new: true, runValidators: true }
    )
      .populate("ownerId", "fullName email isActive approvalStatus")
      .lean();

    if (!branch) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Branch not found" },
      });
    }

    return res.json({ branch, message: "Branch suspended successfully" });
  } catch (error) {
    return next(error);
  }
};

export const reactivateBranch = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can reactivate branches",
        },
      });
    }

    const branchObjectId = validateObjectId(req.params.branchId, "branch ID");
    const adminObjectId = validateObjectId(userId, "admin user ID");
    const branch = await updateBranchState({
      branchId: branchObjectId,
      adminId: adminObjectId,
      status: "approved",
      isLive: true,
    });

    return res.json({ branch, message: "Branch reactivated successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getAdminBranchSummary = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view branch analytics",
        },
      });
    }

    const [
      totalBranches,
      pendingBranches,
      approvedBranches,
      suspendedBranches,
      branchTeachers,
      branchStudents,
      memberships,
    ] = await Promise.all([
      Branch.countDocuments({}),
      Branch.countDocuments({ status: "pending" }),
      Branch.countDocuments({ status: "approved", isLive: true }),
      Branch.countDocuments({ status: "suspended" }),
      User.countDocuments({ role: "teacher", branchId: { $ne: null } }),
      User.countDocuments({ role: "student", branchId: { $ne: null } }),
      BranchMembership.countDocuments({ status: "pending" }),
    ]);

    return res.json({
      stats: {
        totalBranches,
        pendingBranches,
        approvedBranches,
        suspendedBranches,
        branchTeachers,
        branchStudents,
        pendingMemberships: memberships,
      },
    });
  } catch (error) {
    return next(error);
  }
};
