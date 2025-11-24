import { API_BASE_URL } from "../../config/api.js";

const TOKEN_STORAGE_KEY = "aela.auth.tokens";

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

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

export const notifyAuthUpdate = (payload) => {
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
  
  // Check if body is FormData
  const isFormData = body instanceof FormData;
  
  // Build headers - don't set Content-Type for FormData (browser will set it with boundary)
  const finalHeaders = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...headers,
  };

  if (!skipAuth && tokens?.accessToken) {
    finalHeaders.Authorization = `Bearer ${tokens.accessToken}`;
  }

  // Prepare body - use FormData as-is, or stringify JSON
  const requestBody = isFormData ? body : (body ? JSON.stringify(body) : undefined);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: finalHeaders,
      body: requestBody,
    });
  } catch (networkError) {
    // Handle network errors (connection refused, network unavailable, CORS, etc.)
    const isConnectionError =
      networkError.message?.includes("Failed to fetch") ||
      networkError.message?.includes("NetworkError") ||
      networkError.message?.includes("CORS") ||
      networkError.name === "TypeError";
    
    if (isConnectionError) {
      const connectionError = new Error(
        `Unable to connect to server. The backend server may be down or unreachable.`
      );
      connectionError.status = 0;
      connectionError.code = "CONNECTION_ERROR";
      connectionError.isNetworkError = true;
      connectionError.isCorsError = networkError.message?.includes("CORS") || false;
      
      // Log connection errors in production to help debug API issues
      if (!isDevelopment) {
        console.error("[API] Connection error:", {
          endpoint,
          method,
          apiUrl: API_BASE_URL,
          error: networkError.message,
          isCors: connectionError.isCorsError,
          hint: "Check if VITE_API_URL is set correctly in production environment"
        });
      }
      
      throw connectionError;
    }
    throw networkError;
  }

  // Handle 502 Bad Gateway (server down or proxy error)
  if (response.status === 502) {
    const badGatewayError = new Error(
      `Backend server is temporarily unavailable (502 Bad Gateway). The server may be starting up or experiencing issues.`
    );
    badGatewayError.status = 502;
    badGatewayError.code = "BAD_GATEWAY";
    badGatewayError.isNetworkError = true;
    
    // Log 502 errors in production
    if (!isDevelopment) {
      console.error("[API] Bad Gateway (502):", {
        endpoint,
        method,
        apiUrl: API_BASE_URL,
        hint: "Backend server may be down or restarting"
      });
    }
    
    throw badGatewayError;
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
      // If token refresh fails, clear tokens and notify auth handler
      clearStoredTokens();
      notifyAuthUpdate(null);
      
      const message =
        payload?.error?.message ??
        error.message ??
        `Request to ${endpoint} failed with status ${response.status}. Please log in again.`;
      const unauthorizedError = new Error(message);
      unauthorizedError.status = response.status;
      unauthorizedError.code = payload?.error?.code ?? error.code ?? "UNAUTHORIZED";
      unauthorizedError.details = payload ?? error.details;
      unauthorizedError.requiresLogin = true;
      // Suppress console errors for expected 401s (token expired, user logged out)
      unauthorizedError.suppressConsoleError = true;
      throw unauthorizedError;
    }
  }

  // If 401 and no refresh token or refresh already attempted, clear tokens
  if (!skipAuth && response.status === 401) {
    clearStoredTokens();
    notifyAuthUpdate(null);
    
    // Mark as suppressible error for expected 401s
    const message =
      payload?.error?.message ?? `Request to ${endpoint} failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code;
    error.details = payload;
    error.requiresLogin = true;
    error.suppressConsoleError = true;
    throw error;
  }

  const message =
    payload?.error?.message ?? `Request to ${endpoint} failed with status ${response.status}`;
  const error = new Error(message);
  error.status = response.status;
  error.code = payload?.error?.code;
  error.details = payload;
  
  // Mark validation errors as suppressible (non-critical) if they're 400 errors
  const isValidationError = response.status === 400 && (
    error.code === "VALIDATION_ERROR" || 
    message.includes("Invalid user ID") ||
    message.includes("Invalid")
  );
  
  // Mark duplicate submission errors (409) as suppressible - they're expected
  const isDuplicateError = response.status === 409 && (
    error.code === "DUPLICATE_SUBMISSION" ||
    message.includes("already submitted") ||
    message.includes("already submitted this form")
  );
  
  error.suppressConsoleError = isValidationError || isDuplicateError;
  
  // Log non-401 errors in production (401s are expected for auth failures)
  // Completely suppress validation errors and duplicate submission errors in development
  if (!isDevelopment && response.status !== 401 && !isValidationError && !isDuplicateError) {
    console.error("[API] Request failed:", {
      endpoint,
      method,
      status: response.status,
      code: error.code,
      message: error.message,
      apiUrl: API_BASE_URL
    });
  }
  // Validation errors and duplicate submission errors are completely suppressed - no console output
  
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
    error?.code === "BAD_GATEWAY" ||
    error?.status === 0 ||
    error?.status === 502 ||
    error?.message?.includes("Failed to fetch") ||
    error?.message?.includes("Unable to connect to server") ||
    error?.message?.includes("CORS") ||
    error?.name === "TypeError"
  );
};

export const apiBaseConfig = {
  API_BASE_URL,
  TOKEN_STORAGE_KEY,
};

