import getTranslateClient, {
  normalizeLanguageCode,
} from "../config/googleCloud.js";

// In-memory cache for translations (can be upgraded to Redis in production)
const translationCache = new Map();

// Cache key generator
const getCacheKey = (text, targetLang, sourceLang = "en") => {
  return `${sourceLang}_${targetLang}_${Buffer.from(text).toString("base64")}`;
};

// Cache TTL: 24 hours in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Clean up expired cache entries periodically
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of translationCache.entries()) {
    if (value.expiresAt < now) {
      translationCache.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupCache, 60 * 60 * 1000);

/**
 * Translate single text
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., "hi", "ar")
 * @param {string} sourceLang - Source language code (default: "en")
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLang, sourceLang = "en") => {
  if (!text || typeof text !== "string" || !text.trim()) {
    return text;
  }

  const normalizedTargetLang = normalizeLanguageCode(targetLang);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);

  // If source and target are same, return original
  if (normalizedSourceLang === normalizedTargetLang) {
    return text;
  }

  // Check cache
  const cacheKey = getCacheKey(
    text,
    normalizedTargetLang,
    normalizedSourceLang
  );
  const cached = translationCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.translation;
  }

  // Get translation client
  const translate = getTranslateClient();
  if (!translate) {
    // eslint-disable-next-line no-console
    console.error(
      "[Translation] ❌ CRITICAL: Google Cloud Translate not configured. Returning original text.",
      {
        hasApiKey: !!process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
        hasCredentialsPath: !!process.env.GOOGLE_CLOUD_CREDENTIALS_PATH,
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hint: "Set GOOGLE_CLOUD_TRANSLATE_API_KEY or GOOGLE_CLOUD_CREDENTIALS_PATH environment variable",
      }
    );
    return text;
  }

  // Retry logic for rate limits
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let translation;

      // If using API key, use REST API directly
      if (translate._useApiKey && translate._apiKey) {
        const apiKey = translate._apiKey;
        const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(
          apiKey
        )}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
            source: normalizedSourceLang,
            target: normalizedTargetLang,
            format: "text",
          }),
        });

          if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`;

          // Enhanced error logging
          console.error("[Translation] Google Cloud Translate API error:", {
            status: response.status,
            statusText: response.statusText,
            errorMessage,
            errorData: JSON.stringify(errorData, null, 2).substring(0, 500),
            attempt: attempt + 1,
            maxRetries: MAX_RETRIES + 1,
            hint: response.status === 401 || response.status === 403
              ? "API key may be invalid or expired. Check GOOGLE_CLOUD_TRANSLATE_API_KEY"
              : response.status === 429
              ? "Rate limit exceeded. Will retry with exponential backoff"
              : "Check Google Cloud Translate API configuration and billing",
          });

          // Check if it's a rate limit error
          const isRateLimit =
            response.status === 429 ||
            errorMessage.includes("Rate Limit") ||
            errorMessage.includes("Quota") ||
            errorMessage.includes("RESOURCE_EXHAUSTED");

          if (isRateLimit && attempt < MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = BASE_DELAY * Math.pow(2, attempt);
            console.warn(
              `[Translation] Rate limit hit, retrying in ${delay}ms (attempt ${
                attempt + 1
              }/${MAX_RETRIES + 1})`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            lastError = new Error(errorMessage);
            continue; // Retry
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Log full response for debugging
        if (process.env.NODE_ENV === "production") {
          console.log("[Translation] Google Cloud Translate API response:", {
            hasData: !!data?.data,
            hasTranslations: !!data?.data?.translations,
            translationCount: data?.data?.translations?.length,
            firstTranslation: data?.data?.translations?.[0]?.translatedText?.substring(0, 50),
            originalText: text.substring(0, 50),
            responseKeys: data ? Object.keys(data) : [],
            dataKeys: data?.data ? Object.keys(data.data) : [],
          });
        }
        
        translation = data.data?.translations?.[0]?.translatedText || text;
        
        // CRITICAL: If translation equals original and languages are different, log error
        if (translation === text && normalizedSourceLang !== normalizedTargetLang) {
          console.error("[Translation] ❌ CRITICAL: Google Cloud Translate returned original text!", {
            original: text.substring(0, 100),
            translation: translation.substring(0, 100),
            sourceLang: normalizedSourceLang,
            targetLang: normalizedTargetLang,
            apiResponse: JSON.stringify(data, null, 2).substring(0, 500),
            hint: "Google Cloud Translate API may not be configured correctly or API key may be invalid",
          });
        }
      } else {
        // Use client library (for service account authentication)
        if (process.env.NODE_ENV === "production") {
          console.log("[Translation] Using Google Cloud Translate client library:", {
            sourceLang: normalizedSourceLang,
            targetLang: normalizedTargetLang,
            textLength: text.length,
          });
        }
        
        [translation] = await translate.translate(text, {
          from: normalizedSourceLang,
          to: normalizedTargetLang,
        });
        
        if (process.env.NODE_ENV === "production") {
          console.log("[Translation] Client library translation received:", {
            original: text.substring(0, 50),
            translated: translation?.substring(0, 50),
            isSameAsOriginal: translation === text,
          });
        }
      }

      // Cache the result
      translationCache.set(cacheKey, {
        translation,
        expiresAt: Date.now() + CACHE_TTL,
      });

      return translation;
    } catch (error) {
      lastError = error;

      // Check if it's a rate limit error for client library
      const isRateLimit =
        error.message?.includes("Rate Limit") ||
        error.message?.includes("Quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.code === 8; // Google Cloud gRPC code for RESOURCE_EXHAUSTED

      if (isRateLimit && attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.warn(
          `[Translation] Rate limit hit, retrying in ${delay}ms (attempt ${
            attempt + 1
          }/${MAX_RETRIES + 1})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Retry
      }

      // If not rate limit or max retries reached, throw error
      if (attempt === MAX_RETRIES || !isRateLimit) {
        throw error;
      }
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("Translation failed after retries");
};

/**
 * Translate multiple texts in batch
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: "en")
 * @returns {Promise<string[]>} - Array of translated texts
 */
export const translateBatch = async (texts, targetLang, sourceLang = "en") => {
  if (!Array.isArray(texts) || texts.length === 0) {
    return texts || [];
  }

  const normalizedTargetLang = normalizeLanguageCode(targetLang);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);

  // If source and target are same, return originals
  if (normalizedSourceLang === normalizedTargetLang) {
    return texts;
  }

  // Separate cached and uncached texts
  const results = [];
  const uncachedTexts = [];
  const uncachedIndices = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];

    // Skip empty or invalid texts
    if (!text || typeof text !== "string" || !text.trim()) {
      results[i] = text;
      continue;
    }

    const cacheKey = getCacheKey(
      text,
      normalizedTargetLang,
      normalizedSourceLang
    );
    const cached = translationCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      results[i] = cached.translation;
    } else {
      uncachedTexts.push(text);
      uncachedIndices.push(i);
    }
  }

  // If all texts are cached, return results
  if (uncachedTexts.length === 0) {
    return results;
  }

  // Get translation client
  const translate = getTranslateClient();
  if (!translate) {
    // eslint-disable-next-line no-console
    console.error(
      "[Translation] ❌ CRITICAL: Google Cloud Translate not configured. Returning original texts.",
      {
        hasApiKey: !!process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
        hasCredentialsPath: !!process.env.GOOGLE_CLOUD_CREDENTIALS_PATH,
        hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        hint: "Set GOOGLE_CLOUD_TRANSLATE_API_KEY or GOOGLE_CLOUD_CREDENTIALS_PATH environment variable",
      }
    );
    return texts;
  }

  // Retry logic for rate limits
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let translatedArray;

      // If using API key, use REST API directly
      if (translate._useApiKey && translate._apiKey) {
        const apiKey = translate._apiKey;
        const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(
          apiKey
        )}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: uncachedTexts,
            source: normalizedSourceLang,
            target: normalizedTargetLang,
            format: "text",
          }),
        });

          if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`;

          // Enhanced error logging
          console.error("[Translation] Google Cloud Translate Batch API error:", {
            status: response.status,
            statusText: response.statusText,
            errorMessage,
            errorData: JSON.stringify(errorData, null, 2).substring(0, 500),
            attempt: attempt + 1,
            maxRetries: MAX_RETRIES + 1,
            textCount: uncachedTexts.length,
            hint: response.status === 401 || response.status === 403
              ? "API key may be invalid or expired. Check GOOGLE_CLOUD_TRANSLATE_API_KEY"
              : response.status === 429
              ? "Rate limit exceeded. Will retry with exponential backoff"
              : "Check Google Cloud Translate API configuration and billing",
          });

          // Check if it's a rate limit error
          const isRateLimit =
            response.status === 429 ||
            errorMessage.includes("Rate Limit") ||
            errorMessage.includes("Quota") ||
            errorMessage.includes("RESOURCE_EXHAUSTED");

          if (isRateLimit && attempt < MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = BASE_DELAY * Math.pow(2, attempt);
            console.warn(
              `[Translation] Rate limit hit for batch, retrying in ${delay}ms (attempt ${
                attempt + 1
              }/${MAX_RETRIES + 1})`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            lastError = new Error(errorMessage);
            continue; // Retry
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Log full response for debugging
        if (process.env.NODE_ENV === "production") {
          console.log("[Translation] Google Cloud Translate Batch API response:", {
            hasData: !!data?.data,
            hasTranslations: !!data?.data?.translations,
            translationCount: data?.data?.translations?.length,
            expectedCount: uncachedTexts.length,
            responseKeys: data ? Object.keys(data) : [],
            dataKeys: data?.data ? Object.keys(data.data) : [],
          });
        }
        
        translatedArray =
          data.data?.translations?.map((t) => t.translatedText) ||
          uncachedTexts;
        
        // CRITICAL: Check if all translations equal originals
        const allSame = translatedArray.every((trans, idx) => trans === uncachedTexts[idx]);
        if (allSame && normalizedSourceLang !== normalizedTargetLang) {
          console.error("[Translation] ❌ CRITICAL: Google Cloud Translate Batch API returned all original texts!", {
            textCount: uncachedTexts.length,
            sourceLang: normalizedSourceLang,
            targetLang: normalizedTargetLang,
            sampleOriginal: uncachedTexts[0]?.substring(0, 100),
            sampleTranslation: translatedArray[0]?.substring(0, 100),
            apiResponse: JSON.stringify(data, null, 2).substring(0, 500),
            hint: "Google Cloud Translate API may not be configured correctly or API key may be invalid",
          });
        }
      } else {
        // Use client library (for service account authentication)
        if (process.env.NODE_ENV === "production") {
          console.log("[Translation] Using Google Cloud Translate client library (batch):", {
            sourceLang: normalizedSourceLang,
            targetLang: normalizedTargetLang,
            textCount: uncachedTexts.length,
          });
        }
        
        const [translations] = await translate.translate(uncachedTexts, {
          from: normalizedSourceLang,
          to: normalizedTargetLang,
        });
        // Google Cloud Translate returns an array or a single string
        translatedArray = Array.isArray(translations)
          ? translations
          : [translations];
        
        if (process.env.NODE_ENV === "production") {
          console.log("[Translation] Client library batch translation received:", {
            translationCount: translatedArray.length,
            expectedCount: uncachedTexts.length,
            sampleOriginal: uncachedTexts[0]?.substring(0, 50),
            sampleTranslation: translatedArray[0]?.substring(0, 50),
            isSameAsOriginal: translatedArray[0] === uncachedTexts[0],
          });
        }
      }

      // Update results and cache
      for (let i = 0; i < uncachedTexts.length; i++) {
        const originalText = uncachedTexts[i];
        const translation = translatedArray[i] || originalText;
        const resultIndex = uncachedIndices[i];

        results[resultIndex] = translation;

        // Cache the result
        const cacheKey = getCacheKey(
          originalText,
          normalizedTargetLang,
          normalizedSourceLang
        );
        translationCache.set(cacheKey, {
          translation,
          expiresAt: Date.now() + CACHE_TTL,
        });
      }

      return results;
    } catch (error) {
      lastError = error;

      // Check if it's a rate limit error for client library
      const isRateLimit =
        error.message?.includes("Rate Limit") ||
        error.message?.includes("Quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.code === 8; // Google Cloud gRPC code for RESOURCE_EXHAUSTED

      if (isRateLimit && attempt < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.warn(
          `[Translation] Rate limit hit for batch, retrying in ${delay}ms (attempt ${
            attempt + 1
          }/${MAX_RETRIES + 1})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Retry
      }

      // If not rate limit or max retries reached, throw error
      if (attempt === MAX_RETRIES || !isRateLimit) {
        throw error;
      }
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("Batch translation failed after retries");
};

