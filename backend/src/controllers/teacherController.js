import User from "../models/User.js";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";

/**
 * Get teacher profile by userId (public endpoint)
 */
export const getTeacherProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Get user with metadata
    const user = await User.findById(userId).select("fullName email role metadata isActive").lean();
    
    if (!user || user.role !== "teacher" || !user.isActive) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Teacher not found",
        },
      });
    }

    // Return user data with metadata as profile
    return res.json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      expertise: user.metadata?.expertise || "English Language",
      bio: user.metadata?.bio || user.metadata?.about || "",
      about: user.metadata?.about || user.metadata?.bio || "",
      experienceYears: user.metadata?.experienceYears || 0,
      experience: user.metadata?.experience || "",
      certifications: user.metadata?.certifications || [],
      specializations: user.metadata?.specializations || user.metadata?.primarySubjects || [],
      portfolioLink: user.metadata?.portfolioLink || "",
      preferredDelivery: user.metadata?.preferredDelivery || "",
      timeZones: user.metadata?.timeZones || "",
      phone: user.metadata?.phone || "",
      avatarUrl: user.metadata?.avatarUrl || "",
      socials: user.metadata?.socials || {},
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get own teacher profile (authenticated)
 * GET /api/v1/teachers/profile
 */
export const getMyTeacherProfile = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const user = await User.findById(userId).select("fullName email role metadata isActive").lean();
    
    if (!user || user.role !== "teacher") {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Teacher profile not found",
        },
      });
    }

    // Return user data with metadata as profile
    return res.json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      expertise: user.metadata?.expertise || "English Language",
      bio: user.metadata?.bio || user.metadata?.about || "",
      about: user.metadata?.about || user.metadata?.bio || "",
      experienceYears: user.metadata?.experienceYears || 0,
      experience: user.metadata?.experience || "",
      certifications: user.metadata?.certifications || [],
      specializations: user.metadata?.specializations || user.metadata?.primarySubjects || [],
      portfolioLink: user.metadata?.portfolioLink || "",
      preferredDelivery: user.metadata?.preferredDelivery || "",
      timeZones: user.metadata?.timeZones || "",
      phone: user.metadata?.phone || "",
      avatarUrl: user.metadata?.avatarUrl || "",
      socials: user.metadata?.socials || {},
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update teacher profile (authenticated)
 * PATCH /api/v1/teachers/profile
 */
export const updateTeacherProfile = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const user = await User.findById(userId);
    
    if (!user || user.role !== "teacher") {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Teacher profile not found",
        },
      });
    }

    // Handle profile image upload if provided
    let avatarUrl = user.metadata?.avatarUrl || "";
    if (req.file) {
      try {
        avatarUrl = await uploadToCloudinary(req.file, "teacher-profiles");
      } catch (uploadError) {
        console.error("Failed to upload profile image:", uploadError);
        // Continue without failing the request
      }
    }

    // Update fullName if provided
    if (req.body.fullName) {
      user.fullName = String(req.body.fullName).trim();
    }

    // Update email if provided (with validation)
    if (req.body.email) {
      const normalizedEmail = String(req.body.email).trim().toLowerCase();
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({
          error: {
            code: "CONFLICT",
            message: "Email is already in use by another account",
          },
        });
      }
      user.email = normalizedEmail;
    }

    // Update metadata
    const metadata = user.metadata || {};
    
    if (req.body.expertise !== undefined) {
      metadata.expertise = String(req.body.expertise).trim();
    }
    if (req.body.bio !== undefined) {
      metadata.bio = String(req.body.bio).trim();
    }
    if (req.body.about !== undefined) {
      metadata.about = String(req.body.about).trim();
    }
    if (req.body.experience !== undefined) {
      metadata.experience = String(req.body.experience).trim();
    }
    if (req.body.experienceYears !== undefined) {
      metadata.experienceYears = Number(req.body.experienceYears) || 0;
    }
    if (req.body.phone !== undefined) {
      metadata.phone = String(req.body.phone).trim();
    }
    if (req.body.portfolioLink !== undefined) {
      metadata.portfolioLink = String(req.body.portfolioLink).trim();
    }
    if (req.body.preferredDelivery !== undefined) {
      metadata.preferredDelivery = String(req.body.preferredDelivery).trim();
    }
    if (req.body.timeZones !== undefined) {
      metadata.timeZones = String(req.body.timeZones).trim();
    }
    if (req.body.certifications !== undefined) {
      metadata.certifications = Array.isArray(req.body.certifications) 
        ? req.body.certifications 
        : (req.body.certifications ? String(req.body.certifications).split(",").map(s => s.trim()) : []);
    }
    if (req.body.specializations !== undefined) {
      metadata.specializations = Array.isArray(req.body.specializations) 
        ? req.body.specializations 
        : (req.body.specializations ? String(req.body.specializations).split(",").map(s => s.trim()) : []);
    }
    if (req.body.primarySubjects !== undefined) {
      metadata.primarySubjects = Array.isArray(req.body.primarySubjects) 
        ? req.body.primarySubjects 
        : (req.body.primarySubjects ? String(req.body.primarySubjects).split(",").map(s => s.trim()) : []);
    }
    if (avatarUrl) {
      metadata.avatarUrl = avatarUrl;
    }
    if (req.body.socials) {
      metadata.socials = {
        ...(metadata.socials || {}),
        ...(typeof req.body.socials === "string" ? JSON.parse(req.body.socials) : req.body.socials),
      };
    }

    user.metadata = metadata;
    await user.save();

    // Return updated profile
    return res.json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      expertise: metadata.expertise || "English Language",
      bio: metadata.bio || metadata.about || "",
      about: metadata.about || metadata.bio || "",
      experienceYears: metadata.experienceYears || 0,
      experience: metadata.experience || "",
      certifications: metadata.certifications || [],
      specializations: metadata.specializations || metadata.primarySubjects || [],
      portfolioLink: metadata.portfolioLink || "",
      preferredDelivery: metadata.preferredDelivery || "",
      timeZones: metadata.timeZones || "",
      phone: metadata.phone || "",
      avatarUrl: metadata.avatarUrl || "",
      socials: metadata.socials || {},
    });
  } catch (error) {
    return next(error);
  }
};

