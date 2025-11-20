import { verifyAccessToken } from "../utils/token.js";
import User from "../models/User.js";

export const requireAuth = (roles = []) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Access token missing" },
      });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "User not found" },
      });
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      });
    }

    // Ensure userId is always a string
    const userIdString = user._id ? user._id.toString() : (user.id ? user.id.toString() : null);
    
    if (!userIdString) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Invalid user ID" },
      });
    }

    req.auth = {
      userId: userIdString,
      userRole: user.role,
      userFullName: user.fullName,
      email: user.email,
    };

    return next();
  } catch (error) {
    // If token verification fails, return 401
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Invalid or expired token. Please log in again." },
      });
    }
    return next(error);
  }
};

/**
 * Alias for requireAuth with no role restrictions
 * Used for routes that require authentication but don't need specific roles
 */
export const authenticate = requireAuth([]);

/**
 * Optional authentication middleware
 * Sets req.auth if token is valid, but doesn't fail if token is missing
 * Useful for public endpoints that can work with or without authentication
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      // No token provided - continue without auth
      req.auth = null;
      return next();
    }

    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      
      if (user) {
        // Ensure userId is always a string
        const userIdString = user._id ? user._id.toString() : (user.id ? user.id.toString() : null);
        
        if (userIdString) {
          req.auth = {
            userId: userIdString,
            userRole: user.role,
            userFullName: user.fullName,
            email: user.email,
          };
        } else {
          req.auth = null;
        }
      } else {
        req.auth = null;
      }
    } catch (tokenError) {
      // Invalid or expired token - continue without auth
      req.auth = null;
    }

    return next();
  } catch (error) {
    // On any error, continue without auth
    req.auth = null;
    return next();
  }
};

