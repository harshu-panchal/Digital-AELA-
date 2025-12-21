import express from "express";
import {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router
    .route("/")
    .get(getCategories)
    .post(requireAuth(["super-admin"]), createCategory);

router.route("/:slug").get(getCategory);

router
    .route("/id/:id")
    .put(requireAuth(["super-admin"]), updateCategory)
    .delete(requireAuth(["super-admin"]), deleteCategory);

export default router;
