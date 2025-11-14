import { apiRequest, persistTokens } from "./baseClient";

export const registerUserAccount = async ({ email, password, fullName, role = "student" }) => {
  const result = await apiRequest("/auth/register", {
    method: "POST",
    body: { email, password, fullName, role },
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

