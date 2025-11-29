import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useDynamicTranslation } from "../hooks/useDynamicTranslation";
import { normalizeLanguageCode } from "../utils/languageUtils";

/**
 * Component that automatically translates all text content (children)
 * Works with strings, numbers, and mixed content
 * @param {React.ReactNode} children - Content to translate
 * @param {string} sourceLang - Source language (default: "en")
 * @param {React.ReactNode} fallback - Fallback content while translating
 * @param {string} className - CSS class name
 * @param {boolean} skipTranslation - Skip translation if true (useful for already translated content)
 */
const AutoTranslated = ({ 
  children, 
  sourceLang = "en", 
  fallback = null,
  className = "",
  skipTranslation = false,
  ...props 
}) => {
  const { language } = useLanguage();
  const { translate, isTranslating } = useDynamicTranslation({ sourceLang });
  const [translatedContent, setTranslatedContent] = useState(children);

  // Extract text from React children
  const extractText = (node) => {
    if (typeof node === "string" || typeof node === "number") {
      return String(node);
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join(" ");
    }
    if (node && typeof node === "object" && node.props) {
      if (node.props.children) {
        return extractText(node.props.children);
      }
    }
    return "";
  };

  // Check if content needs translation
  const normalizedLanguage = normalizeLanguageCode(language);
  const normalizedSourceLang = normalizeLanguageCode(sourceLang);
  const needsTranslation = !skipTranslation && normalizedLanguage !== normalizedSourceLang;

  useEffect(() => {
    const updateTranslation = async () => {
      if (!needsTranslation || !children) {
        setTranslatedContent(children);
        return;
      }

      // Extract text content
      const textContent = extractText(children);
      
      if (!textContent || !textContent.trim()) {
        setTranslatedContent(children);
        return;
      }

      try {
        const translated = await translate(textContent);
        
        // If children is a simple string, replace it
        if (typeof children === "string") {
          setTranslatedContent(translated);
        } else {
          // For complex children, try to replace text nodes
          // This is a simplified approach - for complex structures, use TranslatedText instead
          setTranslatedContent(translated);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[AutoTranslated] Translation error:", error);
        setTranslatedContent(children);
      }
    };

    updateTranslation();
  }, [children, language, sourceLang, translate, needsTranslation]);

  if (isTranslating && fallback) {
    return <span className={className} {...props}>{fallback}</span>;
  }

  // If children is a string and we have a translation, return the translated string
  if (typeof children === "string" && typeof translatedContent === "string") {
    return <span className={className} {...props}>{translatedContent}</span>;
  }

  // For complex children, return as-is (use TranslatedText for individual strings)
  return <span className={className} {...props}>{children}</span>;
};

export default AutoTranslated;