/**
 * Translate an object's string properties recursively
 * @param {Object} obj - Object to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: "en")
 * @param {string[]} keysToTranslate - Optional array of keys to translate (if not provided, translates all string values)
 * @returns {Promise<Object>} - Translated object
 */
export const translateObject = async (
  obj,
  targetLang,
  sourceLang = "en",
  keysToTranslate = null
) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  const normalizedTargetLang = normalizeLanguageCode(targetLang);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);

  // If source and target are same, return original
  if (normalizedSourceLang === normalizedTargetLang) {
    return obj;
  }

  const translated = { ...obj };
  const textsToTranslate = [];
  const textPaths = [];

  // Collect all texts that need translation
  const collectTexts = (current, path = "") => {
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const fullPath = path ? `${path}.${key}` : key;
        const value = current[key];

        if (typeof value === "string" && value.trim()) {
          // Only translate specified keys if provided, otherwise translate all strings
          if (!keysToTranslate || keysToTranslate.includes(key)) {
            textsToTranslate.push(value);
            textPaths.push(fullPath);
          }
        } else if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Recursively process nested objects
          collectTexts(value, fullPath);
        }
      }
    }
  };

  collectTexts(obj);

  // If no texts to translate, return original
  if (textsToTranslate.length === 0) {
    return obj;
  }

  // Translate all texts in batch
  const translations = await translateBatch(
    textsToTranslate,
    targetLang,
    sourceLang
  );

  // Reconstruct object with translated values
  const setNestedValue = (target, path, value) => {
    const parts = path.split(".");
    let current = target;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  };

  for (let i = 0; i < textPaths.length; i++) {
    setNestedValue(translated, textPaths[i], translations[i]);
  }

  return translated;
};
