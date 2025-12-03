import { API_BASE_URL } from "../../config/api.js";

const TOKEN_STORAGE_KEY = "aela.auth.tokens";
const CSRF_TOKEN_STORAGE_KEY = "aela.csrf.token";

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
  window.localStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
};

// CSRF Token Management
const loadCsrfToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CSRF_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeCsrfToken = (token) => {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(CSRF_TOKEN_STORAGE_KEY, token);
};

const clearCsrfToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
};

// Fetch CSRF token from server
const fetchCsrfToken = async () => {
  try {
    const tokens = loadTokens();
    if (!tokens?.accessToken) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.csrfToken) {
        storeCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
    }

    // Also check if token is in response header
    const headerToken = response.headers.get("X-CSRF-Token");
    if (headerToken) {
      storeCsrfToken(headerToken);
      return headerToken;
    }

    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[CSRF] Error fetching token:", error);
    return null;
  }
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

// Request queue to prevent too many simultaneous requests
const requestQueue = [];
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 5; // Reduced from 10 to prevent rate limiting

// Request deduplication cache - prevents duplicate requests within a short time window
const requestCache = new Map();
const CACHE_TTL = 5000; // 5 seconds - same request within 5 seconds returns cached promise

const getRequestKey = (endpoint, method, body) => {
  const bodyStr = body instanceof FormData ? 'FormData' : (body ? JSON.stringify(body) : '');
  return `${method}:${endpoint}:${bodyStr}`;
};

const processQueue = async () => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }

  const { resolve, reject, endpoint, options } = requestQueue.shift();
  activeRequests++;

  try {
    const result = await executeRequest(endpoint, options);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    activeRequests--;
    // Process next request in queue
    setTimeout(processQueue, 0);
  }
};

const executeRequest = async (
  endpoint,
  { method = "GET", body, headers = {}, skipAuth = false, _retry = false, _retryCount = 0 } = {}
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
    
    // Add CSRF token for state-changing operations
    const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
    if (stateChangingMethods.includes(method.toUpperCase())) {
      let csrfToken = loadCsrfToken();
      
      // If no CSRF token, try to fetch it
      if (!csrfToken) {
        csrfToken = await fetchCsrfToken();
      }
      
      if (csrfToken) {
        finalHeaders["X-CSRF-Token"] = csrfToken;
      }
    }
  }

  // Prepare body - use FormData as-is, or stringify JSON
  const requestBody = isFormData ? body : (body ? JSON.stringify(body) : undefined);

  // Create timeout controller for fetch request (30 seconds timeout)
  const timeoutMs = 30000; // 30 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: finalHeaders,
      body: requestBody,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (networkError) {
    clearTimeout(timeoutId);
    
    // Check if it's an abort error (timeout)
    if (networkError.name === 'AbortError' || controller.signal.aborted) {
      const timeoutError = new Error(
        `Request timeout: The server took too long to respond (${timeoutMs / 1000} seconds). Please check your connection and try again.`
      );
      timeoutError.status = 0;
      timeoutError.code = "REQUEST_TIMEOUT";
      timeoutError.isNetworkError = true;
      throw timeoutError;
    }
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
    // Check for CSRF token in response header and store it
    const csrfToken = response.headers.get("X-CSRF-Token");
    if (csrfToken) {
      storeCsrfToken(csrfToken);
    }
    
    return payload;
  }

  // Handle CSRF token errors
  if (response.status === 403 && (payload?.error?.code === "CSRF_TOKEN_MISSING" || payload?.error?.code === "CSRF_TOKEN_INVALID")) {
    // Try to fetch new CSRF token and retry once
    if (!_retry) {
      clearCsrfToken();
      const newCsrfToken = await fetchCsrfToken();
      if (newCsrfToken) {
        return apiRequest(endpoint, {
          method,
          body,
          headers,
          skipAuth,
          _retry: true,
        });
      }
    }
  }

  if (!skipAuth && response.status === 401 && tokens?.refreshToken && !_retry) {
    try {
      await refreshTokensIfNeeded(tokens);
      // Clear CSRF token on token refresh to get a new one
      clearCsrfToken();
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
      clearCsrfToken();
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
    // Check if tokens were missing in the first place
    const hadTokens = tokens?.accessToken;
    
    if (!hadTokens) {
      // If tokens were missing, this is expected - suppress error completely
      const error = new Error("Access token missing");
      error.status = response.status;
      error.code = payload?.error?.code || "UNAUTHORIZED";
      error.details = payload;
      error.requiresLogin = true;
      error.suppressConsoleError = true;
      throw error;
    }
    
    // If we had tokens but got 401, clear them and notify
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

  // Handle 429 Too Many Requests with exponential backoff
  if (response.status === 429) {
    const retryAfter = payload?.error?.retryAfter || payload?.retryAfter || 60; // Default 60 seconds
    const maxRetries = 3;
    
    if (_retryCount < maxRetries) {
      // Exponential backoff: wait longer for each retry
      const backoffDelay = Math.min(
        retryAfter * 1000 * Math.pow(2, _retryCount),
        300000 // Max 5 minutes
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      // Retry the request
      return executeRequest(endpoint, {
        method,
        body,
        headers,
        skipAuth,
        _retry: true,
        _retryCount: _retryCount + 1,
      });
    }
    // If max retries reached, fall through to error handling below
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
  
  // Mark 429 rate limit errors as suppressible - they're expected when rate limited
  const isRateLimitError = response.status === 429;
  
  error.suppressConsoleError = isValidationError || isDuplicateError || isRateLimitError;
  
  // Log non-401, non-429 errors in production (401s and 429s are expected)
  // Completely suppress validation errors, duplicate submission errors, and rate limit errors
  if (!isDevelopment && response.status !== 401 && response.status !== 429 && !isValidationError && !isDuplicateError) {
    console.error("[API] Request failed:", {
      endpoint,
      method,
      status: response.status,
      code: error.code,
      message: error.message,
      apiUrl: API_BASE_URL
    });
  }
  // Validation errors, duplicate submission errors, and rate limit errors are completely suppressed - no console output
  
  throw error;
};

export const apiRequest = async (
  endpoint,
  options = {}
) => {
  const { method = "GET", body } = options;
  
  // Check for duplicate request (deduplication)
  // Only deduplicate GET requests to avoid issues with POST/PUT/DELETE
  if (method === "GET") {
    const requestKey = getRequestKey(endpoint, method, body);
    const cached = requestCache.get(requestKey);
    
    if (cached) {
      const { promise, timestamp } = cached;
      // If cache is still valid (within TTL), return the same promise
      if (Date.now() - timestamp < CACHE_TTL) {
        return promise;
      } else {
        // Cache expired, remove it
        requestCache.delete(requestKey);
      }
    }
  }
  
  // Create the request promise
  const requestPromise = (async () => {
    // Queue request if we're at max concurrent requests
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      return new Promise((resolve, reject) => {
        requestQueue.push({ resolve, reject, endpoint, options });
        processQueue();
      });
    }
    
    // Execute immediately if under limit
    activeRequests++;
    try {
      const result = await executeRequest(endpoint, options);
      return result;
    } finally {
      activeRequests--;
      // Process next request in queue
      setTimeout(processQueue, 0);
    }
  })();
  
  // Cache GET requests for deduplication
  if (method === "GET") {
    const requestKey = getRequestKey(endpoint, method, body);
    requestCache.set(requestKey, {
      promise: requestPromise,
      timestamp: Date.now(),
    });
    
    // Clean up cache after TTL
    setTimeout(() => {
      requestCache.delete(requestKey);
    }, CACHE_TTL);
  }
  
  return requestPromise;
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

