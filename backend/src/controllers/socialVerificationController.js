import mongoose from "mongoose";
import StudentProfile from "../models/StudentProfile.js";
import StudentPoints from "../models/StudentPoints.js";

/**
 * Add or update a social link (without verification)
 */
export const addSocialLink = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please log in again.",
        },
      });
    }

    const { platform, url } = req.body;

    if (!platform || !url) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Platform and URL are required",
        },
      });
    }

    // Validate platform
    const validPlatforms = ["LinkedIn", "YouTube", "Instagram", "TikTok", "Twitter", "Facebook", "GitHub", "Website"];
    if (!validPlatforms.includes(platform)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}`,
        },
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid URL format",
        },
      });
    }

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!studentObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Get or create student profile
    let studentProfile = await StudentProfile.findOne({ user: studentObjectId });

    if (!studentProfile) {
      studentProfile = await StudentProfile.create({
        user: studentObjectId,
        socialLinks: [],
      });
    }

    // Define bonus coins for each platform
    const platformBonuses = {
      LinkedIn: 250,
      YouTube: 200,
      Instagram: 120,
      TikTok: 90,
      Twitter: 100,
      Facebook: 80,
      GitHub: 150,
      Website: 100,
    };

    const bonusCoins = platformBonuses[platform] || 50;

    // Check if link already exists for this platform
    const existingLinkIndex = studentProfile.socialLinks.findIndex(
      (link) => link.platform === platform
    );

    if (existingLinkIndex >= 0) {
      // Update existing link (reset verification if URL changed)
      const existingLink = studentProfile.socialLinks[existingLinkIndex];
      const urlChanged = existingLink.url !== url;
      
      studentProfile.socialLinks[existingLinkIndex] = {
        platform,
        url,
        verified: urlChanged ? false : existingLink.verified, // Reset verification if URL changed
        verifiedAt: urlChanged ? undefined : existingLink.verifiedAt,
        bonus: bonusCoins,
      };
    } else {
      // Add new link
      studentProfile.socialLinks.push({
        platform,
        url,
        verified: false,
        bonus: bonusCoins,
      });
    }

    await studentProfile.save();

    return res.json({
      success: true,
      message: `${platform} link ${existingLinkIndex >= 0 ? "updated" : "added"} successfully`,
      socialLink: studentProfile.socialLinks.find((link) => link.platform === platform),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a social link
 */
export const deleteSocialLink = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. User ID is required.",
        },
      });
    }

    const { platform } = req.params;

    if (!platform) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Platform is required",
        },
      });
    }

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!studentObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const studentProfile = await StudentProfile.findOne({ user: studentObjectId });

    if (!studentProfile) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Student profile not found",
        },
      });
    }

    // Remove the link
    studentProfile.socialLinks = studentProfile.socialLinks.filter(
      (link) => link.platform !== platform
    );

    await studentProfile.save();

    return res.json({
      success: true,
      message: `${platform} link deleted successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Verify a social link and award bonus coins
 * In a real implementation, this would verify the link by:
 * - Checking if the URL is valid
 * - Verifying ownership (e.g., OAuth, meta tag verification, etc.)
 * For now, we'll just mark it as verified and award coins
 */
export const verifySocialLink = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. User ID is required.",
        },
      });
    }

    const { platform } = req.body;

    if (!platform) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Platform is required",
        },
      });
    }

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!studentObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Get student profile
    const studentProfile = await StudentProfile.findOne({ user: studentObjectId });

    if (!studentProfile) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Student profile not found. Please add a social link first.",
        },
      });
    }

    // Find the link
    const existingLink = studentProfile.socialLinks.find(
      (link) => link.platform === platform
    );

    if (!existingLink) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: `${platform} link not found. Please add it first.`,
        },
      });
    }

    if (existingLink.verified) {
      return res.status(409).json({
        error: {
          code: "ALREADY_VERIFIED",
          message: "This social link is already verified",
        },
      });
    }

    const bonusCoins = existingLink.bonus || 50;

    // In a real implementation, you would verify the link here
    // For now, we'll just mark it as verified
    // TODO: Implement actual verification (OAuth, meta tag check, etc.)

    // Mark as verified
    existingLink.verified = true;
    existingLink.verifiedAt = new Date();

    await studentProfile.save();

    // Award bonus coins
    let studentPoints = await StudentPoints.findOne({ student: studentObjectId });

    if (!studentPoints) {
      studentPoints = await StudentPoints.create({
        student: studentObjectId,
        totalCoins: bonusCoins,
        redeemedCoins: 0,
        transactions: [
          {
            type: "earned",
            amount: bonusCoins,
            reason: `Social verification: ${platform}`,
            createdAt: new Date(),
          },
        ],
      });
    } else {
      const newTotal = (studentPoints.totalCoins || 0) + bonusCoins;
      studentPoints.totalCoins = newTotal;
      studentPoints.transactions = studentPoints.transactions || [];
      studentPoints.transactions.push({
        type: "earned",
        amount: bonusCoins,
        reason: `Social verification: ${platform}`,
        createdAt: new Date(),
      });

      // Keep only last 100 transactions
      if (studentPoints.transactions.length > 100) {
        studentPoints.transactions = studentPoints.transactions.slice(-100);
      }

      await studentPoints.save();
    }

    return res.json({
      success: true,
      message: `${platform} link verified successfully`,
      verifiedLink: existingLink,
      points: {
        totalCoins: studentPoints.totalCoins,
        availableCoins: studentPoints.totalCoins - (studentPoints.redeemedCoins || 0),
        coinsAwarded: bonusCoins,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get verified social links for a student
 */
export const getSocialLinks = async (req, res, next) => {
  try {
    const userId = req.params?.userId || req.auth?.userId;
    
    if (!userId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User ID is required. Please provide userId in URL or ensure you are authenticated.",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const studentProfile = await StudentProfile.findOne({ user: userObjectId });

    if (!studentProfile) {
      return res.json({
        socialLinks: [],
      });
    }

    return res.json({
      socialLinks: studentProfile.socialLinks || [],
    });
  } catch (error) {
    return next(error);
  }
};
