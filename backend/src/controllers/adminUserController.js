import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import StudentProfile from "../models/StudentProfile.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import Course from "../models/Course.js";
import Branch from "../models/Branch.js";

const toObjectIdString = (value) => {
  if (!value) return "";
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  return String(value);
};

const attachBranchInfo = async (users) => {
  if (!Array.isArray(users) || users.length === 0) return users;

  const ids = [
    ...new Set(
      users
        .map((u) => toObjectIdString(u.branchId))
        .filter((id) => id && mongoose.isValidObjectId(id))
    ),
  ];

  if (ids.length === 0) {
    return users.map((u) => ({ ...u, branch: null }));
  }

  const branches = await Branch.find({ _id: { $in: ids } })
    .select("instituteName branchName slug")
    .lean();
  const branchMap = new Map(branches.map((b) => [toObjectIdString(b._id), b]));

  return users.map((u) => ({
    ...u,
    branch: u.branchId ? branchMap.get(toObjectIdString(u.branchId)) || null : null,
  }));
};

/**
 * Get all users by role
 */
export const getUsersByRole = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    let { role } = req.params;
    const { page = 1, pageSize = 20, search = "" } = req.query;

    // Map plural forms to singular for database queries
    const roleMap = {
      students: "student",
      teachers: "teacher",
      recruiters: "recruiter",
      "branch-owners": "branch_owner",
      branch_owners: "branch_owner",
      branchOwners: "branch_owner",
      influencers: "influencer",
      freelancers: "freelancer",
    };

    // Convert plural to singular if needed
    if (roleMap[role]) {
      role = roleMap[role];
    }

    const validRoles = ["student", "teacher", "recruiter", "branch_owner", "influencer", "freelancer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid role. Valid roles are: ${validRoles.join(", ")}`,
        },
      });
    }

    const query = { role };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.json({
      users: await attachBranchInfo(users),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single user by ID
 */
export const getUserById = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const user = await User.findById(userId).select("-passwordHash").lean();

    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    let branch = null;
    if (user.branchId && mongoose.isValidObjectId(user.branchId)) {
      branch = await Branch.findById(user.branchId)
        .select("instituteName branchName slug")
        .lean();
    }

    return res.json({ user, branch });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user details for admin panel (includes activity like enrollments + purchases)
 */
export const getUserDetails = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const user = await User.findById(userId).select("-passwordHash").lean();

    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    let branch = null;
    if (user.branchId && mongoose.isValidObjectId(user.branchId)) {
      branch = await Branch.findById(user.branchId)
        .select("instituteName branchName slug")
        .lean();
    }

    const activity = {
      enrollments: null,
      payments: null,
      bookPurchases: null,
    };

    let profile = null;

    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: user._id }).lean();

      const recentEnrollments = await Enrollment.find({ student: user._id })
        .sort({ enrolledAt: -1, createdAt: -1 })
        .limit(25)
        .populate("course", "title status branchId price thumbnailUrl slug")
        .lean();

      const [totalEnrollments, recentCoursePayments, recentBookPayments] =
        await Promise.all([
          Enrollment.countDocuments({ student: user._id }),
          Payment.find({
            user: user._id,
            status: "completed",
            course: { $ne: null },
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("course", "title thumbnailUrl price branchId")
            .lean(),
          Payment.find({
            user: user._id,
            status: "completed",
            course: null,
            "metadata.type": { $in: ["book", "book-cart"] },
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
        ]);

      let branchTotal = 0;
      if (user.branchId) {
        const branchCourseIds = await Course.find({ branchId: user.branchId })
          .select("_id")
          .lean();
        const branchCourseIdList = branchCourseIds.map((item) => item._id);
        if (branchCourseIdList.length > 0) {
          branchTotal = await Enrollment.countDocuments({
            student: user._id,
            course: { $in: branchCourseIdList },
          });
        }
      }

      activity.enrollments = {
        total: totalEnrollments,
        branchTotal,
        recent: recentEnrollments,
      };
      activity.payments = { recentCoursePayments };
      activity.bookPurchases = { recentPayments: recentBookPayments };
    }

    return res.json({
      user,
      branch,
      profile,
      teacherProfile: user.role === "teacher" ? user.metadata || {} : null,
      activity,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new user
 */
export const createUser = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { email, password, fullName, role, isActive = true } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email, password, fullName, and role are required",
        },
      });
    }

    const validRoles = ["student", "teacher", "recruiter", "branch_owner", "influencer", "freelancer"];
    if (!validRoles.includes(role)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid role",
        },
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "User with this email already exists",
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName.trim(),
      role,
      isActive,
    });

    const userResponse = await User.findById(user._id).select("-passwordHash").lean();

    return res.status(201).json({ user: userResponse });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update user
 */
export const updateUser = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { userId } = req.params;
    const { email, password, fullName, role, isActive } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Update fields
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(409).json({
          error: {
            code: "CONFLICT",
            message: "User with this email already exists",
          },
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (fullName) user.fullName = fullName.trim();
    if (role) {
      const validRoles = ["student", "teacher", "recruiter", "branch_owner", "influencer", "freelancer", "super-admin", "admin"];
      if (validRoles.includes(role)) {
        user.role = role;
      }
    }
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 12);
    }

    await user.save();

    const userResponse = await User.findById(user._id).select("-passwordHash").lean();

    return res.json({ user: userResponse });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Prevent deleting super-admin
    if (user.role === "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Cannot delete super-admin users",
        },
      });
    }

    await user.deleteOne();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

