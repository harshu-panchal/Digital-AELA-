import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Branch from "../models/Branch.js";
import BranchMembership from "../models/BranchMembership.js";
import StudentProfile from "../models/StudentProfile.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";
import { createSession } from "../middleware/sessionTracking.js";
import { normalizeRoleName } from "../middleware/authMiddleware.js";
import { generateUniqueBranchSlug } from "../services/branchService.js";

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
      isActive: user.isActive !== undefined ? user.isActive : true, // Include isActive status
      branchId: user.branchId ? user.branchId.toString() : null,
      branchJoinType: user.branchJoinType || "independent",
      approvalStatus: user.approvalStatus || "approved",
      approvedAt: user.approvedAt || null,
      rejectionReason: user.rejectionReason || null,
      emailVerified: user.emailVerified !== undefined ? user.emailVerified : false, // Include email verification status
      metadata: user.metadata || {}, // Include metadata with avatarUrl
    },
  };
};

const parseMaybeJson = (value, fallback = {}) => {
  if (!value || typeof value !== "string") return value || fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getBranchRegistrationPayload = (body) => ({
  ...(body.branch || {}),
  ...(body.profile?.branch || {}),
  instituteName:
    body.instituteName ||
    body.branch?.instituteName ||
    body.profile?.instituteName ||
    body.profile?.branch?.instituteName,
  branchName:
    body.branchName ||
    body.branch?.branchName ||
    body.profile?.branchName ||
    body.profile?.branch?.branchName,
  contactEmail:
    body.contactEmail ||
    body.branch?.contactEmail ||
    body.profile?.contactEmail ||
    body.profile?.branch?.contactEmail ||
    body.email,
  contactPhone:
    body.contactPhone ||
    body.branch?.contactPhone ||
    body.profile?.contactPhone ||
    body.profile?.branch?.contactPhone ||
    body.profile?.phone,
  address:
    body.address ||
    body.branch?.address ||
    body.profile?.address ||
    body.profile?.branch?.address,
  city:
    body.city ||
    body.branch?.city ||
    body.profile?.city ||
    body.profile?.branch?.city,
  state:
    body.state ||
    body.branch?.state ||
    body.profile?.state ||
    body.profile?.branch?.state,
  country:
    body.country ||
    body.branch?.country ||
    body.profile?.country ||
    body.profile?.branch?.country,
  postalCode:
    body.postalCode ||
    body.branch?.postalCode ||
    body.profile?.postalCode ||
    body.profile?.branch?.postalCode,
  description:
    body.description ||
    body.branch?.description ||
    body.profile?.description ||
    body.profile?.branch?.description,
});

const normalizeBranchJoinType = (value) =>
  value === "branch" ? "branch" : "independent";

const escapeRegExp = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const registerUser = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const role = normalizeRoleName(req.body.role || "student");
    
    // Parse profile if it's a JSON string (from FormData)
    if (req.body.profile && typeof req.body.profile === "string") {
      req.body.profile = parseMaybeJson(req.body.profile, {});
    }

    if (req.body.branch && typeof req.body.branch === "string") {
      req.body.branch = parseMaybeJson(req.body.branch, {});
    }
    
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
    const validRoles = [
      "admin",
      "branch_owner",
      "student",
      "teacher",
      "recruiter",
      "influencer",
      "freelancer",
      "super-admin",
    ];
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

    let branchId = null;
    let branchJoinType = normalizeBranchJoinType(
      req.body.branchJoinType || req.body.profile?.branchJoinType
    );

    if (role === "branch_owner") {
      branchJoinType = "branch";
    }

    if (["teacher", "student"].includes(role) && branchJoinType === "branch") {
      const selectedBranchId =
        req.body.branchId || req.body.profile?.branchId || req.body.branch?._id;

      if (!selectedBranchId || !String(selectedBranchId).trim()) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Please select a branch to join",
          },
        });
      }

      if (!mongoose.isValidObjectId(selectedBranchId)) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid branch selected",
          },
        });
      }

      const branch = await Branch.findById(selectedBranchId).select(
        "_id status isLive ownerId instituteName branchName"
      );

      if (!branch) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Selected branch is not available for registration",
          },
        });
      }

      if (["rejected", "suspended"].includes(branch.status)) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Selected branch is not accepting registrations right now",
          },
        });
      }

      branchId = branch._id;
    }

    // Handle profile image upload if provided
    let avatarUrl = "";
    if (req.file) {
      try {
        // eslint-disable-next-line no-console
        console.log("Uploading profile image to local storage...", {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          role,
        });
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          `digital-aela/profiles/${role}`,
          req.file.originalname
        );
        avatarUrl = uploadResult.url;
        // eslint-disable-next-line no-console
        console.log("Profile image uploaded successfully:", avatarUrl);
      } catch (uploadError) {
        // eslint-disable-next-line no-console
        console.error("Failed to upload profile image:", uploadError);
        // Continue registration without image - don't fail registration
      }
    } else {
      // eslint-disable-next-line no-console
      console.log("No profile image file received in request");
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
    } else if (role === "branch_owner" && req.body.profile) {
      const profileData = req.body.profile;
      metadata = {
        phone: profileData.phone || profileData.contactPhone || "",
        region: profileData.region || "",
        city: profileData.city || "",
        country: profileData.country || "",
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
    
    const needsApproval = ["teacher", "student", "recruiter", "branch_owner"].includes(role);
    const isActive = role === "branch_owner" ? true : !needsApproval;
    const approvalStatus = needsApproval ? "pending" : "approved";

    let branchPayload = null;
    if (role === "branch_owner") {
      branchPayload = getBranchRegistrationPayload(req.body);
      const requiredBranchFields = [
        "instituteName",
        "branchName",
        "contactEmail",
        "contactPhone",
        "city",
        "country",
      ];
      const missingBranchFields = requiredBranchFields.filter(
        (field) => !String(branchPayload[field] || "").trim()
      );

      if (missingBranchFields.length > 0) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Missing branch fields: ${missingBranchFields.join(", ")}`,
          },
        });
      }

      const duplicateBranch = await Branch.findOne({
        instituteName: {
          $regex: `^${escapeRegExp(branchPayload.instituteName.trim())}$`,
          $options: "i",
        },
        branchName: {
          $regex: `^${escapeRegExp(branchPayload.branchName.trim())}$`,
          $options: "i",
        },
        city: {
          $regex: `^${escapeRegExp(branchPayload.city.trim())}$`,
          $options: "i",
        },
      }).lean();

      if (duplicateBranch) {
        return res.status(409).json({
          error: {
            code: "CONFLICT",
            message: "A branch with this institute, branch name, and city already exists",
          },
        });
      }
    }

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      fullName: normalizedFullName,
      role,
      isActive,
      branchId,
      branchJoinType,
      approvalStatus,
      metadata,
    });

    if (role === "branch_owner") {
      try {
        const slug = await generateUniqueBranchSlug(
          branchPayload.instituteName,
          branchPayload.branchName
        );
        const branch = await Branch.create({
          instituteName: branchPayload.instituteName.trim(),
          branchName: branchPayload.branchName.trim(),
          slug,
          ownerId: user._id,
          contactEmail: String(branchPayload.contactEmail || normalizedEmail)
            .trim()
            .toLowerCase(),
          contactPhone: String(branchPayload.contactPhone || "").trim(),
          address: String(branchPayload.address || "").trim(),
          city: String(branchPayload.city || "").trim(),
          state: String(branchPayload.state || "").trim(),
          country: String(branchPayload.country || "").trim(),
          postalCode: String(branchPayload.postalCode || "").trim(),
          description: String(branchPayload.description || "").trim(),
          status: "pending",
          isLive: false,
          logoUrl: avatarUrl || "",
        });

        user.branchId = branch._id;
        user.metadata = {
          ...(user.metadata || {}),
          branchId: branch._id.toString(),
          branchSlug: branch.slug,
        };
        await user.save();
      } catch (branchError) {
        await User.findByIdAndDelete(user._id);
        throw branchError;
      }
    }

    if (["teacher", "student"].includes(role) && branchJoinType === "branch") {
      await BranchMembership.create({
        userId: user._id,
        branchId,
        userRoleAtJoin: role,
        status: "pending",
      });
    }

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
          avatarUrl: avatarUrl || profileData.avatarUrl || "", // Store avatar URL
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

    // Send email verification email
    try {
      const EmailVerificationToken = (await import("../models/EmailVerificationToken.js")).default;
      const crypto = (await import("crypto")).default;
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

      // Create verification token
      await EmailVerificationToken.create({
        user: user._id,
        token,
        expiresAt,
      });

      // Send verification email
      const { sendVerificationEmail } = await import("../utils/emailService.js");
      await sendVerificationEmail(user.email, token, user.fullName);
    } catch (emailError) {
      // Log error but don't fail registration
      console.error("Failed to send verification email:", emailError);
      console.error("Email error details:", {
        message: emailError.message,
        code: emailError.code,
        response: emailError.response,
        stack: emailError.stack,
      });
      // In production, you might want to queue this for retry
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

export const registerBranchOwner = async (req, res, next) => {
  req.body.role = "branch_owner";
  return registerUser(req, res, next);
};

export const registerTeacher = async (req, res, next) => {
  req.body.role = "teacher";
  return registerUser(req, res, next);
};

export const registerStudent = async (req, res, next) => {
  req.body.role = "student";
  return registerUser(req, res, next);
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const role = req.body.role ? normalizeRoleName(req.body.role) : undefined;
    
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
      const isBranchLinked = user.branchJoinType === "branch" && user.branchId;
      return res.status(403).json({
        error: {
          code: isBranchLinked
            ? "ACCOUNT_PENDING_BRANCH_APPROVAL"
            : "ACCOUNT_PENDING_APPROVAL",
          message: isBranchLinked
            ? "Your teacher account is pending approval from your branch owner. You will be able to login once your account is approved."
            : "Your teacher account is pending approval from the administrator. You will be able to login once your account is approved.",
        },
      });
    }

    // Check if student account is approved (isActive must be true for students)
    if (user.role === "student" && !user.isActive) {
      const isBranchLinked = user.branchJoinType === "branch" && user.branchId;
      return res.status(403).json({
        error: {
          code: isBranchLinked
            ? "ACCOUNT_PENDING_BRANCH_APPROVAL"
            : "ACCOUNT_PENDING_APPROVAL",
          message: isBranchLinked
            ? "Your student account is pending approval from your branch owner. You will be able to login once your account is approved."
            : "Your student account is pending approval from the administrator. You will be able to login once your account is approved.",
        },
      });
    }

    // Check if recruiter account is approved (isActive must be true for recruiters)
    if (user.role === "recruiter" && !user.isActive) {
      return res.status(403).json({
        error: {
          code: "ACCOUNT_PENDING_APPROVAL",
          message: "Your recruiter account is pending approval from the administrator. You will be able to login once your account is approved.",
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
    const { userId, token: accessToken } = req.auth || {};

    // Clear CSRF tokens for this user/session
    if (accessToken) {
      try {
        const CsrfToken = (await import("../models/CsrfToken.js")).default;
        await CsrfToken.deleteMany({ accessToken });
      } catch (csrfError) {
        // Don't fail logout if CSRF cleanup fails
        // eslint-disable-next-line no-console
        console.error("[Logout] Error clearing CSRF tokens:", csrfError);
      }
    }

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
        // eslint-disable-next-line no-console
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

/**
 * Change password (authenticated user)
 * POST /api/v1/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Current password and new password are required",
        },
      });
    }

    // 1. Password Strength Validation
    // Minimum 12 characters, uppercase, lowercase, numbers, special characters
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters.",
        },
      });
    }

    // Find user (explicitly select passwordHash and passwordHistory since they have select: false)
    const user = await User.findById(userId).select("+passwordHash +passwordHistory");
    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Check if user has a passwordHash
    if (!user.passwordHash) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User account does not have a password set. Please use password reset instead.",
        },
      });
    }

    // 2. Verify Current Password
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      // Log failed attempt
      try {
        const AuditLog = (await import("../models/AuditLog.js")).default;
        await AuditLog.create({
          user: userId,
          action: "password_change_attempt",
          entity: "User",
          entityId: userId,
          status: "failure",
          details: { reason: "Incorrect current password" },
          ipAddress,
          userAgent,
        });
      } catch (logError) {
        console.error("Failed to create audit log:", logError);
      }

      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        },
      });
    }

    // 3. Password History Check (prevent reuse of last 5 passwords)
    const isRecentlyUsed = await Promise.all(
      (user.passwordHistory || []).map((hash) => bcrypt.compare(newPassword, hash))
    );

    if (isRecentlyUsed.some((match) => match)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "You cannot reuse any of your last 5 passwords.",
        },
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password and history
    const updatedHistory = [user.passwordHash, ...(user.passwordHistory || [])].slice(0, 5);
    
    await User.findByIdAndUpdate(userId, {
      passwordHash,
      passwordHistory: updatedHistory,
      lastPasswordChange: new Date(),
    });

    // 4. Audit Logging
    try {
      const AuditLog = (await import("../models/AuditLog.js")).default;
      await AuditLog.create({
        user: userId,
        action: "password_change",
        entity: "User",
        entityId: userId,
        status: "success",
        details: { message: "Password changed successfully" },
        ipAddress,
        userAgent,
      });
    } catch (logError) {
      console.error("Failed to create audit log:", logError);
    }

    // 5. Notify user via email
    try {
      const { sendPasswordResetSuccessEmail } = await import("../utils/emailService.js");
      await sendPasswordResetSuccessEmail(user.email, user.fullName);
    } catch (emailError) {
      console.error("Failed to send password change notification email:", emailError);
    }

    return res.status(200).json({
      message: "Password has been successfully changed.",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update user metadata (for profile settings like notification preferences)
 * PATCH /api/v1/auth/profile
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { metadata, fullName } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Prepare update object
    const updateData = {};
    
    if (fullName !== undefined) {
      updateData.fullName = String(fullName).trim();
    }

    if (metadata !== undefined) {
      // Merge metadata instead of replacing it completely
      updateData.metadata = {
        ...(user.metadata || {}),
        ...metadata,
      };
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("fullName email role metadata isActive branchId branchJoinType approvalStatus approvedAt rejectionReason createdAt");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id.toString(),
        role: updatedUser.role,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        createdAt: updatedUser.createdAt,
        isActive: updatedUser.isActive,
        branchId: updatedUser.branchId ? updatedUser.branchId.toString() : null,
        branchJoinType: updatedUser.branchJoinType || "independent",
        approvalStatus: updatedUser.approvalStatus || "approved",
        approvedAt: updatedUser.approvedAt || null,
        rejectionReason: updatedUser.rejectionReason || null,
        metadata: updatedUser.metadata || {},
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Verify email with token
 * GET /api/v1/auth/verify-email?token=xxx
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Verification token is required",
        },
      });
    }

    // Import EmailVerificationToken model
    const EmailVerificationToken = (await import("../models/EmailVerificationToken.js")).default;

    // Find valid token
    const verificationToken = await EmailVerificationToken.findValidToken(token);

    if (!verificationToken) {
      return res.status(400).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired verification token. Please request a new verification email.",
        },
      });
    }

    // Check if email is already verified
    if (verificationToken.user.emailVerified) {
      // Mark token as used even though email is already verified
      await verificationToken.markAsUsed();
      return res.status(200).json({
        message: "Email is already verified",
        verified: true,
      });
    }

    // Update user to mark email as verified
    await User.findByIdAndUpdate(verificationToken.user._id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Mark token as used
    await verificationToken.markAsUsed();

    // Delete all other verification tokens for this user
    await EmailVerificationToken.deleteMany({
      user: verificationToken.user._id,
      _id: { $ne: verificationToken._id },
    });

    return res.status(200).json({
      message: "Email has been successfully verified",
      verified: true,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification
 */
export const resendVerificationEmail = async (req, res, next) => {
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
    if (!user) {
      return res.status(200).json({
        message: "If an account with that email exists, a verification email has been sent.",
      });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(200).json({
        message: "Email is already verified",
        verified: true,
      });
    }

    // Import EmailVerificationToken model
    const EmailVerificationToken = (await import("../models/EmailVerificationToken.js")).default;

    // Generate new verification token
    const crypto = (await import("crypto")).default;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Delete any existing verification tokens for this user
    await EmailVerificationToken.deleteMany({ user: user._id });

    // Create new verification token
    await EmailVerificationToken.create({
      user: user._id,
      token,
      expiresAt,
    });

    // Send verification email
    try {
      const { sendVerificationEmail } = await import("../utils/emailService.js");
      await sendVerificationEmail(user.email, token, user.fullName);
    } catch (emailError) {
      // Log error but don't fail the request
      console.error("Failed to send verification email:", emailError);
      // In production, you might want to queue this for retry
    }

    return res.status(200).json({
      message: "If an account with that email exists, a verification email has been sent.",
    });
  } catch (error) {
    return next(error);
  }
};

