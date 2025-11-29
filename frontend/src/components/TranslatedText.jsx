import { useState, useEffect } from "react";
import { useDynamicTranslation } from "../hooks/useDynamicTranslation";
import { useLanguage } from "../contexts/LanguageContext";
import { normalizeLanguageCode } from "../utils/languageUtils";

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
      // Handle non-string children
      if (typeof children !== "string") {
        setTranslatedText(children);
        return;
      }

      if (!children || !children.trim()) {
        setTranslatedText(children);
        return;
      }

      if (!needsTranslation) {
        setTranslatedText(children);
        return;
      }

      try {
        const translated = await translate(children);
        setTranslatedText(translated);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[TranslatedText] Translation error:", error);
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

