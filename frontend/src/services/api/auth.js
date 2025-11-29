import { apiRequest, persistTokens } from "./baseClient";

export const registerUserAccount = async ({ email, password, fullName, role = "student", profile }) => {
  const result = await apiRequest("/auth/register", {
    method: "POST",
    body: { email, password, fullName, role, profile },
    skipAuth: true,
  });
  persistTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  return result;
};

export const loginUserAccount = async ({ email, password, role }) => {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password, role },
    skipAuth: true,
  });
  persistTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  return result;
};

// Keep recruiter-specific functions for backward compatibility
export const registerRecruiterAccount = async ({ email, password, fullName }) => {
  return registerUserAccount({ email, password, fullName, role: "recruiter" });
};

export const loginRecruiterAccount = async ({ email, password }) => {
  return loginUserAccount({ email, password, role: "recruiter" });
};

export const refreshRecruiterSession = async (refreshToken) => {
  const result = await apiRequest("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    skipAuth: true,
  });
  persistTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  return result;
};

export const logoutRecruiterAccount = async () => {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
  } catch {
    // ignore logout errors (user might already be logged out server-side)
  } finally {
    persistTokens(null);
  }
};

// ==================== Password Reset Functions ====================

/**
 * Request password reset (forgot password)
 * POST /api/v1/auth/forgot-password
 */
export const requestPasswordReset = async (email) => {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email },
    skipAuth: true,
  });
};

/**
 * Reset password with token
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (token, newPassword) => {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
    skipAuth: true,
  });
};

// ==================== Email Verification Functions ====================

/**
 * Verify email with token
 * GET /api/v1/auth/verify-email?token=xxx
 */
export const verifyEmail = async (token) => {
  return apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
    skipAuth: true,
  });
};

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification
 */
export const resendVerificationEmail = async (email) => {
  return apiRequest("/auth/resend-verification", {
    method: "POST",
    body: { email },
    skipAuth: true,
  });
};

