import Settings from "../models/Settings.js";
import { clearSettingsCache } from "../utils/settingsHelper.js";
import bcrypt from "bcryptjs";
import FinancialPasswordResetToken from "../models/FinancialPasswordResetToken.js";
import User from "../models/User.js";
import { sendFinancialPasswordResetEmail } from "../utils/emailService.js";

/**
 * Get public settings (no authentication required)
 * GET /api/v1/public/settings?category=social
 */
export const getPublicSettings = async (req, res, next) => {
  try {
    const { category } = req.query;

    const query = { isPublic: true }; // Only return public settings
    if (category) {
      query.category = category;
    }

    const settings = await Settings.find(query).sort({ category: 1, key: 1 });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        label: setting.label,
        description: setting.description,
        updatedAt: setting.updatedAt,
      });
      return acc;
    }, {});

    return res.json({
      settings: groupedSettings,
      flat: settings.map((s) => ({
        key: s.key,
        value: s.value,
        category: s.category,
        type: s.type,
        label: s.label,
        description: s.description,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all settings or by category
 * GET /api/v1/admin/settings
 */
export const getAllSettings = async (req, res, next) => {
  try {
    const { category, public: publicOnly } = req.query;

    const query = {};
    if (category) {
      query.category = category;
    }
    if (publicOnly === "true") {
      query.isPublic = true;
    }

    const settings = await Settings.find(query).sort({ category: 1, key: 1 });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        label: setting.label,
        description: setting.description,
        isPublic: setting.isPublic,
        updatedAt: setting.updatedAt,
      });
      return acc;
    }, {});

    return res.json({
      settings: groupedSettings,
      flat: settings.map((s) => ({
        key: s.key,
        value: s.value,
        category: s.category,
        type: s.type,
        label: s.label,
        description: s.description,
        isPublic: s.isPublic,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a specific setting by key
 * GET /api/v1/admin/settings/:key
 */
export const getSetting = async (req, res, next) => {
  try {
    const { key } = req.params;

    const setting = await Settings.findOne({ key });

    if (!setting) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Setting with key '${key}' not found`,
        },
      });
    }

    return res.json({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      type: setting.type,
      label: setting.label,
      description: setting.description,
      isPublic: setting.isPublic,
      updatedAt: setting.updatedAt,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create or update settings (bulk)
 * PUT /api/v1/admin/settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    const { userId } = req.auth;

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Settings must be an array",
        },
      });
    }

    const results = [];
    const errors = [];

    for (const setting of settings) {
      try {
        const { key, value, category, type, label, description, isPublic, isEncrypted } = setting;

        if (!key) {
          errors.push({ key: key || "unknown", error: "Key is required" });
          continue;
        }

        // Validate value based on type
        const validatedValue = validateSettingValue(value, type || "string");

        if (validatedValue === null) {
          errors.push({ key, error: `Invalid value type for ${type || "string"}` });
          continue;
        }

        // Automatically set isPublic to true for social media settings and contact info
        const finalCategory = category || "general";
        const isContactInfo = key === "site.contact.email" || key === "site.contact.phone";
        const shouldBePublic = isPublic !== undefined 
          ? isPublic 
          : (finalCategory === "social" || key.startsWith("social.") || isContactInfo);

        // Update or create setting
        const updatedSetting = await Settings.findOneAndUpdate(
          { key },
          {
            value: validatedValue,
            category: finalCategory,
            type: type || inferType(validatedValue),
            label: label || null,
            description: description || null,
            isPublic: shouldBePublic,
            isEncrypted: isEncrypted || false,
            updatedBy: userId,
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

        results.push({
          key: updatedSetting.key,
          value: updatedSetting.value,
          category: updatedSetting.category,
          type: updatedSetting.type,
        });
      } catch (error) {
        errors.push({ key: setting.key || "unknown", error: error.message });
      }
    }

    // Clear settings cache after update
    clearSettingsCache();

    return res.json({
      success: true,
      updated: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update a single setting
 * PATCH /api/v1/admin/settings/:key
 */
export const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, category, type, label, description, isPublic, isEncrypted } = req.body;
    const { userId } = req.auth;

    const setting = await Settings.findOne({ key });

    if (!setting) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Setting with key '${key}' not found`,
        },
      });
    }

    // Validate value if provided
    if (value !== undefined) {
      const validatedValue = validateSettingValue(value, type || setting.type);
      if (validatedValue === null) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid value type for ${type || setting.type}`,
          },
        });
      }
      setting.value = validatedValue;
    }

    if (category) setting.category = category;
    if (type) setting.type = type;
    if (label !== undefined) setting.label = label;
    if (description !== undefined) setting.description = description;
    
    // Automatically set isPublic to true for social media settings and contact info
    const isContactInfo = setting.key === "site.contact.email" || setting.key === "site.contact.phone";
    if (isPublic !== undefined) {
      setting.isPublic = isPublic;
    } else if (setting.category === "social" || setting.key.startsWith("social.") || isContactInfo) {
      setting.isPublic = true;
    }
    
    if (isEncrypted !== undefined) setting.isEncrypted = isEncrypted;
    setting.updatedBy = userId;

    await setting.save();

    // Clear settings cache after update
    clearSettingsCache();

    return res.json({
      success: true,
      setting: {
        key: setting.key,
        value: setting.value,
        category: setting.category,
        type: setting.type,
        label: setting.label,
        description: setting.description,
        isPublic: setting.isPublic,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a setting
 * DELETE /api/v1/admin/settings/:key
 */
export const deleteSetting = async (req, res, next) => {
  try {
    const { key } = req.params;

    const setting = await Settings.findOneAndDelete({ key });

    if (!setting) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Setting with key '${key}' not found`,
        },
      });
    }

    // Clear settings cache after deletion
    clearSettingsCache();

    return res.json({
      success: true,
      message: `Setting '${key}' deleted successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get settings by category
 * GET /api/v1/admin/settings/category/:category
 */
export const getSettingsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const validCategories = ["general", "email", "payment", "features", "maintenance", "social", "seo"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        },
      });
    }

    const settings = await Settings.find({ category }).sort({ key: 1 });

    return res.json({
      category,
      settings: settings.map((s) => ({
        key: s.key,
        value: s.value,
        type: s.type,
        label: s.label,
        description: s.description,
        isPublic: s.isPublic,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Initialize default settings
 * POST /api/v1/admin/settings/initialize
 */
export const initializeDefaultSettings = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    const defaultSettings = [
      // General Settings
      { key: "site.name", value: "Digital AELA", category: "general", type: "string", label: "Site Name", description: "The name of the platform" },
      { key: "site.description", value: "Learn, Earn, and Grow", category: "general", type: "string", label: "Site Description", description: "Platform description" },
      { key: "site.logo", value: "", category: "general", type: "string", label: "Site Logo URL", description: "URL to the site logo" },
      { key: "site.contact.email", value: "info@digitalaela.com", category: "general", type: "string", label: "Contact Email", description: "Main contact email address", isPublic: true },
      { key: "site.contact.phone", value: "+971 502270625", category: "general", type: "string", label: "Contact Phone", description: "Main contact phone number", isPublic: true },
      { key: "site.address", value: "", category: "general", type: "string", label: "Site Address", description: "Physical address of the organization" },

      // Email Settings
      { key: "email.from.name", value: "Digital AELA", category: "email", type: "string", label: "Email From Name", description: "Name shown in email sender" },
      { key: "email.from.address", value: "noreply@digitalaela.com", category: "email", type: "string", label: "Email From Address", description: "Email address for sending emails" },
      { key: "email.smtp.host", value: "", category: "email", type: "string", label: "SMTP Host", description: "SMTP server hostname", isEncrypted: false },
      { key: "email.smtp.port", value: 587, category: "email", type: "number", label: "SMTP Port", description: "SMTP server port" },
      { key: "email.smtp.secure", value: false, category: "email", type: "boolean", label: "SMTP Secure", description: "Use secure connection (TLS/SSL)" },
      { key: "email.smtp.user", value: "", category: "email", type: "string", label: "SMTP Username", description: "SMTP authentication username", isEncrypted: true },
      { key: "email.smtp.password", value: "", category: "email", type: "string", label: "SMTP Password", description: "SMTP authentication password", isEncrypted: true },

      // Payment Settings
      { key: "payment.currency", value: "AED", category: "payment", type: "string", label: "Default Currency", description: "Default currency for payments" },
      { key: "payment.gateway.stripe.enabled", value: false, category: "payment", type: "boolean", label: "Stripe Enabled", description: "Enable Stripe payment gateway" },
      { key: "payment.gateway.stripe.publicKey", value: "", category: "payment", type: "string", label: "Stripe Public Key", description: "Stripe publishable key", isEncrypted: true },
      { key: "payment.gateway.stripe.secretKey", value: "", category: "payment", type: "string", label: "Stripe Secret Key", description: "Stripe secret key", isEncrypted: true },
      { key: "payment.gateway.paypal.enabled", value: false, category: "payment", type: "boolean", label: "PayPal Enabled", description: "Enable PayPal payment gateway" },
      { key: "payment.gateway.paypal.clientId", value: "", category: "payment", type: "string", label: "PayPal Client ID", description: "PayPal client ID", isEncrypted: true },
      { key: "payment.gateway.paypal.secret", value: "", category: "payment", type: "string", label: "PayPal Secret", description: "PayPal client secret", isEncrypted: true },
      { key: "payment.gateway.razorpay.enabled", value: false, category: "payment", type: "boolean", label: "Razorpay Enabled", description: "Enable Razorpay payment gateway" },
      { key: "payment.gateway.razorpay.keyId", value: "", category: "payment", type: "string", label: "Razorpay Key ID", description: "Razorpay key ID (public key)", isEncrypted: true },
      { key: "payment.gateway.razorpay.keySecret", value: "", category: "payment", type: "string", label: "Razorpay Key Secret", description: "Razorpay key secret (private key)", isEncrypted: true },
      { key: "payment.gateway.razorpay.webhookSecret", value: "", category: "payment", type: "string", label: "Razorpay Webhook Secret", description: "Razorpay webhook secret for signature verification", isEncrypted: true },

      // Feature Flags (marked as public so frontend can check them)
      { key: "features.courses.enabled", value: true, category: "features", type: "boolean", label: "Courses Enabled", description: "Enable course functionality", isPublic: true },
      { key: "features.jobs.enabled", value: true, category: "features", type: "boolean", label: "Jobs Enabled", description: "Enable job portal functionality", isPublic: true },
      { key: "features.blog.enabled", value: true, category: "features", type: "boolean", label: "Blog Enabled", description: "Enable blog functionality", isPublic: true },
      { key: "features.ebooks.enabled", value: true, category: "features", type: "boolean", label: "Ebooks Enabled", description: "Enable ebook functionality", isPublic: true },
      { key: "features.quizzes.enabled", value: true, category: "features", type: "boolean", label: "Quizzes Enabled", description: "Enable quiz functionality", isPublic: true },
      { key: "features.points.enabled", value: true, category: "features", type: "boolean", label: "Points System Enabled", description: "Enable points/rewards system", isPublic: true },
      { key: "features.messaging.enabled", value: true, category: "features", type: "boolean", label: "Messaging Enabled", description: "Enable messaging functionality", isPublic: true },

      // Maintenance
      { key: "maintenance.enabled", value: false, category: "maintenance", type: "boolean", label: "Maintenance Mode", description: "Enable maintenance mode" },
      { key: "maintenance.message", value: "We are currently performing maintenance. Please check back soon.", category: "maintenance", type: "string", label: "Maintenance Message", description: "Message shown during maintenance" },

      // Social Media (marked as public so they can be accessed without authentication)
      { key: "social.facebook", value: "", category: "social", type: "string", label: "Facebook URL", description: "Facebook page URL", isPublic: true },
      { key: "social.twitter", value: "", category: "social", type: "string", label: "Twitter URL", description: "Twitter profile URL", isPublic: true },
      { key: "social.linkedin", value: "", category: "social", type: "string", label: "LinkedIn URL", description: "LinkedIn page URL", isPublic: true },
      { key: "social.instagram", value: "", category: "social", type: "string", label: "Instagram URL", description: "Instagram profile URL", isPublic: true },
      { key: "social.youtube", value: "", category: "social", type: "string", label: "YouTube URL", description: "YouTube channel URL", isPublic: true },

      // SEO Settings
      { key: "seo.meta.title", value: "Digital AELA - Learn, Earn, and Grow", category: "seo", type: "string", label: "Meta Title", description: "Default meta title for SEO" },
      { key: "seo.meta.description", value: "Digital AELA platform for learning and career growth", category: "seo", type: "string", label: "Meta Description", description: "Default meta description for SEO" },
      { key: "seo.meta.keywords", value: "learning, courses, jobs, career", category: "seo", type: "string", label: "Meta Keywords", description: "Default meta keywords for SEO" },
    ];

    const results = [];
    const errors = [];

    for (const settingData of defaultSettings) {
      try {
        const existing = await Settings.findOne({ key: settingData.key });
        if (!existing) {
          const setting = new Settings({
            ...settingData,
            updatedBy: userId,
          });
          await setting.save();
          results.push(settingData.key);
        } else {
          // Update existing social media settings to ensure they're public
          if (settingData.category === "social" || settingData.key?.startsWith("social.")) {
            if (!existing.isPublic) {
              existing.isPublic = true;
              existing.updatedBy = userId;
              await existing.save();
              results.push(settingData.key + " (updated to public)");
            }
          }
          // Update existing feature flags to ensure they're public
          if (settingData.category === "features" || settingData.key?.startsWith("features.")) {
            if (settingData.isPublic && !existing.isPublic) {
              existing.isPublic = true;
              existing.updatedBy = userId;
              await existing.save();
              results.push(settingData.key + " (updated to public)");
            }
          }
        }
      } catch (error) {
        errors.push({ key: settingData.key, error: error.message });
      }
    }

    // Clear settings cache after initialization
    clearSettingsCache();

    return res.json({
      success: true,
      initialized: results.length,
      created: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Helper function to validate setting value based on type
 */
function validateSettingValue(value, type) {
  switch (type) {
    case "string":
      return typeof value === "string" ? value : String(value);
    case "number":
      const num = Number(value);
      return !isNaN(num) ? num : null;
    case "boolean":
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
      }
      return Boolean(value);
    case "object":
      return typeof value === "object" && !Array.isArray(value) ? value : null;
    case "array":
      return Array.isArray(value) ? value : null;
    default:
      return value;
  }
}

/**
 * Helper function to infer type from value
 */
function inferType(value) {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value !== null) return "object";
  return "string";
}

/**
 * Verify Financial Password
 * POST /api/v1/admin/settings/financial-password/verify
 */
export const verifyFinancialPassword = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can verify financial password",
        },
      });
    }

    if (!password) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password is required",
        },
      });
    }

    // Get financial password from settings
    const financialPasswordSetting = await Settings.findOne({
      key: "financial.password",
    }).lean();

    if (!financialPasswordSetting) {
      // If no password is set, return false (need to set password first)
      return res.json({
        valid: false,
        message: "Financial password not configured",
      });
    }

    // Compare password with stored hash
    const isValid = await bcrypt.compare(password, financialPasswordSetting.value);

    return res.json({
      valid: isValid,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Set Financial Password
 * POST /api/v1/admin/settings/financial-password/set
 */
export const setFinancialPassword = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can set financial password",
        },
      });
    }

    if (!password || password.length < 6) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 6 characters long",
        },
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update or create financial password setting
    await Settings.findOneAndUpdate(
      { key: "financial.password" },
      {
        value: passwordHash,
        category: "general",
        type: "string",
        label: "Financial Password",
        description: "Password required to access financial pages (payments, expenses, financial dashboard)",
        isEncrypted: true,
        updatedBy: userId,
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Clear settings cache
    clearSettingsCache();

    return res.json({
      success: true,
      message: "Financial password has been set successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Request Financial Password Reset
 * POST /api/v1/admin/settings/financial-password/request-reset
 */
export const requestFinancialPasswordReset = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can request financial password reset",
        },
      });
    }

    // Get admin user details
    const adminUser = await User.findById(userId).select("email fullName").lean();
    if (!adminUser) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Admin user not found",
        },
      });
    }

    // Generate reset token
    const token = FinancialPasswordResetToken.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete any existing reset tokens for this user
    await FinancialPasswordResetToken.deleteMany({ user: userId });

    // Create new reset token
    await FinancialPasswordResetToken.create({
      user: userId,
      token,
      expiresAt,
    });

    // Send password reset email to info.digitalaela@gmail.com
    const recipientEmail = "info.digitalaela@gmail.com";
    try {
      await sendFinancialPasswordResetEmail(recipientEmail, token, adminUser.fullName);
    } catch (emailError) {
      // Log error but don't fail the request
      console.error("Failed to send financial password reset email:", emailError);
      // In production, you might want to queue this for retry
    }

    return res.status(200).json({
      success: true,
      message: "Financial password reset email has been sent to info.digitalaela@gmail.com",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Verify Financial Password Reset Token
 * GET /api/v1/admin/settings/financial-password/verify-token?token=xxx
 */
export const verifyFinancialPasswordToken = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Token is required",
        },
      });
    }

    // Find valid token
    const resetToken = await FinancialPasswordResetToken.findValidToken(token);

    if (!resetToken) {
      return res.status(400).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired reset token. Please request a new financial password reset.",
        },
      });
    }

    return res.json({
      valid: true,
      message: "Token is valid",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Reset Financial Password with Token
 * POST /api/v1/admin/settings/financial-password/reset
 */
export const resetFinancialPasswordWithToken = async (req, res, next) => {
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

    // Find valid token
    const resetToken = await FinancialPasswordResetToken.findValidToken(token);

    if (!resetToken) {
      return res.status(400).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired reset token. Please request a new financial password reset.",
        },
      });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update or create financial password setting
    await Settings.findOneAndUpdate(
      { key: "financial.password" },
      {
        value: passwordHash,
        category: "general",
        type: "string",
        label: "Financial Password",
        description: "Password required to access financial pages (payments, expenses, financial dashboard)",
        isEncrypted: true,
        updatedBy: resetToken.user._id,
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Mark token as used
    await resetToken.markAsUsed();

    // Delete all other reset tokens for this user
    await FinancialPasswordResetToken.deleteMany({
      user: resetToken.user._id,
      _id: { $ne: resetToken._id },
    });

    // Clear settings cache
    clearSettingsCache();

    return res.json({
      success: true,
      message: "Financial password has been reset successfully",
    });
  } catch (error) {
    return next(error);
  }
};

