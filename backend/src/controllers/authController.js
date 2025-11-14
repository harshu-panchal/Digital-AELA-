import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";

const buildAuthResponse = (user) => {
  const payload = {
    sub: user.id,
    role: user.role,
    email: user.email,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: {
      id: user.id,
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
    if (!email || !password || !fullName) {
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

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "An account with this email already exists",
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      fullName,
      role,
    });

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
    const query = { email };
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

