import { useState, useEffect, useCallback } from "react";
import { translateText, translateBatch, translateObject } from "../services/translationService.js";
import { useLanguage } from "../contexts/LanguageContext";
import { normalizeLanguageCode } from "../utils/languageUtils";

/**
 * Hook for translating dynamic content (API responses, user-generated content, etc.)
 * @param {Object} options - Options for translation
 * @param {string} options.sourceLang - Source language (default: "en")
 * @param {boolean} options.autoTranslate - Auto-translate when language changes (default: true)
 * @returns {Object} Translation functions and state
 */
export const useDynamicTranslation = (options = {}) => {
  const { language, isChangingLanguage } = useLanguage();
  const { sourceLang = "en", autoTranslate = true } = options;

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  // Normalize language codes for comparison
  const normalizedLanguage = normalizeLanguageCode(language);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);

  // Translate single text
  const translate = useCallback(
    async (text) => {
      // Skip translation if conditions not met
      // Note: We allow translation even during language change to ensure content updates
      if (!text || !autoTranslate || normalizedLanguage === normalizedSourceLang) {
        return text;
      }

      setIsTranslating(true);
      setTranslationError(null);

      try {
        const translated = await translateText(text, language, sourceLang);
        return translated;
      } catch (error) {
        setTranslationError(error);
        // eslint-disable-next-line no-console
        console.error("[Dynamic Translation] Error:", error);
        return text; // Return original on error
      } finally {
        setIsTranslating(false);
      }
    },
    [language, normalizedLanguage, sourceLang, normalizedSourceLang, autoTranslate]
  );

  // Translate batch
  const translateBatchTexts = useCallback(
    async (texts) => {
      if (!texts || !Array.isArray(texts) || texts.length === 0 || !autoTranslate || normalizedLanguage === normalizedSourceLang) {
        return texts || [];
      }

      setIsTranslating(true);
      setTranslationError(null);

      try {
        const translated = await translateBatch(texts, language, sourceLang);
        return translated;
      } catch (error) {
        setTranslationError(error);
        // eslint-disable-next-line no-console
        console.error("[Dynamic Translation] Batch error:", error);
        return texts; // Return original on error
      } finally {
        setIsTranslating(false);
      }
    },
    [language, normalizedLanguage, sourceLang, normalizedSourceLang, autoTranslate]
  );

  // Translate object
  const translateObj = useCallback(
    async (obj, keysToTranslate = null) => {
      if (!obj || typeof obj !== "object" || !autoTranslate || normalizedLanguage === normalizedSourceLang) {
        return obj;
      }

      setIsTranslating(true);
      setTranslationError(null);

      try {
        const translated = await translateObject(obj, language, sourceLang, keysToTranslate);
        return translated;
      } catch (error) {
        setTranslationError(error);
        // eslint-disable-next-line no-console
        console.error("[Dynamic Translation] Object error:", error);
        return obj; // Return original on error
      } finally {
        setIsTranslating(false);
      }
    },
    [language, normalizedLanguage, sourceLang, normalizedSourceLang, autoTranslate]
  );

  return {
    translate,
    translateBatch: translateBatchTexts,
    translateObject: translateObj,
    isTranslating,
    translationError,
  };
};

/**
 * Higher-Order Component for translating component props
 * @param {React.Component} Component - Component to wrap
 * @param {Object} options - Translation options
 * @returns {React.Component} Wrapped component with translations
 */
export const withDynamicTranslation = (Component, options = {}) => {
  return function TranslatedComponent(props) {
    const { translate, translateObject, isTranslating } = useDynamicTranslation(options);

    // Translate props that need translation
    const translatedProps = { ...props };

    if (options.propsToTranslate) {
      for (const propKey of options.propsToTranslate) {
        if (props[propKey]) {
          if (typeof props[propKey] === "string") {
            // Translate string prop (will be async, so we need to handle this differently)
            // This is better handled with the hook in the component
          } else if (typeof props[propKey] === "object") {
            // Translate object prop
            translateObject(props[propKey], options.keysToTranslate).then((translated) => {
              translatedProps[propKey] = translated;
            });
          }
        }
      }
    }

    return <Component {...translatedProps} isTranslating={isTranslating} />;
  };
};

