import express from "express";
import {
  createLead,
  createPublicLead,
  createFormLead,
  getAllLeads,
  getLeadDetails,
  updateLead,
  deleteLead,
  assignLead,
  createFollowUp,
  getFollowUps,
  updateFollowUp,
  deleteFollowUp,
  getTeamMembers,
} from "../controllers/crmController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Team members
router.get("/team-members", authenticate, getTeamMembers);

// Leads
// Public endpoints for form submissions (no authentication required)
router.post("/leads/public", createPublicLead);
router.post("/leads/form", createFormLead);
router.post("/leads", authenticate, createLead);
router.get("/leads", authenticate, getAllLeads);
router.get("/leads/:leadId", authenticate, getLeadDetails);
router.put("/leads/:leadId", authenticate, updateLead);
router.delete("/leads/:leadId", authenticate, deleteLead);
router.post("/leads/:leadId/assign", authenticate, assignLead);

// Follow-ups
router.post("/follow-ups", authenticate, createFollowUp);
router.get("/follow-ups", authenticate, getFollowUps);
router.put("/follow-ups/:followUpId", authenticate, updateFollowUp);
router.delete("/follow-ups/:followUpId", authenticate, deleteFollowUp);

export default router;

