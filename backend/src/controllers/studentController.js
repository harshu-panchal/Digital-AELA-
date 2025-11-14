import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";

export const createStudentProfile = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const userIdToUse = userId || req.body.userId;

    if (!userIdToUse) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "User ID is required",
        },
      });
    }

    // Check if profile already exists
    const existing = await StudentProfile.findOne({ user: userIdToUse });
    if (existing) {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "Student profile already exists",
        },
      });
    }

    const {
      headline,
      bio,
      phone,
      location,
      ageGroup,
      currentStatus,
      skills,
      experience,
      education,
      resumeUrl,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      websiteUrl,
      avatarUrl,
      preferredProgram,
      goals,
      metadata,
    } = req.body;

    const profile = await StudentProfile.create({
      user: userIdToUse,
      headline,
      bio,
      phone,
      location: location
        ? {
            city: location.city,
            country: location.country,
          }
        : undefined,
      ageGroup,
      currentStatus,
      skills: Array.isArray(skills) ? skills : skills ? [skills] : [],
      experience,
      education: Array.isArray(education) ? education : [],
      resumeUrl,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      websiteUrl,
      avatarUrl,
      preferredProgram,
      goals,
      metadata: metadata || {},
    });

    return res.status(201).json(profile);
  } catch (error) {
    return next(error);
  }
};

export const getStudentProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const profile = await StudentProfile.findOne({ user: userId }).populate(
      "user",
      "fullName email role"
    );

    if (!profile) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Student profile not found",
        },
      });
    }

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

export const updateStudentProfile = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { userId: paramUserId } = req.params;

    const userIdToUse = paramUserId || userId;

    if (!userIdToUse) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "User ID is required",
        },
      });
    }

    const profile = await StudentProfile.findOne({ user: userIdToUse });

    if (!profile) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Student profile not found",
        },
      });
    }

    // Update allowed fields
    const updateFields = [
      "headline",
      "bio",
      "phone",
      "location",
      "ageGroup",
      "currentStatus",
      "skills",
      "experience",
      "education",
      "resumeUrl",
      "portfolioUrl",
      "linkedinUrl",
      "githubUrl",
      "websiteUrl",
      "avatarUrl",
      "preferredProgram",
      "goals",
      "metadata",
    ];

    const updates = {};
    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "location" && typeof req.body[field] === "object") {
          updates[field] = {
            city: req.body[field].city,
            country: req.body[field].country,
          };
        } else if (field === "skills" && typeof req.body[field] === "string") {
          updates[field] = req.body[field]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    Object.assign(profile, updates);
    await profile.save();

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

