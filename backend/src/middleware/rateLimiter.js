import rateLimit from "express-rate-limit";
import { ipKeyGenerator } from "express-rate-limit";
import { verifyAccessToken } from "../utils/token.js";

const getAuthenticatedRateLimitKey = (req, prefix) => {
  const { userId } = req.auth || {};
  if (userId) {
    return `${prefix}:${userId}`;
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      if (payload?.sub) {
        return `${prefix}:${payload.sub}`;
      }
    } catch {
      // Invalid or expired tokens should fall back to IP-based limiting.
    }
  }

  return ipKeyGenerator(req);
};

/* ✅ Global Rate Limiter */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req)
});

/* ✅ Auth Limiter */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => ipKeyGenerator(req)
});

/* ✅ API Limiter */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => ipKeyGenerator(req)
});

/**
 * Rate limiter for login attempts
 * Limits: 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many login attempts. Please try again after 15 minutes.",
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use IP address as key
  keyGenerator: (req) => ipKeyGenerator(req),
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many login attempts. Please try again after 15 minutes.",
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000), // seconds until reset
      },
    });
  },
});

/**
 * Rate limiter for payment attempts
 * Limits: 30 attempts per 15 minutes per IP/user
 * More lenient to allow for retries and legitimate payment flows
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (shorter window for better UX)
  max: 30, // Limit each IP/user to 30 payment attempts per 15 minutes
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many payment attempts. Please try again after a few minutes.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP address or user ID as key (prefer user ID if authenticated)
  keyGenerator: (req) => {
    return getAuthenticatedRateLimitKey(req, "payment");
  },
  handler: (req, res) => {
    const retryAfterSeconds = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
    res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: `Too many payment attempts. Please try again in ${retryAfterMinutes} minute${retryAfterMinutes !== 1 ? 's' : ''}.`,
        retryAfter: retryAfterSeconds,
      },
    });
  },
});

/**
 * General API rate limiter
 * Limits: 100 requests per minute per IP/user
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP/user to 100 requests per minute
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please slow down.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP address or user ID as key (prefer user ID if authenticated)
  keyGenerator: (req) => {
    return getAuthenticatedRateLimitKey(req, "api");
  },
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please slow down.",
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      },
    });
  },
  // Skip rate limiting for successful requests (optional optimization)
  skip: (req) => {
    // Don't count successful GET requests in rate limit (optional)
    // You can customize this based on your needs
    return false;
  },
});

/**
 * Strict rate limiter for sensitive operations
 * Limits: 3 attempts per 15 minutes per IP/user
 * Use for: Password reset, email verification, etc.
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP/user to 3 attempts per 15 minutes
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many attempts. Please try again after 15 minutes.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return getAuthenticatedRateLimitKey(req, "strict");
  },
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many attempts. Please try again after 15 minutes.",
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      },
    });
  },
});

/**
 * Rate limiter for password reset requests
 * Limits: 3 attempts per hour per email
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each email to 3 password reset requests per hour
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many password reset requests. Please try again after 1 hour.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use email from request body as key
  keyGenerator: (req) => {
    const email = req.body?.email || req.query?.email;
    if (email) {
      return `password-reset:${email.toLowerCase().trim()}`;
    }
    return ipKeyGenerator(req);
  },
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many password reset requests. Please try again after 1 hour.",
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      },
    });
  },
});

/**
 * Rate limiter for registration attempts
 * Limits: 5 registrations per hour per IP
 */
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registrations per hour
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many registration attempts. Please try again after 1 hour.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many registration attempts. Please try again after 1 hour.",
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      },
    });
  },
});

