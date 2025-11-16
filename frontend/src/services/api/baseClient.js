const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api/v1";

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

let authUpdateHandler = null;
let refreshPromise = null;

export const registerAuthUpdateHandler = (handler) => {
  authUpdateHandler = handler;
};

const notifyAuthUpdate = (payload) => {
  if (typeof authUpdateHandler === "function") {
    authUpdateHandler(payload);
  }
};

const refreshTokensIfNeeded = async (currentTokens) => {
  if (!currentTokens?.refreshToken) {
    throw new Error("Missing refresh token");
  }

  if (!refreshPromise) {
    refreshPromise = import("./auth")
      .then(({ refreshRecruiterSession }) => refreshRecruiterSession(currentTokens.refreshToken))
      .then((result) => {
        notifyAuthUpdate(result);
        return result;
      })
      .catch((error) => {
        clearStoredTokens();
        notifyAuthUpdate(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiRequest = async (
  endpoint,
  { method = "GET", body, headers = {}, skipAuth = false, _retry = false } = {}
) => {
  const tokens = loadTokens();
  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (!skipAuth && tokens?.accessToken) {
    finalHeaders.Authorization = `Bearer ${tokens.accessToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // Handle network errors (connection refused, network unavailable, etc.)
    const isConnectionError =
      networkError.message?.includes("Failed to fetch") ||
      networkError.message?.includes("NetworkError") ||
      networkError.name === "TypeError";
    
    if (isConnectionError) {
      const connectionError = new Error(
        `Unable to connect to server. Please ensure the backend server is running.`
      );
      connectionError.status = 0;
      connectionError.code = "CONNECTION_ERROR";
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw networkError;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.ok) {
    return payload;
  }

  if (!skipAuth && response.status === 401 && tokens?.refreshToken && !_retry) {
    try {
      await refreshTokensIfNeeded(tokens);
      return apiRequest(endpoint, {
        method,
        body,
        headers,
        skipAuth,
        _retry: true,
      });
    } catch (error) {
      const message =
        payload?.error?.message ??
        error.message ??
        `Request to ${endpoint} failed with status ${response.status}`;
      const unauthorizedError = new Error(message);
      unauthorizedError.status = response.status;
      unauthorizedError.code = payload?.error?.code ?? error.code;
      unauthorizedError.details = payload ?? error.details;
      throw unauthorizedError;
    }
  }

  const message =
    payload?.error?.message ?? `Request to ${endpoint} failed with status ${response.status}`;
  const error = new Error(message);
  error.status = response.status;
  error.code = payload?.error?.code;
  error.details = payload;
  throw error;
};

/**
 * Check if an error is a network/connection error
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's a network error
 */
export const isNetworkError = (error) => {
  return (
    error?.isNetworkError === true ||
    error?.code === "CONNECTION_ERROR" ||
    error?.status === 0 ||
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("Unable to connect to server") ||
    error?.name === "TypeError"
  );
};

export const apiBaseConfig = {
  API_BASE_URL,
  TOKEN_STORAGE_KEY,
};

