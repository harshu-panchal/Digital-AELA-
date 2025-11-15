import bcrypt from "bcryptjs";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";

const buildAuthResponse = (user) => {
  const userId = user._id?.toString() || user.id;
  const payload = {
    sub: userId,
    role: user.role,
    email: user.email,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: {
      id: userId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
    },
  };
};

export const registerUser = async (req, res, next) => {
  try {
    const { email, password, fullName, role = "student" } = req.body;
    
    // Normalize email (lowercase and trim) to match how it's stored
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedFullName = String(fullName || "").trim();
    
    if (!normalizedEmail || !password || !normalizedFullName) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email, password and full name are required",
        },
      });
    }

    // Validate role
    const validRoles = ["student", "teacher", "recruiter", "influencer", "freelancer", "super-admin"];
    if (!validRoles.includes(role)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        },
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "An account with this email already exists",
        },
      });
    }

    // Handle profile image upload if provided
    let avatarUrl = "";
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          `digital-aela/profiles/${role}`
        );
        avatarUrl = uploadResult.url;
      } catch (uploadError) {
        // eslint-disable-next-line no-console
        console.error("Failed to upload profile image:", uploadError);
        // Continue registration without image - don't fail registration
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // Build metadata from profile data for teachers and recruiters
    let metadata = {};
    if (role === "teacher" && req.body.profile) {
      const profileData = req.body.profile;
      const primarySubjectsArray = Array.isArray(profileData.primarySubjects) 
        ? profileData.primarySubjects 
        : (profileData.primarySubjects ? profileData.primarySubjects.split(",").map(s => s.trim()) : []);
      const certificationsArray = Array.isArray(profileData.certifications) 
        ? profileData.certifications 
        : (profileData.certifications ? profileData.certifications.split(",").map(s => s.trim()) : []);
      
      metadata = {
        expertise: profileData.expertise || primarySubjectsArray[0] || "English Language",
        bio: profileData.bio || profileData.about || profileData.message || "",
        about: profileData.about || profileData.message || "",
        experienceYears: profileData.experienceYears || 0,
        experience: profileData.experience || `${profileData.experienceYears || 0} years of teaching experience`,
        certifications: certificationsArray,
        specializations: primarySubjectsArray,
        primarySubjects: primarySubjectsArray,
        portfolioLink: profileData.portfolioLink || "",
        preferredDelivery: profileData.preferredDelivery || "online",
        timeZones: profileData.timeZones || "Gulf Standard Time (GST)",
        phone: profileData.phone || "",
        socials: {
          linkedin: profileData.linkedinUrl || profileData.linkedin || "",
          website: profileData.website || profileData.portfolioLink || "",
          twitter: profileData.twitter || "",
        },
        avatarUrl: avatarUrl || profileData.avatarUrl || "",
      };
    } else if (role === "recruiter" && req.body.profile) {
      const profileData = req.body.profile;
      metadata = {
        company: profileData.companyName || profileData.company || "Talent Partner",
        headline: profileData.headline || "",
        bio: profileData.bio || profileData.aboutCompany || "",
        aboutCompany: profileData.aboutCompany || "",
        experience: profileData.experience || "",
        experienceYears: profileData.experienceYears || 0,
        phone: profileData.phone || "",
        socials: {
          linkedin: profileData.linkedinUrl || profileData.linkedin || "",
          website: profileData.website || "",
          twitter: profileData.twitter || "",
        },
        avatarUrl: avatarUrl || profileData.avatarUrl || "",
      };
    } else {
      // For students, influencers, freelancers - store avatarUrl in metadata
      metadata = {
        avatarUrl: avatarUrl || (req.body.profile?.avatarUrl || ""),
      };
    }
    
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      fullName: normalizedFullName,
      role,
      metadata,
    });

    // If student role, create student profile with provided data
    if (role === "student" && req.body.profile) {
      try {
        const profileData = req.body.profile;
        await StudentProfile.create({
          user: user._id,
          headline: profileData.headline,
          bio: profileData.bio,
          phone: profileData.phone,
          location: profileData.city || profileData.country
            ? {
                city: profileData.city,
                country: profileData.country,
              }
            : undefined,
          ageGroup: profileData.ageGroup,
          currentStatus: profileData.currentStatus,
          skills: Array.isArray(profileData.skills) ? profileData.skills : [],
          resumeUrl: profileData.resumeUrl,
          portfolioUrl: profileData.portfolioUrl,
          linkedinUrl: profileData.linkedinUrl,
          preferredProgram: profileData.preferredProgram,
          goals: profileData.goals,
          metadata: {
            referralSource: profileData.referralSource,
            message: profileData.message,
            ...(profileData.metadata || {}),
          },
        });
      } catch (profileError) {
        // Log error but don't fail registration
        // eslint-disable-next-line no-console
        console.warn("Failed to create student profile during registration:", profileError);
      }
    }

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

// Keep recruiter-specific endpoints for backward compatibility
export const registerRecruiter = async (req, res, next) => {
  req.body.role = "recruiter";
  return registerUser(req, res, next);
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    
    // Normalize email (lowercase and trim) to match how it's stored
    const normalizedEmail = String(email || "").trim().toLowerCase();
    
    if (!normalizedEmail || !password) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
        },
      });
    }

    const query = { email: normalizedEmail };
    if (role) {
      query.role = role;
    }
    
    const user = await User.findOne(query).select("+passwordHash");
    if (!user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        },
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        },
      });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

// Keep recruiter-specific endpoints for backward compatibility
export const loginRecruiter = async (req, res, next) => {
  req.body.role = "recruiter";
  return loginUser(req, res, next);
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "refreshToken is required",
        },
      });
    }

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "User no longer exists",
        },
      });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

export const logout = async (_req, res, next) => {
  try {
    // Invalidate refresh tokens if stored (redis/whitelist). Placeholder for now.
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

