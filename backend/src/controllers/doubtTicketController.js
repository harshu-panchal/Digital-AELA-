import mongoose from "mongoose";
import DoubtTicket from "../models/DoubtTicket.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

/**
 * Create Doubt Ticket
 * POST /api/v1/doubt-tickets
 */
export const createDoubtTicket = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const ticketData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "student") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only students can create doubt tickets",
        },
      });
    }

    if (!ticketData.title || !ticketData.description) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title and description are required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // If course is provided, verify enrollment
    if (ticketData.course) {
      const courseId = mongoose.isValidObjectId(ticketData.course)
        ? new mongoose.Types.ObjectId(ticketData.course)
        : null;

      if (courseId) {
        const enrollment = await Enrollment.findOne({
          student: userObjectId,
          course: courseId,
        });

        if (!enrollment) {
          return res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "You must be enrolled in the course to create a doubt ticket",
            },
          });
        }

        // Auto-assign to course teacher if not assigned
        if (!ticketData.assignedTeacher) {
          const course = await Course.findById(courseId).populate("teacher").lean();
          if (course && course.teacher) {
            ticketData.assignedTeacher = course.teacher._id || course.teacher;
          }
        }
      }
    }

    const ticket = await DoubtTicket.create({
      ...ticketData,
      student: userObjectId,
      status: "open",
    });

    const populatedTicket = await DoubtTicket.findById(ticket._id)
      .populate("student", "fullName email profilePicture")
      .populate("assignedTeacher", "fullName email profilePicture")
      .populate("course", "title")
      .populate("lesson", "title")
      .populate("replies.user", "fullName email profilePicture")
      .lean();

    return res.status(201).json({
      ticket: populatedTicket,
      message: "Doubt ticket created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get All Doubt Tickets (Student view - their tickets)
 * GET /api/v1/doubt-tickets
 */
export const getAllDoubtTickets = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const {
      page = 1,
      pageSize = 20,
      status,
      priority,
      category,
      course,
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

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const query = {};

    // Students see only their tickets, teachers see assigned tickets
    if (userRole === "student") {
      query.student = userObjectId;
    } else if (userRole === "teacher") {
      query.assignedTeacher = userObjectId;
    } else if (userRole === "super-admin" || userRole === "admin") {
      // Admins see all tickets
    } else {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      });
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (course) {
      query.course = mongoose.isValidObjectId(course)
        ? new mongoose.Types.ObjectId(course)
        : null;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [tickets, total] = await Promise.all([
      DoubtTicket.find(query)
        .populate("student", "fullName email profilePicture")
        .populate("assignedTeacher", "fullName email profilePicture")
        .populate("course", "title")
        .populate("lesson", "title")
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      DoubtTicket.countDocuments(query),
    ]);

    // Get stats for students and teachers
    let stats = null;
    if (userRole === "student") {
      const [open, inProgress, resolved, closed] = await Promise.all([
        DoubtTicket.countDocuments({ student: userObjectId, status: "open" }),
        DoubtTicket.countDocuments({ student: userObjectId, status: "in_progress" }),
        DoubtTicket.countDocuments({ student: userObjectId, status: "resolved" }),
        DoubtTicket.countDocuments({ student: userObjectId, status: "closed" }),
      ]);
      stats = { open, inProgress, resolved, closed };
    } else if (userRole === "teacher") {
      const [open, inProgress, resolved, closed] = await Promise.all([
        DoubtTicket.countDocuments({ assignedTeacher: userObjectId, status: "open" }),
        DoubtTicket.countDocuments({ assignedTeacher: userObjectId, status: "in_progress" }),
        DoubtTicket.countDocuments({ assignedTeacher: userObjectId, status: "resolved" }),
        DoubtTicket.countDocuments({ assignedTeacher: userObjectId, status: "closed" }),
      ]);
      stats = { open, inProgress, resolved, closed };
    }

    return res.json({
      tickets,
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
 * Get Doubt Ticket Details
 * GET /api/v1/doubt-tickets/:ticketId
 */
export const getDoubtTicketDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { ticketId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(ticketId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ticket ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const ticket = await DoubtTicket.findById(ticketId)
      .populate("student", "fullName email profilePicture")
      .populate("assignedTeacher", "fullName email profilePicture")
      .populate("course", "title")
      .populate("lesson", "title")
      .populate("replies.user", "fullName email profilePicture")
      .populate("resolvedBy", "fullName")
      .populate("closedBy", "fullName")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Doubt ticket not found",
        },
      });
    }

    // Check access permissions
    if (userRole === "student" && ticket.student._id.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only view your own tickets",
        },
      });
    }

    if (userRole === "teacher" && ticket.assignedTeacher?._id?.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only view tickets assigned to you",
        },
      });
    }

    return res.json({
      ticket,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Reply to Doubt Ticket
 * POST /api/v1/doubt-tickets/:ticketId/reply
 */
export const replyToDoubtTicket = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { ticketId } = req.params;
    const { message, attachments } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Message is required",
        },
      });
    }

    if (!mongoose.isValidObjectId(ticketId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ticket ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const ticket = await DoubtTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Doubt ticket not found",
        },
      });
    }

    // Check access permissions
    if (userRole === "student" && ticket.student.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only reply to your own tickets",
        },
      });
    }

    if (userRole === "teacher") {
      if (ticket.assignedTeacher?.toString() !== userId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You can only reply to tickets assigned to you",
          },
        });
      }
      // Auto-update status to in_progress when teacher replies
      if (ticket.status === "open") {
        ticket.status = "in_progress";
      }
    }

    // Add reply
    ticket.replies.push({
      user: userObjectId,
      message: message.trim(),
      attachments: attachments || [],
      isTeacherReply: userRole === "teacher",
    });

    await ticket.save();

    const populatedTicket = await DoubtTicket.findById(ticketId)
      .populate("student", "fullName email profilePicture")
      .populate("assignedTeacher", "fullName email profilePicture")
      .populate("course", "title")
      .populate("lesson", "title")
      .populate("replies.user", "fullName email profilePicture")
      .lean();

    return res.json({
      ticket: populatedTicket,
      message: "Reply added successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update Doubt Ticket Status
 * PUT /api/v1/doubt-tickets/:ticketId/status
 */
export const updateDoubtTicketStatus = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!status || !["open", "in_progress", "resolved", "closed"].includes(status)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid status is required",
        },
      });
    }

    if (!mongoose.isValidObjectId(ticketId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ticket ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const ticket = await DoubtTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Doubt ticket not found",
        },
      });
    }

    // Check permissions
    if (userRole === "student" && ticket.student.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only update your own tickets",
        },
      });
    }

    if (userRole === "teacher" && ticket.assignedTeacher?.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only update tickets assigned to you",
        },
      });
    }

    // Update status
    ticket.status = status;

    if (status === "resolved") {
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = userObjectId;
    }

    if (status === "closed") {
      ticket.closedAt = new Date();
      ticket.closedBy = userObjectId;
    }

    await ticket.save();

    const populatedTicket = await DoubtTicket.findById(ticketId)
      .populate("student", "fullName email profilePicture")
      .populate("assignedTeacher", "fullName email profilePicture")
      .populate("course", "title")
      .populate("lesson", "title")
      .populate("replies.user", "fullName email profilePicture")
      .populate("resolvedBy", "fullName")
      .populate("closedBy", "fullName")
      .lean();

    return res.json({
      ticket: populatedTicket,
      message: "Ticket status updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Assign Doubt Ticket to Teacher
 * PUT /api/v1/doubt-tickets/:ticketId/assign
 */
export const assignDoubtTicket = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { ticketId } = req.params;
    const { teacherId } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin" && userRole !== "admin" && userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins and teachers can assign tickets",
        },
      });
    }

    if (!teacherId || !mongoose.isValidObjectId(teacherId)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid teacher ID is required",
        },
      });
    }

    if (!mongoose.isValidObjectId(ticketId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ticket ID",
        },
      });
    }

    // Verify teacher exists and is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Teacher not found",
        },
      });
    }

    const ticket = await DoubtTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Doubt ticket not found",
        },
      });
    }

    ticket.assignedTeacher = teacherId;
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    const populatedTicket = await DoubtTicket.findById(ticketId)
      .populate("student", "fullName email profilePicture")
      .populate("assignedTeacher", "fullName email profilePicture")
      .populate("course", "title")
      .populate("lesson", "title")
      .populate("replies.user", "fullName email profilePicture")
      .lean();

    return res.json({
      ticket: populatedTicket,
      message: "Ticket assigned successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Dashboard Stats
 * GET /api/v1/doubt-tickets/stats
 */
export const getDoubtTicketStats = async (req, res, next) => {
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

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    let stats = {};

    if (userRole === "student") {
      const [total, open, inProgress, resolved, closed] = await Promise.all([
        DoubtTicket.countDocuments({ student: userObjectId }),
        DoubtTicket.countDocuments({ student: userObjectId, status: "open" }),
        DoubtTicket.countDocuments({ student: userObjectId, status: "in_progress" }),
        DoubtTicket.countDocuments({ student: userObjectId, status: "resolved" }),
        DoubtTicket.countDocuments({ student: userObjectId, status: "closed" }),
      ]);

      stats = { total, open, inProgress, resolved, closed };
    } else if (userRole === "teacher") {
      const [total, open, inProgress, resolved, closed] = await Promise.all([
        DoubtTicket.countDocuments({ assignedTeacher: userObjectId }),
        DoubtTicket.countDocuments({ assignedTeacher: userObjectId, status: "open" }),
        DoubtTicket.countDocuments({ assignedTeacher: userObjectId, status: "in_progress" }),
        DoubtTicket.countDocuments({ assignedTeacher: userObjectId, status: "resolved" }),
        DoubtTicket.countDocuments({ assignedTeacher: userObjectId, status: "closed" }),
      ]);

      stats = { total, open, inProgress, resolved, closed };
    } else if (userRole === "super-admin" || userRole === "admin") {
      const [total, open, inProgress, resolved, closed] = await Promise.all([
        DoubtTicket.countDocuments({}),
        DoubtTicket.countDocuments({ status: "open" }),
        DoubtTicket.countDocuments({ status: "in_progress" }),
        DoubtTicket.countDocuments({ status: "resolved" }),
        DoubtTicket.countDocuments({ status: "closed" }),
      ]);

      stats = { total, open, inProgress, resolved, closed };
    } else {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      });
    }

    return res.json({
      stats,
    });
  } catch (error) {
    return next(error);
  }
};

