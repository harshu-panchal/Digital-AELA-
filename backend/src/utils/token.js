import jwt from "jsonwebtoken";

const {
  JWT_SECRET = "change-me",
  JWT_EXPIRES_IN = "15m",
  JWT_REFRESH_SECRET = "change-me-refresh",
  JWT_REFRESH_EXPIRES_IN = "7d",
} = process.env;

export const generateAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const generateRefreshToken = (payload) =>
  jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

export const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);

export const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);

