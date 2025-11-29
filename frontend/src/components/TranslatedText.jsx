import { useState, useEffect } from "react";
import { useDynamicTranslation } from "../hooks/useDynamicTranslation";
import { useLanguage } from "../contexts/LanguageContext";
import { normalizeLanguageCode } from "../utils/languageUtils";
import { API_BASE_URL } from "../config/api.js";

/**
 * Component that automatically translates text based on current language
 * Use this for individual text strings (headings, labels, buttons, etc.)
 * @param {string|React.ReactNode} children - Text to translate
 * @param {string} sourceLang - Source language (default: "en")
 * @param {React.ReactNode} fallback - Fallback content while translating
 * @param {string} className - CSS class name
 * @param {boolean} skipTranslation - Skip translation if true
 */
const TranslatedText = ({ 
  children, 
  sourceLang = "en", 
  fallback = null,
  className = "",
  skipTranslation = false,
  ...props 
}) => {
  const { language } = useLanguage();
  const { translate, isTranslating } = useDynamicTranslation({ sourceLang });
  const [translatedText, setTranslatedText] = useState(children);

  const normalizedLanguage = normalizeLanguageCode(language);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);
  const needsTranslation = !skipTranslation && normalizedLanguage !== normalizedSourceLang;

  useEffect(() => {
    const updateTranslation = async () => {
      // Log translation attempt for debugging
      if (import.meta.env.PROD) {
        console.log("[TranslatedText] Translation update triggered:", {
          text: typeof children === "string" ? children.substring(0, 50) + (children.length > 50 ? "..." : "") : "non-string",
          currentLanguage: language,
          normalizedLanguage,
          sourceLang,
          normalizedSourceLang,
          needsTranslation,
          skipTranslation,
          isString: typeof children === "string",
          isEmpty: typeof children === "string" && !children.trim(),
        });
      }

      // Handle non-string children
      if (typeof children !== "string") {
        if (import.meta.env.PROD) {
          console.log("[TranslatedText] Skipping translation: non-string children");
        }
        setTranslatedText(children);
        return;
      }

      if (!children || !children.trim()) {
        if (import.meta.env.PROD) {
          console.log("[TranslatedText] Skipping translation: empty text");
        }
        setTranslatedText(children);
        return;
      }

      if (!needsTranslation) {
        if (import.meta.env.PROD) {
          console.log("[TranslatedText] Skipping translation: language match or skipTranslation=true", {
            normalizedLanguage,
            normalizedSourceLang,
            skipTranslation,
          });
        }
        setTranslatedText(children);
        return;
      }

      if (import.meta.env.PROD) {
        console.log("[TranslatedText] Starting translation:", {
          text: children.substring(0, 50) + (children.length > 50 ? "..." : ""),
          targetLang: language,
          sourceLang,
        });
      }

      try {
        const translated = await translate(children);
        
        if (import.meta.env.PROD) {
          console.log("[TranslatedText] Translation completed:", {
            original: children.substring(0, 50) + (children.length > 50 ? "..." : ""),
            translated: typeof translated === "string" ? translated.substring(0, 50) + (translated.length > 50 ? "..." : "") : translated,
            changed: translated !== children,
          });
        }
        
        setTranslatedText(translated);
      } catch (error) {
        // Enhanced error logging with language context and API URL
        if (import.meta.env.PROD) {
          console.error("[TranslatedText] Translation error:", {
            error: error.message,
            status: error?.status,
            code: error?.code,
            text: typeof children === "string" ? children.substring(0, 50) + (children.length > 50 ? "..." : "") : "non-string",
            currentLanguage: language,
            normalizedLanguage,
            sourceLang,
            normalizedSourceLang,
            apiUrl: API_BASE_URL,
            hint: error?.isNetworkError 
              ? "Check if backend server is running and VITE_API_URL is set correctly" 
              : "Check translation service and language configuration",
          });
        } else {
          // eslint-disable-next-line no-console
          console.error("[TranslatedText] Translation error:", error);
        }
        setTranslatedText(children);
      }
    };

    updateTranslation();
  }, [children, language, sourceLang, translate, needsTranslation]);

  if (isTranslating && fallback) {
    return <span className={className} {...props}>{fallback}</span>;
  }

  // If children is not a string, render as-is
  if (typeof children !== "string") {
    return <span className={className} {...props}>{children}</span>;
  }

  return <span className={className} {...props}>{translatedText}</span>;
};

export default TranslatedText;

