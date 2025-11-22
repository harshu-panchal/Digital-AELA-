import { translateText, translateBatch, translateObject } from "../services/translationService.js";

/**
 * Translate single text
 * POST /api/v1/translate
 * Body: { text: string, targetLang: string, sourceLang?: string }
 */
export const translateSingle = async (req, res) => {
  try {
    const { text, targetLang, sourceLang = "en" } = req.body;

    if (!text) {
      return res.status(400).json({
        error: {
          code: "MISSING_TEXT",
          message: "Text is required",
        },
      });
    }

    if (!targetLang) {
      return res.status(400).json({
        error: {
          code: "MISSING_TARGET_LANG",
          message: "Target language is required",
        },
      });
    }

    const translation = await translateText(text, targetLang, sourceLang);

    res.json({
      success: true,
      data: {
        original: text,
        translation,
        sourceLang,
        targetLang,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Translation Controller] Error:", error);
    res.status(500).json({
      error: {
        code: "TRANSLATION_ERROR",
        message: error.message || "Failed to translate text",
      },
    });
  }
};

/**
 * Translate multiple texts in batch
 * POST /api/v1/translate/batch
 * Body: { texts: string[], targetLang: string, sourceLang?: string }
 */
export const translateBatchController = async (req, res) => {
  try {
    const { texts, targetLang, sourceLang = "en" } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({
        error: {
          code: "INVALID_TEXTS",
          message: "Texts must be an array",
        },
      });
    }

    if (!targetLang) {
      return res.status(400).json({
        error: {
          code: "MISSING_TARGET_LANG",
          message: "Target language is required",
        },
      });
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 100;
    if (texts.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        error: {
          code: "BATCH_TOO_LARGE",
          message: `Maximum batch size is ${MAX_BATCH_SIZE}`,
        },
      });
    }

    const translations = await translateBatch(texts, targetLang, sourceLang);

    res.json({
      success: true,
      data: {
        originals: texts,
        translations,
        sourceLang,
        targetLang,
        count: texts.length,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Translation Controller] Batch error:", error);
    res.status(500).json({
      error: {
        code: "TRANSLATION_ERROR",
        message: error.message || "Failed to translate texts",
      },
    });
  }
};

/**
 * Translate an object's properties
 * POST /api/v1/translate/object
 * Body: { object: Object, targetLang: string, sourceLang?: string, keysToTranslate?: string[] }
 */
export const translateObjectController = async (req, res) => {
  try {
    const { object, targetLang, sourceLang = "en", keysToTranslate } = req.body;

    if (!object || typeof object !== "object" || Array.isArray(object)) {
      return res.status(400).json({
        error: {
          code: "INVALID_OBJECT",
          message: "Object must be a valid object",
        },
      });
    }

    if (!targetLang) {
      return res.status(400).json({
        error: {
          code: "MISSING_TARGET_LANG",
          message: "Target language is required",
        },
      });
    }

    const translated = await translateObject(object, targetLang, sourceLang, keysToTranslate);

    res.json({
      success: true,
      data: {
        original: object,
        translated,
        sourceLang,
        targetLang,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Translation Controller] Object error:", error);
    res.status(500).json({
      error: {
        code: "TRANSLATION_ERROR",
        message: error.message || "Failed to translate object",
      },
    });
  }
};

