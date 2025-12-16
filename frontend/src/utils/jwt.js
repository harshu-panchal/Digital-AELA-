// JWT utility functions for token management

/**
 * Decode JWT token without verification (for expiration checks)
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeJwt = (token) => {
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return null;
  }
};

/**
 * Check if a JWT token is expired or about to expire
 * @param {string} token - JWT token to check
 * @param {number} bufferMinutes - Minutes before expiration to consider expired (default: 5)
 * @returns {boolean} True if token is expired or about to expire
 */
export const isTokenExpired = (token, bufferMinutes = 5) => {
  if (!token) return true;

  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  const expirationTime = payload.exp;
  const bufferTime = bufferMinutes * 60; // Convert to seconds

  return now >= (expirationTime - bufferTime);
};

/**
 * Get token expiration time in milliseconds
 * @param {string} token - JWT token
 * @returns {number|null} Expiration time or null if invalid
 */
export const getTokenExpiration = (token) => {
  if (!token) return null;

  const payload = decodeJwt(token);
  return payload?.exp ? payload.exp * 1000 : null;
};
