import bcrypt from "bcryptjs";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";
import { createSession } from "../middleware/sessionTracking.js";

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
      metadata: user.metadata || {}, // Include metadata with avatarUrl
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
    
    // For teachers, set isActive to false by default (requires admin approval)
    const isActive = role === "teacher" ? false : true;
    
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      fullName: normalizedFullName,
      role,
      isActive,
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
          avatarUrl: avatarUrl || profileData.avatarUrl || "", // Store Cloudinary avatar URL
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

    // Check if teacher account is approved (isActive must be true for teachers)
    if (user.role === "teacher" && !user.isActive) {
      return res.status(403).json({
        error: {
          code: "ACCOUNT_PENDING_APPROVAL",
          message: "Your teacher account is pending approval from the administrator. You will be able to login once your account is approved.",
        },
      });
    }

    const authResponse = buildAuthResponse(user);
    
    // Create session after successful login
    try {
      await createSession(user._id.toString(), authResponse.accessToken, req);
    } catch (sessionError) {
      // Log error but don't fail login
      console.error("Failed to create session:", sessionError);
    }

    return res.json(authResponse);
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

export const logout = async (req, res, next) => {
  try {
    // End session if token is provided
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    
    if (token) {
      try {
        const Session = (await import("../models/Session.js")).default;
        const session = await Session.findOne({ token, isActive: true });
        if (session) {
          await session.endSession();
        }
      } catch (sessionError) {
        console.error("Failed to end session:", sessionError);
      }
    }
    
    // Invalidate refresh tokens if stored (redis/whitelist). Placeholder for now.
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

/**
 * Request password reset (forgot password)
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email is required",
        },
      });
    }

    // Normalize email
    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success to prevent email enumeration attacks
    // Don't reveal whether the email exists or not
    if (!user) {
      return res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Import PasswordResetToken model
    const PasswordResetToken = (await import("../models/PasswordResetToken.js")).default;

    // Generate reset token (32-byte random hex string)
    const crypto = (await import("crypto")).default;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete any existing reset tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    // Create new reset token
    await PasswordResetToken.create({
      user: user._id,
      token,
      expiresAt,
    });

    // Send password reset email
    try {
      const { sendPasswordResetEmail } = await import("../utils/emailService.js");
      await sendPasswordResetEmail(user.email, token, user.fullName);
    } catch (emailError) {
      // Log error but don't fail the request
      console.error("Failed to send password reset email:", emailError);
      // In production, you might want to queue this for retry
    }

    return res.status(200).json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Reset password with token
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Token and new password are required",
        },
      });
    }

    // Validate password strength (minimum 6 characters)
    if (newPassword.length < 6) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 6 characters long",
        },
      });
    }

    // Import PasswordResetToken model
    const PasswordResetToken = (await import("../models/PasswordResetToken.js")).default;

    // Find valid token
    const resetToken = await PasswordResetToken.findValidToken(token);

    if (!resetToken) {
      return res.status(400).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired reset token. Please request a new password reset.",
        },
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await User.findByIdAndUpdate(resetToken.user._id, {
      passwordHash,
    });

    // Mark token as used
    await resetToken.markAsUsed();

    // Delete all other reset tokens for this user
    await PasswordResetToken.deleteMany({
      user: resetToken.user._id,
      _id: { $ne: resetToken._id },
    });

    // Send confirmation email
    try {
      const { sendPasswordResetSuccessEmail } = await import("../utils/emailService.js");
      await sendPasswordResetSuccessEmail(resetToken.user.email, resetToken.user.fullName);
    } catch (emailError) {
      // Log but don't fail - password was already reset
      console.error("Failed to send password reset success email:", emailError);
    }

    return res.status(200).json({
      message: "Password has been successfully reset. You can now log in with your new password.",
    });
  } catch (error) {
    return next(error);
  }
};

