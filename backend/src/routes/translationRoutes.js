import express from "express";
import {
  translateSingle,
  translateBatchController,
  translateObjectController,
} from "../controllers/translationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Translation routes - can be public or authenticated depending on usage
// For now, making them optional auth (public) but you can add authenticate() middleware if needed

/**
 * POST /api/v1/translate
 * Translate single text
 */
router.post("/", translateSingle);

/**
 * POST /api/v1/translate/batch
 * Translate multiple texts in batch
 */
router.post("/batch", translateBatchController);

/**
 * POST /api/v1/translate/object
 * Translate object properties
 */
router.post("/object", translateObjectController);

export default router;

