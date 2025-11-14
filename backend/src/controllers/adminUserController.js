import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

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
      influencers: "influencer",
      freelancers: "freelancer",
    };

    // Convert plural to singular if needed
    if (roleMap[role]) {
      role = roleMap[role];
    }

    const validRoles = ["student", "teacher", "recruiter", "influencer", "freelancer"];
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
      users,
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

    return res.json({ user });
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

    const validRoles = ["student", "teacher", "recruiter", "influencer", "freelancer"];
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
      const validRoles = ["student", "teacher", "recruiter", "influencer", "freelancer", "super-admin"];
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

