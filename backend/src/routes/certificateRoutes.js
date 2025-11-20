import express from "express";
import {
  generateCertificate,
  getStudentCertificates,
  getCertificateDetails,
  downloadCertificatePDF,
  verifyCertificate,
  getAllCertificates,
  revokeCertificate,
  getCertificateTemplates,
  createCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
} from "../controllers/certificateController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/verify/:verificationCode", verifyCertificate);

// Student routes
router.get("/student", authenticate, getStudentCertificates);

// Admin routes
router.get("/", authenticate, getAllCertificates);
router.post("/generate", authenticate, generateCertificate);
router.get("/templates", authenticate, getCertificateTemplates);
router.post("/templates", authenticate, createCertificateTemplate);
router.put("/templates/:templateId", authenticate, updateCertificateTemplate);
router.delete("/templates/:templateId", authenticate, deleteCertificateTemplate);

// Common routes
router.get("/:certificateId", authenticate, getCertificateDetails);
router.get("/:certificateId/pdf", authenticate, downloadCertificatePDF);
router.delete("/:certificateId", authenticate, revokeCertificate);

export default router;

