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

    req.auth = {
      userId: user.id,
      userRole: user.role,
      userFullName: user.fullName,
      email: user.email,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

