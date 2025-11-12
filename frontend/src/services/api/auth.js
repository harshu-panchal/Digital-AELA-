import { apiRequest, persistTokens } from "./baseClient";

export const registerRecruiterAccount = async ({ email, password, fullName }) => {
  const result = await apiRequest("/auth/register", {
    method: "POST",
    body: { email, password, fullName },
    skipAuth: true,
  });
  persistTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  return result;
};

export const loginRecruiterAccount = async ({ email, password }) => {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
  persistTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  return result;
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

