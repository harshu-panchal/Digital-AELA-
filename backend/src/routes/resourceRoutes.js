import { Router } from "express";
import { getEbook, listEbooks } from "../controllers/resourceController.js";

const router = Router();

router.get("/ebooks", listEbooks);
router.get("/ebooks/:ebookId", getEbook);

export default router;

