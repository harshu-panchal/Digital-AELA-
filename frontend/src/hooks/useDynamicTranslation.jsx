// Translation feature disabled. Identity implementations only.
import { useCallback } from "react";

export const useDynamicTranslation = () => {
  const translate = useCallback((text) => text, []);
  const translateBatch = useCallback((texts) => texts || [], []);
  const translateObject = useCallback((obj) => obj, []);

  return {
    translate,
    translateBatch,
    translateObject,
    isTranslating: false,
    translationError: null,
  };
};

// Higher-order component stub: returns original component unchanged
export const withDynamicTranslation = (Component) => Component;
