import mongoose from "mongoose";
import Lead from "../models/Lead.js";
import FollowUp from "../models/FollowUp.js";
import User from "../models/User.js";

/**
 * Create Lead
 * POST /api/v1/crm/leads
 */
export const createLead = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const leadData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can create leads",
        },
      });
    }

    if (!leadData.email || !leadData.firstName) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and first name are required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Check if lead with same email exists
    const existingLead = await Lead.findOne({ email: leadData.email.toLowerCase() }).lean();
    if (existingLead) {
      return res.status(409).json({
        error: {
          code: "ALREADY_EXISTS",
          message: "Lead with this email already exists",
          lead: existingLead,
        },
      });
    }

    const lead = await Lead.create({
      ...leadData,
      email: leadData.email.toLowerCase(),
      createdBy: userObjectId,
      status: leadData.status || "new",
    });

    const populatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "fullName email")
      .populate("assignedBy", "fullName")
      .populate("createdBy", "fullName")
      .lean();

    return res.status(201).json({
      lead: populatedLead,
      message: "Lead created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get All Leads
 * GET /api/v1/crm/leads
 */
export const getAllLeads = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const {
      page = 1,
      pageSize = 20,
      status,
      priority,
      source,
      assignedTo,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view leads",
        },
      });
    }

    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;
    if (assignedTo && mongoose.isValidObjectId(assignedTo)) {
      query.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate("assignedTo", "fullName email")
        .populate("assignedBy", "fullName")
        .populate("createdBy", "fullName")
        .populate("convertedTo", "fullName email")
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Lead.countDocuments(query),
    ]);

    // Get statistics
    const stats = {
      total: await Lead.countDocuments(),
      new: await Lead.countDocuments({ status: "new" }),
      contacted: await Lead.countDocuments({ status: "contacted" }),
      qualified: await Lead.countDocuments({ status: "qualified" }),
      converted: await Lead.countDocuments({ status: "converted" }),
      lost: await Lead.countDocuments({ status: "lost" }),
    };

    return res.json({
      leads,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
      stats,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Lead Details
 * GET /api/v1/crm/leads/:leadId
 */
export const getLeadDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { leadId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view leads",
        },
      });
    }

    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid lead ID",
        },
      });
    }

    const lead = await Lead.findById(leadId)
      .populate("assignedTo", "fullName email")
      .populate("assignedBy", "fullName")
      .populate("createdBy", "fullName")
      .populate("convertedTo", "fullName email")
      .lean();

    if (!lead) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Lead not found",
        },
      });
    }

    // Get follow-ups for this lead
    const followUps = await FollowUp.find({ lead: new mongoose.Types.ObjectId(leadId) })
      .populate("assignedTo", "fullName email")
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      lead,
      followUps,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update Lead
 * PUT /api/v1/crm/leads/:leadId
 */
export const updateLead = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { leadId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can update leads",
        },
      });
    }

    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid lead ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // If status is being updated to converted, set convertedAt
    if (updateData.status === "converted" && !updateData.convertedAt) {
      updateData.convertedAt = new Date();
    }

    // If assignedTo is being updated, set assignedBy and assignedAt
    if (updateData.assignedTo) {
      updateData.assignedBy = userObjectId;
      updateData.assignedAt = new Date();
    }

    // If status is being updated, update lastContactedAt
    if (updateData.status && updateData.status !== "new") {
      updateData.lastContactedAt = new Date();
    }

    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    const lead = await Lead.findByIdAndUpdate(leadId, updateData, { new: true })
      .populate("assignedTo", "fullName email")
      .populate("assignedBy", "fullName")
      .populate("createdBy", "fullName")
      .populate("convertedTo", "fullName email")
      .lean();

    if (!lead) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Lead not found",
        },
      });
    }

    return res.json({
      lead,
      message: "Lead updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete Lead
 * DELETE /api/v1/crm/leads/:leadId
 */
export const deleteLead = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { leadId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can delete leads",
        },
      });
    }

    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid lead ID",
        },
      });
    }

    // Delete associated follow-ups
    await FollowUp.deleteMany({ lead: new mongoose.Types.ObjectId(leadId) });

    const lead = await Lead.findByIdAndDelete(leadId).lean();

    if (!lead) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Lead not found",
        },
      });
    }

    return res.json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Assign Lead to Team Member
 * POST /api/v1/crm/leads/:leadId/assign
 */
