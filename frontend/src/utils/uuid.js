/**
 * Safe UUID generator that works across all browsers.
 * Uses crypto.randomUUID if available, otherwise falls back to a math-based generator.
 */
export const generateUUID = () => {
  // Try using the native crypto.randomUUID if available
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if randomUUID fails for some reason
    }
  }

  // Fallback implementation for older browsers or non-secure contexts
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  try {
    const cryptoObj = typeof window !== "undefined" ? (window.crypto || window.msCrypto) : null;
    
    if (cryptoObj && cryptoObj.getRandomValues) {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ (cryptoObj.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      );
    }
  } catch (e) {
    // Fallback if crypto.getRandomValues fails
  }

  // Last resort: Math.random (not cryptographically secure but works everywhere)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generates a short unique ID with an optional prefix.
 */
export const generateShortId = (prefix = "") => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};
