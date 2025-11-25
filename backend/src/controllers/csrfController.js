import CsrfToken from "../models/CsrfToken.js";

/**
 * Get CSRF Token
 * GET /api/v1/csrf-token
 * Returns CSRF token for authenticated user
 */
export const getCsrfToken = async (req, res, next) => {
  try {
    const { userId, token: accessToken } = req.auth || {};

    if (!userId || !accessToken) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required to get CSRF token",
        },
      });
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

    return res.json({
      csrfToken: csrfToken.token,
      expiresAt: csrfToken.expiresAt,
    });
  } catch (error) {
    return next(error);
  }
};

