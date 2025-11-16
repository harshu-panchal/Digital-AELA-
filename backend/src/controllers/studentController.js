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
      "fullName email role metadata"
    );

    if (!profile) {
      // Try to get user metadata for avatarUrl even if profile doesn't exist
      const user = await User.findById(userId).select("fullName email role metadata").lean();
      if (user) {
        return res.json({
          user: userId,
          englishLevel: "",
          profession: "",
          experience: { years: null, description: "" },
          location: { city: "", country: "" },
          maritalStatus: "",
          interests: [],
          skills: [],
          bio: "",
          headline: "",
          avatarUrl: user.metadata?.avatarUrl || "", // Include avatarUrl from user metadata
        });
      }
      // Return empty profile structure instead of 404 to allow creating profile
      return res.json({
        user: userId,
        englishLevel: "",
        profession: "",
        experience: { years: null, description: "" },
        location: { city: "", country: "" },
        maritalStatus: "",
        interests: [],
        skills: [],
        bio: "",
        headline: "",
        avatarUrl: "",
      });
    }

    // Merge avatarUrl from user metadata if profile doesn't have it
    const user = profile.user;
    if (user && user.metadata && user.metadata.avatarUrl && !profile.avatarUrl) {
      profile.avatarUrl = user.metadata.avatarUrl;
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

    let profile = await StudentProfile.findOne({ user: userIdToUse });

    // Auto-create profile if it doesn't exist
    if (!profile) {
      profile = await StudentProfile.create({
        user: userIdToUse,
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
      "profession",
      "englishLevel",
      "maritalStatus",
      "skills",
      "interests",
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
      "socialLinks",
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
        } else if ((field === "skills" || field === "interests") && typeof req.body[field] === "string") {
          updates[field] = req.body[field]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if ((field === "skills" || field === "interests") && Array.isArray(req.body[field])) {
          updates[field] = req.body[field];
        } else if (field === "socialLinks" && Array.isArray(req.body[field])) {
          // Update social links array
          updates[field] = req.body[field];
        } else if (field === "experience" && typeof req.body[field] === "object") {
          // Handle experience object
          updates[field] = req.body[field];
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    Object.assign(profile, updates);
    await profile.save();

    // If avatarUrl was updated, also update User.metadata.avatarUrl
    if (updates.avatarUrl !== undefined) {
      try {
        await User.findByIdAndUpdate(
          userIdToUse,
          {
            $set: {
              "metadata.avatarUrl": updates.avatarUrl,
            },
          },
          { new: true }
        );
      } catch (userUpdateError) {
        // eslint-disable-next-line no-console
        console.warn("Failed to update user metadata avatarUrl:", userUpdateError);
        // Continue - profile update was successful
      }
    }

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
};

