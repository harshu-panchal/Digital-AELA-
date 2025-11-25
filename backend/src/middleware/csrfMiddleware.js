import CsrfToken from "../models/CsrfToken.js";
import { verifyAccessToken } from "../utils/token.js";

/**
 * Generate CSRF token for authenticated user
 * This should be called after authentication middleware
 */
export const generateCsrfToken = async (req, res, next) => {
  try {
    const { userId, token: accessToken } = req.auth || {};

    if (!userId || !accessToken) {
      return next();
    }

    // Check if valid token already exists
    let csrfToken = await CsrfToken.findByAccessToken(accessToken);

    if (!csrfToken) {
      // Generate new CSRF token
      const token = CsrfToken.generateToken();
      csrfToken = await CsrfToken.create({
        user: userId,
        token,
        accessToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    }

    // Attach CSRF token to request
    req.csrfToken = csrfToken.token;

    // Add CSRF token to response header for frontend to read
    res.setHeader("X-CSRF-Token", csrfToken.token);

    return next();
  } catch (error) {
    // Don't block request if CSRF token generation fails
    // eslint-disable-next-line no-console
    console.error("[CSRF] Error generating token:", error);
    return next();
  }
};

/**
 * Validate CSRF token for state-changing operations
 * This should be applied to POST, PUT, DELETE, PATCH routes
 */
export const validateCsrfToken = async (req, res, next) => {
  try {
    const { userId, token: accessToken } = req.auth || {};

    // Skip CSRF validation for unauthenticated requests
    if (!userId || !accessToken) {
      return next();
    }

    // Get CSRF token from header or body
    const csrfToken =
      req.headers["x-csrf-token"] ||
      req.headers["csrf-token"] ||
      req.body?.csrfToken ||
      req.query?.csrfToken;

    if (!csrfToken) {
      return res.status(403).json({
        error: {
          code: "CSRF_TOKEN_MISSING",
          message: "CSRF token is required for this operation",
        },
      });
    }

    // Find and validate CSRF token
    const tokenDoc = await CsrfToken.findOne({
      token: csrfToken,
      accessToken,
      user: userId,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(403).json({
        error: {
          code: "CSRF_TOKEN_INVALID",
          message: "Invalid or expired CSRF token. Please refresh the page and try again.",
        },
      });
    }

    // Token is valid, continue
    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[CSRF] Error validating token:", error);
    return res.status(500).json({
      error: {
        code: "CSRF_VALIDATION_ERROR",
        message: "Error validating CSRF token",
      },
    });
  }
};

/**
 * Optional CSRF validation - only validates if token is provided
 * Useful for endpoints that can work with or without CSRF protection
 */
export const optionalCsrfValidation = async (req, res, next) => {
  try {
    const { userId, token: accessToken } = req.auth || {};

    // Skip if not authenticated
    if (!userId || !accessToken) {
      return next();
    }

    // Get CSRF token
    const csrfToken =
      req.headers["x-csrf-token"] ||
      req.headers["csrf-token"] ||
      req.body?.csrfToken ||
      req.query?.csrfToken;

    // If no token provided, skip validation
    if (!csrfToken) {
      return next();
    }

    // Validate if token is provided
    const tokenDoc = await CsrfToken.findOne({
      token: csrfToken,
      accessToken,
      user: userId,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(403).json({
        error: {
          code: "CSRF_TOKEN_INVALID",
          message: "Invalid or expired CSRF token",
        },
      });
    }

    return next();
  } catch (error) {
    // Don't block request on optional validation error
    return next();
  }
};

/**
 * Cleanup expired CSRF tokens (call this periodically via cron)
 */
export const cleanupExpiredCsrfTokens = async () => {
  try {
    const result = await CsrfToken.cleanupExpired();
    // eslint-disable-next-line no-console
    console.log(`[CSRF] Cleaned up ${result.deletedCount} expired tokens`);
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[CSRF] Error cleaning up expired tokens:", error);
    return null;
  }
};

