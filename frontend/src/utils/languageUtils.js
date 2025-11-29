// Language code mapping - convert between frontend codes and normalized codes
const languageCodeMap = {
  "en": "en",
  "hi-IN": "hi",
  "ur-PK": "ur",
  "bn-BD": "bn",
  "ne-NP": "ne",
  "si-LK": "si",
  "ps-AF": "ps",
  "ar-SA": "ar",
  "ar-KW": "ar",
  "ar-AE": "ar",
};

/**
 * Normalize language code from frontend format to standard format
 * @param {string} langCode - Language code (e.g., "hi-IN", "en")
 * @returns {string} Normalized language code (e.g., "hi", "en")
 */
export const normalizeLanguageCode = (langCode) => {
  return languageCodeMap[langCode] || langCode?.split("-")[0] || "en";
};

/**
 * Denormalize language code from standard format to frontend format
 * @param {string} i18nextCode - Normalized language code (e.g., "hi", "en")
 * @returns {string} Frontend language code (e.g., "hi-IN", "en")
 */
export const denormalizeLanguageCode = (i18nextCode) => {
  for (const [frontendCode, code] of Object.entries(languageCodeMap)) {
    if (code === i18nextCode) {
      return frontendCode;
    }
  }
  return "en";
};

