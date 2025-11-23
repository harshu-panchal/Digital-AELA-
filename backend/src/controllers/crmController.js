import mongoose from "mongoose";
import Lead from "../models/Lead.js";
import FollowUp from "../models/FollowUp.js";
import User from "../models/User.js";
import JoinUsApplication from "../models/JoinUsApplication.js";

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
 * Create Form Lead (from Book Demo, Business Collaboration, Franchise Partnership forms)
 * POST /api/v1/crm/leads/form
 */
export const createFormLead = async (req, res, next) => {
  try {
    const formData = req.body;
    const { formId, ...payload } = formData;

    if (!formId) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Form ID is required",
        },
      });
    }

    // Map formId to source enum for backward compatibility
    const sourceMap = {
      "book-demo": "book_demo",
      "business-collaboration": "business_collaboration",
      "franchise-inquiry": "franchise_inquiry",
      "general-inquiry": "website",
      "request-callback": "website",
      "workshop-enrollment": "website",
    };

    // Use mapped source or default to "website" for new form types
    const source = sourceMap[formId] || "website";

    // Extract and map fields based on form type
    let firstName = "";
    let lastName = "";
    let email = "";
    let phone = "";
    let company = "";
    let description = "";
    const customFields = {};

    if (source === "book_demo") {
      // BookDemo form fields: firstName, lastName, email, phone, preferredCourse, preferredMode, preferredDate, preferredTime, organization, participants, goals
      firstName = payload.firstName?.trim() || "";
      lastName = payload.lastName?.trim() || "";
      email = payload.email?.toLowerCase().trim() || "";
      phone = payload.phone?.trim() || "";
      company = payload.organization?.trim() || "";

      // Store form-specific fields in customFields
      if (payload.preferredCourse) customFields.preferredCourse = payload.preferredCourse;
      if (payload.preferredMode) customFields.preferredMode = payload.preferredMode;
      if (payload.preferredDate) customFields.preferredDate = payload.preferredDate;
      if (payload.preferredTime) customFields.preferredTime = payload.preferredTime;
      if (payload.organization) customFields.organization = payload.organization;
      if (payload.participants) customFields.participants = payload.participants;
      if (payload.goals) customFields.goals = payload.goals;

      // Create description
      const descParts = [];
      if (payload.preferredCourse) descParts.push(`Course: ${payload.preferredCourse}`);
      if (payload.preferredMode) descParts.push(`Mode: ${payload.preferredMode}`);
      if (payload.preferredDate) descParts.push(`Date: ${payload.preferredDate}`);
      if (payload.participants) descParts.push(`Participants: ${payload.participants}`);
      if (payload.goals) descParts.push(`Goals: ${payload.goals}`);
      description = descParts.join(" | ");
    } else if (source === "business_collaboration") {
      // BusinessCollaboration form fields: companyName, contactPerson, email, phone, companyWebsite, industry, teamSize, collaborationType, location, timeline, message
      const contactPerson = payload.contactPerson?.trim() || "";
      // Try to split contactPerson into firstName and lastName
      const nameParts = contactPerson.split(" ");
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
      email = payload.email?.toLowerCase().trim() || "";
      phone = payload.phone?.trim() || "";
      company = payload.companyName?.trim() || "";

      // Store form-specific fields in customFields
      if (payload.companyName) customFields.companyName = payload.companyName;
      if (payload.contactPerson) customFields.contactPerson = payload.contactPerson;
      if (payload.companyWebsite) customFields.companyWebsite = payload.companyWebsite;
      if (payload.industry) customFields.industry = payload.industry;
      if (payload.teamSize) customFields.teamSize = payload.teamSize;
      if (payload.collaborationType) customFields.collaborationType = payload.collaborationType;
      if (payload.location) customFields.location = payload.location;
      if (payload.timeline) customFields.timeline = payload.timeline;
      if (payload.message) customFields.message = payload.message;

      // Create description
      const descParts = [];
      if (payload.companyName) descParts.push(`Company: ${payload.companyName}`);
      if (payload.industry) descParts.push(`Industry: ${payload.industry}`);
      if (payload.collaborationType) descParts.push(`Type: ${payload.collaborationType}`);
      if (payload.timeline) descParts.push(`Timeline: ${payload.timeline}`);
      if (payload.message) descParts.push(`Message: ${payload.message}`);
      description = descParts.join(" | ");
    } else if (source === "franchise_inquiry") {
      // FranchiseInquiry form fields: fullName, email, phone, city, country, investmentCapacity, experience, timeframe, hearAbout, message
      const fullName = payload.fullName?.trim() || "";
      // Try to split fullName into firstName and lastName
      const nameParts = fullName.split(" ");
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
      email = payload.email?.toLowerCase().trim() || "";
      phone = payload.phone?.trim() || "";

      // Store form-specific fields in customFields
      if (payload.fullName) customFields.fullName = payload.fullName;
      if (payload.city) customFields.city = payload.city;
      if (payload.country) customFields.country = payload.country;
      if (payload.investmentCapacity) customFields.investmentCapacity = payload.investmentCapacity;
      if (payload.experience) customFields.experience = payload.experience;
      if (payload.timeframe) customFields.timeframe = payload.timeframe;
      if (payload.hearAbout) customFields.hearAbout = payload.hearAbout;
      if (payload.message) customFields.message = payload.message;

      // Create description
      const descParts = [];
      if (payload.city) descParts.push(`City: ${payload.city}`);
      if (payload.country) descParts.push(`Country: ${payload.country}`);
      if (payload.investmentCapacity) descParts.push(`Investment: ${payload.investmentCapacity}`);
      if (payload.experience) descParts.push(`Experience: ${payload.experience}`);
      if (payload.timeframe) descParts.push(`Timeframe: ${payload.timeframe}`);
      if (payload.message) descParts.push(`Message: ${payload.message}`);
      description = descParts.join(" | ");
    } else {
      // Handle other form types (general-inquiry, request-callback, workshop-enrollment, etc.)
      // Generic extraction for forms with fullName or firstName/lastName
      if (payload.fullName) {
        const fullName = payload.fullName?.trim() || "";
        const nameParts = fullName.split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      } else {
        firstName = payload.firstName?.trim() || "";
        lastName = payload.lastName?.trim() || "";
      }
      
      email = payload.email?.toLowerCase().trim() || "";
      phone = payload.phone?.trim() || "";
      company = payload.company?.trim() || payload.organizationName?.trim() || payload.companyName?.trim() || "";

      // Store all other fields in customFields
      Object.keys(payload).forEach((key) => {
        if (!["firstName", "lastName", "fullName", "email", "phone", "company", "organizationName", "companyName"].includes(key)) {
          if (payload[key]) {
            customFields[key] = payload[key];
          }
        }
      });

      // Create description from key fields
      const descParts = [];
      if (payload.subject) descParts.push(`Subject: ${payload.subject}`);
      if (payload.message) descParts.push(`Message: ${payload.message}`);
      if (payload.callPurpose) descParts.push(`Purpose: ${payload.callPurpose}`);
      if (payload.workshopSelection) descParts.push(`Workshop: ${payload.workshopSelection}`);
      if (payload.department) descParts.push(`Department: ${payload.department}`);
      description = descParts.length > 0 ? descParts.join(" | ") : undefined;
    }

    // Validation
    if (!email || !firstName) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and first name are required",
        },
      });
    }

    // Note: We allow duplicate emails as per requirement (create separate leads)
    // No duplicate check needed

    const lead = await Lead.create({
      firstName: firstName.trim(),
      lastName: lastName.trim() || "",
      email: email.toLowerCase().trim(),
      phone: phone.trim() || "",
      company: company.trim() || "",
      source: source,
      formSource: formId, // Store the exact form ID that generated this lead
      status: "new",
      priority: "medium",
      customFields: customFields,
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
 * Check if form has been submitted by email
 * GET /api/v1/crm/leads/check-submission?email=xxx&formId=xxx
 */
export const checkFormSubmission = async (req, res, next) => {
  try {
    const { email, formId } = req.query;

    if (!email || !formId) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and formId are required",
        },
      });
    }

    // Check if it's a join-us form (teacher or influencer)
    if (formId === "teacher" || formId === "influencer") {
      const application = await JoinUsApplication.findOne({
        applicationType: formId,
        "formData.email": email.toLowerCase().trim(),
      })
        .select("status submittedAt")
        .lean();

      if (application) {
        return res.json({
          submitted: true,
          status: application.status,
          submittedAt: application.submittedAt,
        });
      }
    } else {
      // Check contact forms in Lead model
      const lead = await Lead.findOne({
        email: email.toLowerCase().trim(),
        formSource: formId,
      })
        .select("status createdAt")
        .lean();

      if (lead) {
        return res.json({
          submitted: true,
          status: lead.status,
          submittedAt: lead.createdAt,
        });
      }
    }

    return res.json({
      submitted: false,
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

