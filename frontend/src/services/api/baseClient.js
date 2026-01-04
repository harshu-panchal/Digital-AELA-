import { API_BASE_URL } from "../../config/api.js";
import { isTokenExpired } from "../../utils/jwt.js";

const TOKEN_STORAGE_KEY = "aela.auth.tokens";
const CSRF_TOKEN_STORAGE_KEY = "aela.csrf.token";

const isDevelopment =
  import.meta.env.DEV || import.meta.env.MODE === "development";

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
      .then(({ refreshRecruiterSession }) =>
        refreshRecruiterSession(currentTokens.refreshToken)
      )
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
  const bodyStr =
    body instanceof FormData ? "FormData" : body ? JSON.stringify(body) : "";
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
  {
    method = "GET",
    body,
    headers = {},
    skipAuth = false,
    timeout,
    onUploadProgress, // New: callback for progress tracking
    _retry = false,
    _retryCount = 0,
  } = {}
) => {
  let tokens = loadTokens();

  // Proactively refresh tokens if they are about to expire (within 2 minutes)
  // This prevents 401 errors and unnecessary retries
  if (!skipAuth && tokens?.accessToken && tokens?.refreshToken && !_retry) {
    if (isTokenExpired(tokens.accessToken, 2)) {
      try {
        await refreshTokensIfNeeded(tokens);
        // Reload tokens after refresh
        tokens = loadTokens();
      } catch (refreshError) {
        // If refresh fails, we'll continue and let the request fail with 401
        // which will trigger the standard error handling
        console.warn("[API] Proactive token refresh failed:", refreshError);
      }
    }
  }

  // Check if body is FormData
  const isFormData =
    body instanceof FormData || (body && typeof body.append === "function");

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
  const requestBody = isFormData
    ? body
    : body
    ? JSON.stringify(body)
    : undefined;

  // Determine if we should use XHR (for upload progress) or fetch
  if (onUploadProgress && method.toUpperCase() !== "GET") {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${API_BASE_URL}${endpoint}`;

      xhr.open(method, url, true);

      // Set headers
      Object.entries(finalHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Handle timeout
      xhr.timeout = timeout || 30000;

      // Progress tracking
      if (xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onUploadProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        const responseHeaders = {
          get: (name) => xhr.getResponseHeader(name),
        };

        let payload = null;
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          payload = null;
        }

        const responseData = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          headers: responseHeaders,
          json: async () => payload,
        };

        handleResponse(responseData, payload, resolve, reject, endpoint, {
          method,
          body,
          headers,
          skipAuth,
          timeout,
          onUploadProgress,
          _retry,
          _retryCount,
        });
      };

      xhr.onerror = () => {
        const connectionError = new Error(`Unable to connect to server.`);
        connectionError.status = 0;
        connectionError.code = "CONNECTION_ERROR";
        connectionError.isNetworkError = true;
        reject(connectionError);
      };

      xhr.ontimeout = () => {
        const timeoutError = new Error(`Request timeout.`);
        timeoutError.status = 0;
        timeoutError.code = "REQUEST_TIMEOUT";
        timeoutError.isNetworkError = true;
        reject(timeoutError);
      };

      xhr.send(requestBody);
    });
  }

  // Fallback to fetch for standard requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout || 30000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: finalHeaders,
      body: requestBody,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const payload = await response.json().catch(() => null);

    return new Promise((resolve, reject) => {
      handleResponse(response, payload, resolve, reject, endpoint, {
        method,
        body,
        headers,
        skipAuth,
        timeout,
        _retry,
        _retryCount,
      });
    });
  } catch (networkError) {
    clearTimeout(timeoutId);
    // ... rest of error handling handled in handleResponse if needed or here
    if (networkError.name === "AbortError" || controller.signal.aborted) {
      const timeoutError = new Error(`Request timeout.`);
      timeoutError.status = 0;
      timeoutError.code = "REQUEST_TIMEOUT";
      timeoutError.isNetworkError = true;
      throw timeoutError;
    }
    throw networkError;
  }
};

/**
 * Shared response handler to avoid duplicating logic between fetch and XHR
 */
const handleResponse = async (
  response,
  payload,
  resolve,
  reject,
  endpoint,
  options
) => {
  const {
    method,
    body,
    headers,
    skipAuth,
    timeout,
    onUploadProgress,
    _retry,
    _retryCount,
  } = options;
  const tokens = loadTokens();

  if (response.ok) {
    // Check for CSRF token in response header and store it
    const csrfToken = response.headers.get("X-CSRF-Token");
    if (csrfToken) {
      storeCsrfToken(csrfToken);
    }
    return resolve(payload);
  }

  // Handle 502 Bad Gateway
  if (response.status === 502) {
    const badGatewayError = new Error(
      `Backend server is temporarily unavailable (502 Bad Gateway).`
    );
    badGatewayError.status = 502;
    badGatewayError.code = "BAD_GATEWAY";
    badGatewayError.isNetworkError = true;
    return reject(badGatewayError);
  }

  // Handle CSRF token errors
  if (
    response.status === 403 &&
    (payload?.error?.code === "CSRF_TOKEN_MISSING" ||
      payload?.error?.code === "CSRF_TOKEN_INVALID")
  ) {
    if (!_retry) {
      clearCsrfToken();
      const newCsrfToken = await fetchCsrfToken();
      if (newCsrfToken) {
        return resolve(
          apiRequest(endpoint, {
            method,
            body,
            headers,
            skipAuth,
            onUploadProgress,
            _retry: true,
          })
        );
      }
    }
  }

  if (!skipAuth && response.status === 401 && tokens?.refreshToken && !_retry) {
    try {
      await refreshTokensIfNeeded(tokens);
      clearCsrfToken();
      return resolve(
        apiRequest(endpoint, {
          method,
          body,
          headers,
          skipAuth,
          onUploadProgress,
          _retry: true,
        })
      );
    } catch (error) {
      clearStoredTokens();
      clearCsrfToken();
      notifyAuthUpdate(null);
      return reject(error);
    }
  }

  // If 401 and no refresh token or refresh already attempted, clear tokens
  if (!skipAuth && response.status === 401) {
    clearStoredTokens();
    notifyAuthUpdate(null);
    const error = new Error(payload?.error?.message ?? "Unauthorized");
    error.status = response.status;
    error.requiresLogin = true;
    return reject(error);
  }

  // Handle 429 Too Many Requests
  if (response.status === 429) {
    const retryAfter = payload?.error?.retryAfter || payload?.retryAfter || 60;
    const maxRetries = 3;

    if (_retryCount < maxRetries) {
      const backoffDelay = Math.min(
        retryAfter * 1000 * Math.pow(2, _retryCount),
        300000
      );
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      return resolve(
        executeRequest(endpoint, {
          method,
          body,
          headers,
          skipAuth,
          onUploadProgress,
          _retry: true,
          _retryCount: _retryCount + 1,
        })
      );
    }
  }

  const error = new Error(
    payload?.error?.message ??
      `Request to ${endpoint} failed with status ${response.status}`
  );
  error.status = response.status;
  error.code = payload?.error?.code;
  error.details = payload;
  return reject(error);
};

export const apiRequest = async (endpoint, options = {}) => {
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
