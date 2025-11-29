import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { translateBatch } from "../services/translationService";
import { normalizeLanguageCode } from "../utils/languageUtils";

/**
 * Hook for batch translating all static text on a page
 * Collects text strings, translates them in batch, and provides a translation map
 * @param {string[]} staticTexts - Array of static text strings to translate
 * @param {string} sourceLang - Source language (default: "en")
 * @returns {Object} Translation map and loading state
 */
export const usePageTranslation = (staticTexts = [], sourceLang = "en") => {
  const { language, isChangingLanguage } = useLanguage();
  const [translationMap, setTranslationMap] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const cacheRef = useRef({});

  const normalizedLanguage = normalizeLanguageCode(language);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);
  const needsTranslation = normalizedLanguage !== normalizedSourceLang;

  // Create a stable key for each text
  const getTextKey = useCallback((text) => {
    return text?.trim() || "";
  }, []);

  // Translate all static texts in batch
  useEffect(() => {
    const translatePageTexts = async () => {
      if (!needsTranslation || !staticTexts || staticTexts.length === 0) {
        setTranslationMap({});
        setIsTranslating(false);
        return;
      }

      // Filter out empty texts and create unique list
      const uniqueTexts = [...new Set(staticTexts.filter(text => text && typeof text === "string" && text.trim()))];
      
      if (uniqueTexts.length === 0) {
        setTranslationMap({});
        setIsTranslating(false);
        return;
      }

      // Check cache first
      const cacheKey = `${normalizedLanguage}_${normalizedSourceLang}`;
      const cached = cacheRef.current[cacheKey];
      
      if (cached) {
        // Check if all texts are in cache
        const allCached = uniqueTexts.every(text => cached[getTextKey(text)]);
        if (allCached) {
          setTranslationMap(cached);
          setIsTranslating(false);
          return;
        }
      }

          setIsTranslating(true);

          try {
            // Translate in batches (Google Translate allows up to 100 texts per request)
        const batchSize = 100;
        const translations = [];
        
        for (let i = 0; i < uniqueTexts.length; i += batchSize) {
          const batch = uniqueTexts.slice(i, i + batchSize);
          const batchTranslations = await translateBatch(batch, language, sourceLang);
          translations.push(...batchTranslations);
        }

        // Create translation map
        const newMap = {};
        uniqueTexts.forEach((text, index) => {
          newMap[getTextKey(text)] = translations[index] || text;
        });

        // Update cache
        if (!cacheRef.current[cacheKey]) {
          cacheRef.current[cacheKey] = {};
        }
        Object.assign(cacheRef.current[cacheKey], newMap);

        setTranslationMap(newMap);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[usePageTranslation] Translation error:", error);
        // Create empty map (will fall back to original texts)
        setTranslationMap({});
      } finally {
        setIsTranslating(false);
      }
    };

    // Small delay to batch multiple language changes
    const timer = setTimeout(() => {
      translatePageTexts();
    }, 50);

    return () => clearTimeout(timer);
  }, [staticTexts, language, normalizedLanguage, normalizedSourceLang, sourceLang, needsTranslation, getTextKey]);

  // Get translated text
  const getTranslatedText = useCallback((text) => {
    if (!needsTranslation || !text) {
      return text;
    }
    const key = getTextKey(text);
    return translationMap[key] || text;
  }, [translationMap, needsTranslation, getTextKey]);

  return {
    translationMap,
    getTranslatedText,
    isTranslating: isTranslating || isChangingLanguage,
  };
};

