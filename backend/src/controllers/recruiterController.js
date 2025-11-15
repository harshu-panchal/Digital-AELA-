import RecruiterProfile from "../models/RecruiterProfile.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const getMyProfile = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const profile = await RecruiterProfile.findOne({ user: userId }).populate("user", [
      "email",
      "fullName",
    ]);

    if (!profile) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Recruiter profile not found",
        },
      });
    }

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get recruiter profile by userId (public endpoint)
 */
export const getRecruiterProfile = async (req, res, next) => {
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

    // Get user first to verify role
    const user = await User.findById(userId).select("fullName email role metadata isActive").lean();
    
    if (!user || user.role !== "recruiter" || !user.isActive) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Recruiter not found",
        },
      });
    }

    // Try to get profile, but if it doesn't exist, return user data with metadata
    const profile = await RecruiterProfile.findOne({ user: userId }).populate("user", [
      "email",
      "fullName",
    ]).lean();

    if (profile) {
      // Merge profile data with user metadata for complete information
      return res.json({
        ...profile,
        experience: profile.experience || user.metadata?.experience || "",
        experienceYears: profile.experienceYears || user.metadata?.experienceYears || 0,
        phone: profile.phone || user.metadata?.phone || "",
      });
    }

    // If no profile exists, return user data with metadata as profile
    return res.json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
      company: user.metadata?.company || "Talent Partner",
      headline: user.metadata?.headline || "",
      bio: user.metadata?.bio || user.metadata?.aboutCompany || "",
      aboutCompany: user.metadata?.aboutCompany || user.metadata?.bio || "",
      experience: user.metadata?.experience || "",
      experienceYears: user.metadata?.experienceYears || 0,
      phone: user.metadata?.phone || "",
      avatarUrl: user.metadata?.avatarUrl || "",
      socials: user.metadata?.socials || {},
      stats: {
        activeRoles: 0,
        totalViews: 0,
        totalApplications: 0,
        savedApplicants: 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const upsertMyProfile = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const payload = req.body;

    const profile = await RecruiterProfile.findOneAndUpdate(
      { user: userId },
      { ...payload, user: userId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("user", ["email", "fullName"]);

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

