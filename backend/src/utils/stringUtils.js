/**
 * Removes emojis and other 4-byte Unicode characters from a string.
 * This is useful for systems (like some MySQL configurations) that only support utf8mb3.
 * 
 * @param {string} str - The input string
 * @returns {string} - The sanitized string with emojis removed
 */
export const removeEmojis = (str) => {
    if (!str) return str;
    // Regex to match emojis and other non-BMP characters (surrogate pairs)
    return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
};

/**
 * Sanitizes object values by removing emojis from string properties.
 * Shallow copy only.
 * 
 * @param {Object} obj - The input object
 * @returns {Object} - New object with sanitized values
 */
export const sanitizeObjectForPayment = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = removeEmojis(value);
        } else {
            sanitized[key] = value;
        }
    }
}
return sanitized;
};

/**
 * Creates a URL-friendly slug from a string
 * @param {string} text - The text to slugify
 * @returns {string} - The slugified text
 */
export const slugify = (text) => {
    if (!text) return "";

    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-") // Replace spaces, non-word chars and dashes with a single dash
        .replace(/^-+|-+$/g, ""); // Remove leading and trailing dashes
};

