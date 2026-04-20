import { verifyAccessToken } from "../utils/token.js";
import User from "../models/User.js";

export const normalizeRoleName = (role) => {
  if (role === "branch-owner") return "branch_owner";
  return role;
};

export const isAdminRole = (role) => {
  const normalizedRole = normalizeRoleName(role);
  return normalizedRole === "admin" || normalizedRole === "super-admin";
};

export const authorizeRoles = (...roles) => {
  const allowedRoles = roles.flat().map(normalizeRoleName);

  return (req, res, next) => {
    const currentRole = normalizeRoleName(req.auth?.userRole);
    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      });
    }
    return next();
  };
};

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

    const normalizedUserRole = normalizeRoleName(user.role);
    const normalizedRoles = roles.map(normalizeRoleName);

    if (normalizedRoles.length > 0 && !normalizedRoles.includes(normalizedUserRole)) {
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
      userRole: normalizedUserRole,
      userFullName: user.fullName,
      email: user.email,
      branchId: user.branchId ? user.branchId.toString() : null,
      approvalStatus: user.approvalStatus || "approved",
      token: token,
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

      if (payload?.sub) {
        const user = await User.findById(payload.sub).select(
          "role email branchId approvalStatus"
        );
        req.auth = {
          userId: payload.sub.toString(),
          userRole: normalizeRoleName(user?.role || payload.role),
          email: user?.email || payload.email,
          branchId: user?.branchId ? user.branchId.toString() : null,
          approvalStatus: user?.approvalStatus || "approved",
        };
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

