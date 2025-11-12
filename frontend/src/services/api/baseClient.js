const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api/v1";

const TOKEN_STORAGE_KEY = "aela.auth.tokens";

const loadTokens = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getStoredTokens = () => loadTokens();

export const persistTokens = (tokens) => {
  if (typeof window === "undefined") return;
  if (!tokens) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
};

export const clearStoredTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const apiRequest = async (endpoint, { method = "GET", body, headers = {}, skipAuth = false } = {}) => {
  const tokens = loadTokens();
  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (!skipAuth && tokens?.accessToken) {
    finalHeaders.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      `Request to ${endpoint} failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code;
    error.details = payload;
    throw error;
  }

  return payload;
};

export const apiBaseConfig = {
  API_BASE_URL,
  TOKEN_STORAGE_KEY,
};

