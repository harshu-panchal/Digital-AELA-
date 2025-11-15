import User from "../models/User.js";
import mongoose from "mongoose";

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

