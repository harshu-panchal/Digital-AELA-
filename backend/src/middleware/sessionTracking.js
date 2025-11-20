import Session from "../models/Session.js";
import { parseUserAgent } from "../utils/userAgentParser.js";

/**
 * Middleware to track user sessions and activity
 * This should be called after authentication middleware
 */
export const trackSession = async (req, res, next) => {
  try {
    const { userId, token } = req.auth || {};

    if (!userId || !token) {
      return next();
    }

    // Find or create session
    let session = await Session.findOne({ token, isActive: true });

    if (!session) {
      // Create new session
      const userAgent = req.get("user-agent") || "";
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "unknown";
      const parsedUA = parseUserAgent(userAgent);

      session = await Session.create({
        user: userId,
        token,
        ipAddress,
        userAgent,
        device: parsedUA.device,
        browser: parsedUA.browser,
        os: parsedUA.os,
        loginAt: new Date(),
        lastActivity: new Date(),
        isActive: true,
      });
    } else {
      // Update last activity (only if more than 1 minute has passed to reduce DB writes)
      const now = new Date();
      const timeSinceLastActivity = now - new Date(session.lastActivity);
      if (timeSinceLastActivity > 60000) { // 1 minute
        await session.updateActivity();
      }
    }

    // Attach session to request
    req.session = session;
  } catch (error) {
    // Don't block request if session tracking fails
    console.error("Session tracking error:", error);
  }

  next();
};

/**
 * Create session on login
 * Call this from login controller
 */
export const createSession = async (userId, token, req) => {
  try {
    const userAgent = req.get("user-agent") || "";
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "unknown";
    const parsedUA = parseUserAgent(userAgent);

    const session = await Session.create({
      user: userId,
      token,
      ipAddress,
      userAgent,
      device: parsedUA.device,
      browser: parsedUA.browser,
      os: parsedUA.os,
      loginAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
    });

    return session;
  } catch (error) {
    console.error("Session creation error:", error);
    return null;
  }
};

/**
 * Middleware to end session on logout
 */
export const endSession = async (req, res, next) => {
  try {
    const { token } = req.auth || {};

    if (token) {
      const session = await Session.findOne({ token, isActive: true });
      if (session) {
        await session.endSession();
      }
    }
  } catch (error) {
    console.error("Session end error:", error);
  }

  next();
};