export const assignLead = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { leadId } = req.params;
    const { assignedTo } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can assign leads",
        },
      });
    }

    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid lead ID",
        },
      });
    }

    if (!assignedTo || !mongoose.isValidObjectId(assignedTo)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid assignedTo user ID is required",
        },
      });
    }

    // Verify user exists
    const assignedUser = await User.findById(assignedTo).lean();
    if (!assignedUser) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Assigned user not found",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        assignedTo: new mongoose.Types.ObjectId(assignedTo),
        assignedBy: userObjectId,
        assignedAt: new Date(),
      },
      { new: true }
    )
      .populate("assignedTo", "fullName email")
      .populate("assignedBy", "fullName")
      .lean();

    if (!lead) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Lead not found",
        },
      });
    }

    return res.json({
      lead,
      message: "Lead assigned successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create Follow-Up
 * POST /api/v1/crm/follow-ups
 */
export const createFollowUp = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const followUpData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can create follow-ups",
        },
      });
    }

    if (!followUpData.lead || !followUpData.subject) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Lead ID and subject are required",
        },
      });
    }

    if (!mongoose.isValidObjectId(followUpData.lead)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid lead ID",
        },
      });
    }

    // Verify lead exists
    const lead = await Lead.findById(followUpData.lead).lean();
    if (!lead) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Lead not found",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const followUp = await FollowUp.create({
      ...followUpData,
      lead: new mongoose.Types.ObjectId(followUpData.lead),
      createdBy: userObjectId,
      assignedTo: followUpData.assignedTo
        ? new mongoose.Types.ObjectId(followUpData.assignedTo)
        : userObjectId,
      status: followUpData.status || "scheduled",
    });

    // Update lead's nextFollowUpAt if scheduled
    if (followUp.scheduledAt || followUp.nextFollowUpDate) {
      await Lead.findByIdAndUpdate(followUpData.lead, {
        nextFollowUpAt: followUp.scheduledAt || followUp.nextFollowUpDate,
        lastContactedAt: new Date(),
      });
    }

    const populatedFollowUp = await FollowUp.findById(followUp._id)
      .populate("lead", "firstName lastName email")
      .populate("assignedTo", "fullName email")
      .populate("createdBy", "fullName")
      .lean();

    return res.status(201).json({
      followUp: populatedFollowUp,
      message: "Follow-up created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Follow-Ups
 * GET /api/v1/crm/follow-ups
 */
export const getFollowUps = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const {
      page = 1,
      pageSize = 20,
      leadId,
      status,
      assignedTo,
      type,
      overdue,
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view follow-ups",
        },
      });
    }

    const query = {};

    if (leadId && mongoose.isValidObjectId(leadId)) {
      query.lead = new mongoose.Types.ObjectId(leadId);
    }
    if (status) query.status = status;
    if (type) query.type = type;
    if (assignedTo && mongoose.isValidObjectId(assignedTo)) {
      query.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    }
    if (overdue === "true") {
      query.status = "overdue";
      query.scheduledAt = { $lt: new Date() };
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [followUps, total] = await Promise.all([
      FollowUp.find(query)
        .populate("lead", "firstName lastName email status")
        .populate("assignedTo", "fullName email")
        .populate("createdBy", "fullName")
        .sort({ scheduledAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      FollowUp.countDocuments(query),
    ]);

    return res.json({
      followUps,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update Follow-Up
 * PUT /api/v1/crm/follow-ups/:followUpId
 */
export const updateFollowUp = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { followUpId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can update follow-ups",
        },
      });
    }

    if (!mongoose.isValidObjectId(followUpId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid follow-up ID",
        },
      });
    }

    // If status is being updated to completed, set completedAt
    if (updateData.status === "completed" && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const followUp = await FollowUp.findByIdAndUpdate(followUpId, updateData, { new: true })
      .populate("lead", "firstName lastName email")
      .populate("assignedTo", "fullName email")
      .populate("createdBy", "fullName")
      .lean();

    if (!followUp) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Follow-up not found",
        },
      });
    }

    // Update lead's nextFollowUpAt if nextFollowUpDate is set
    if (updateData.nextFollowUpDate && followUp.lead) {
      await Lead.findByIdAndUpdate(followUp.lead._id || followUp.lead, {
        nextFollowUpAt: updateData.nextFollowUpDate,
      });
    }

    return res.json({
      followUp,
      message: "Follow-up updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete Follow-Up
 * DELETE /api/v1/crm/follow-ups/:followUpId
 */
export const deleteFollowUp = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { followUpId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can delete follow-ups",
        },
      });
    }

    if (!mongoose.isValidObjectId(followUpId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid follow-up ID",
        },
      });
    }

    const followUp = await FollowUp.findByIdAndDelete(followUpId).lean();

    if (!followUp) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Follow-up not found",
        },
      });
    }

    return res.json({
      message: "Follow-up deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create Public Lead (from Free Library form)
 * POST /api/v1/crm/leads/public
 */
export const createPublicLead = async (req, res, next) => {
  try {
    const leadData = req.body;
    const { firstName, lastName, email, phone, bookPreferences } = leadData;

    // Validation
    if (!email || !firstName) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and first name are required",
        },
      });
    }

    // Check if lead with same email exists
    const existingLead = await Lead.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existingLead) {
      return res.status(409).json({
        error: {
          code: "ALREADY_EXISTS",
          message: "This email is already registered. Please use a different email address.",
        },
      });
    }

    // Prepare customFields with book preferences
    const customFields = {};
    if (bookPreferences && Array.isArray(bookPreferences) && bookPreferences.length > 0) {
      customFields.bookPreferences = bookPreferences;
    }

    // Create description from book preferences if available
    let description = "";
    if (bookPreferences && Array.isArray(bookPreferences) && bookPreferences.length > 0) {
      description = `Book Preferences: ${bookPreferences.join(", ")}`;
    }

    const lead = await Lead.create({
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : "",
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "",
      source: "free_library",
      status: "new",
      priority: "medium",
      customFields,
      description: description || undefined,
    });

    const populatedLead = await Lead.findById(lead._id)
      .populate("assignedTo", "fullName email")
      .populate("assignedBy", "fullName")
      .populate("createdBy", "fullName")
      .lean();

    return res.status(201).json({
      lead: populatedLead,
      message: "Lead created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Team Members (for assignment)
 * GET /api/v1/crm/team-members
 */
export const getTeamMembers = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view team members",
        },
      });
    }

    // Get all admins and teachers for assignment
    const teamMembers = await User.find({
      role: { $in: ["super-admin", "teacher", "admin"] },
      isActive: true,
    })
      .select("fullName email role")
      .sort({ fullName: 1 })
      .lean();

    return res.json({
      teamMembers,
    });
  } catch (error) {
    return next(error);
  }
};

