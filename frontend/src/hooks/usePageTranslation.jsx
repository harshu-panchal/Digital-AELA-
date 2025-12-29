// Translation feature disabled. Hook returns identity mapping.
export const usePageTranslation = () => {
  return {
    translationMap: {},
    getTranslatedText: (text) => text,
    isTranslating: false,
  };
};
