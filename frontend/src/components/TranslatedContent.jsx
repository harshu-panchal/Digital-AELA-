import { useState, useEffect } from "react";
import { useDynamicTranslation } from "../hooks/useDynamicTranslation";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Component that automatically translates object/array content
 * @param {Object|Array} data - Data to translate
 * @param {string[]} keysToTranslate - Keys to translate (if not provided, translates all string values)
 * @param {string} sourceLang - Source language (default: "en")
 * @param {Function} render - Render function that receives translated data
 * @param {React.ReactNode} fallback - Fallback content while translating
 */
const TranslatedContent = ({ 
  data, 
  keysToTranslate = null,
  sourceLang = "en",
  render,
  fallback = null,
  ...props 
}) => {
  const { language } = useLanguage();
  const { translateObject, isTranslating } = useDynamicTranslation({ sourceLang });
  const [translatedData, setTranslatedData] = useState(data);

  useEffect(() => {
    const updateTranslation = async () => {
      if (!data) {
        setTranslatedData(data);
        return;
      }

      if (language === sourceLang) {
        setTranslatedData(data);
        return;
      }

      try {
        const translated = await translateObject(data, keysToTranslate);
        setTranslatedData(translated);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[TranslatedContent] Translation error:", error);
        setTranslatedData(data);
      }
    };

    updateTranslation();
  }, [data, language, sourceLang, keysToTranslate, translateObject]);

  if (isTranslating && fallback) {
    return fallback;
  }

  if (render && typeof render === "function") {
    return render(translatedData, isTranslating);
  }

  // Default: render as JSON (for debugging)
  return <pre>{JSON.stringify(translatedData, null, 2)}</pre>;
};

export default TranslatedContent;

