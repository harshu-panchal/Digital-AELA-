import mongoose from "mongoose";
import Announcement from "../models/Announcement.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import { getSocketIO } from "../utils/socketEmitter.js";

/**
 * Create Announcement
 * POST /api/v1/announcements
 */
export const createAnnouncement = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const announcementData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher" && userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and admins can create announcements",
        },
      });
    }

    if (!announcementData.title || !announcementData.content) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title and content are required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Validate target courses if specified
    if (announcementData.targetCourses && announcementData.targetCourses.length > 0) {
      const courses = await Course.find({
        _id: { $in: announcementData.targetCourses },
      });
      if (courses.length !== announcementData.targetCourses.length) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "One or more target courses not found",
          },
        });
      }
    }

    const announcement = await Announcement.create({
      ...announcementData,
      createdBy: userObjectId,
      status: announcementData.status || "draft",
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate("createdBy", "fullName email profilePicture")
      .populate("targetCourses", "title")
      .populate("targetUsers", "fullName email")
      .lean();

    return res.status(201).json({
      announcement: populatedAnnouncement,
      message: "Announcement created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get All Announcements
 * GET /api/v1/announcements
 */
export const getAllAnnouncements = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const {
      page = 1,
      pageSize = 20,
      status,
      targetAudience,
      priority,
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

    const query = {};

    // Teachers see only their announcements, admins see all
    if (userRole === "teacher") {
      query.createdBy = mongoose.isValidObjectId(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;
    } else if (userRole !== "super-admin" && userRole !== "admin") {
      // Students see only published announcements
      query.status = "published";
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ];
    }

    if (status) query.status = status;
    if (targetAudience) query.targetAudience = targetAudience;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate("createdBy", "fullName email profilePicture")
        .populate("targetCourses", "title")
        .populate("targetUsers", "fullName email")
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Announcement.countDocuments(query),
    ]);

    return res.json({
      announcements,
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
 * Get Announcement Details
 * GET /api/v1/announcements/:announcementId
 */
export const getAnnouncementDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { announcementId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(announcementId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid announcement ID",
        },
      });
    }

    const announcement = await Announcement.findById(announcementId)
      .populate("createdBy", "fullName email profilePicture")
      .populate("targetCourses", "title")
      .populate("targetUsers", "fullName email")
      .populate("readBy.user", "fullName email")
      .lean();

    if (!announcement) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Announcement not found",
        },
      });
    }

    // Check access permissions
    if (userRole === "student") {
      if (announcement.status !== "published") {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You can only view published announcements",
          },
        });
      }

      // Check if announcement has expired
      if (announcement.expiresAt && new Date(announcement.expiresAt) < new Date()) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "This announcement has expired",
          },
        });
      }

      // Check if student is in target audience
      const userObjectId = mongoose.isValidObjectId(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;

      if (announcement.targetAudience === "specific_course" || announcement.targetAudience === "specific_courses") {
        if (!announcement.targetCourses || announcement.targetCourses.length === 0) {
          return res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "This announcement is not available to you",
            },
          });
        }

        // Check if student is enrolled in any of the target courses
        const enrollments = await Enrollment.find({
          student: userObjectId,
          course: { $in: announcement.targetCourses.map((c) => c._id || c) },
        });

        if (enrollments.length === 0) {
          return res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "This announcement is not available to you",
            },
          });
        }
      } else if (announcement.targetAudience === "targetUsers") {
        const targetUserIds = announcement.targetUsers?.map((u) => u._id?.toString() || u.toString()) || [];
        if (!targetUserIds.includes(userId)) {
          return res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "This announcement is not available to you",
            },
          });
        }
      }
    } else if (userRole === "teacher") {
      if (announcement.createdBy._id.toString() !== userId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You can only view your own announcements",
          },
        });
      }
    }

    return res.json({
      announcement,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update Announcement
 * PUT /api/v1/announcements/:announcementId
 */
export const updateAnnouncement = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { announcementId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher" && userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and admins can update announcements",
        },
      });
    }

    if (!mongoose.isValidObjectId(announcementId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid announcement ID",
        },
      });
    }

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Announcement not found",
        },
      });
    }

    // Teachers can only update their own announcements
    if (userRole === "teacher" && announcement.createdBy.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only update your own announcements",
        },
      });
    }

    // If status is being updated to published, set publishedAt
    if (updateData.status === "published" && !announcement.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(announcementId, updateData, { new: true })
      .populate("createdBy", "fullName email profilePicture")
      .populate("targetCourses", "title")
      .populate("targetUsers", "fullName email")
      .lean();

    return res.json({
      announcement: updatedAnnouncement,
      message: "Announcement updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete Announcement
 * DELETE /api/v1/announcements/:announcementId
 */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { announcementId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher" && userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and admins can delete announcements",
        },
      });
    }

    if (!mongoose.isValidObjectId(announcementId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid announcement ID",
        },
      });
    }

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Announcement not found",
        },
      });
    }

    // Teachers can only delete their own announcements
    if (userRole === "teacher" && announcement.createdBy.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only delete your own announcements",
        },
      });
    }

    await Announcement.findByIdAndDelete(announcementId);

    return res.json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Publish Announcement
 * POST /api/v1/announcements/:announcementId/publish
 */
export const publishAnnouncement = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { announcementId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher" && userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and admins can publish announcements",
        },
      });
    }

    if (!mongoose.isValidObjectId(announcementId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid announcement ID",
        },
      });
    }

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Announcement not found",
        },
      });
    }

    // Teachers can only publish their own announcements
    if (userRole === "teacher" && announcement.createdBy.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only publish your own announcements",
        },
      });
    }

    announcement.status = "published";
    announcement.publishedAt = new Date();
    await announcement.save();

    // Get target users
    let targetUserIds = [];

    if (announcement.targetAudience === "all_students") {
      const students = await User.find({ role: "student" }).select("_id").lean();
      targetUserIds = students.map((s) => s._id);
    } else if (announcement.targetAudience === "all_teachers") {
      const teachers = await User.find({ role: "teacher" }).select("_id").lean();
      targetUserIds = teachers.map((t) => t._id);
    } else if (announcement.targetAudience === "specific_course" || announcement.targetAudience === "specific_courses") {
      if (announcement.targetCourses && announcement.targetCourses.length > 0) {
        const enrollments = await Enrollment.find({
          course: { $in: announcement.targetCourses },
        }).select("student").lean();
        targetUserIds = [...new Set(enrollments.map((e) => e.student.toString()))].map(
          (id) => new mongoose.Types.ObjectId(id)
        );
      }
    } else if (announcement.targetAudience === "enrolled_students") {
      // Get all enrolled students
      const enrollments = await Enrollment.find().select("student").lean();
      targetUserIds = [...new Set(enrollments.map((e) => e.student.toString()))].map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    } else if (announcement.targetUsers && announcement.targetUsers.length > 0) {
      targetUserIds = announcement.targetUsers;
    }

    // Create notifications for all target users
    if (targetUserIds.length > 0) {
      const notifications = targetUserIds.map((userId) => ({
        user: userId,
        type: "announcement",
        title: "New Announcement",
        description: announcement.title,
        metadata: {
          announcementId: announcement._id.toString(),
        },
        isRead: false,
        actionUrl: `/announcements/${announcement._id}`,
      }));

      await Notification.insertMany(notifications);

      // Emit socket events
      const io = getSocketIO();
      if (io) {
        targetUserIds.forEach((userId) => {
          io.to(`user:${userId.toString()}`).emit("new_announcement", {
            announcement: {
              id: announcement._id,
              title: announcement.title,
              content: announcement.content,
              createdBy: announcement.createdBy,
              priority: announcement.priority,
            },
          });
        });
      }
    }

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate("createdBy", "fullName email profilePicture")
      .populate("targetCourses", "title")
      .populate("targetUsers", "fullName email")
      .lean();

    return res.json({
      announcement: populatedAnnouncement,
      message: "Announcement published successfully",
      recipientsCount: targetUserIds.length,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark Announcement as Read
 * POST /api/v1/announcements/:announcementId/read
 */
export const markAnnouncementAsRead = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { announcementId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(announcementId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid announcement ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Announcement not found",
        },
      });
    }

    // Check if already read
    const alreadyRead = announcement.readBy.some(
      (read) => read.user.toString() === userId
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        user: userObjectId,
        readAt: new Date(),
      });
      await announcement.save();
    }

    return res.json({
      message: "Announcement marked as read",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Announcement Stats
 * GET /api/v1/announcements/stats
 */
export const getAnnouncementStats = async (req, res, next) => {
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

    if (userRole === "teacher") {
      const [total, draft, published, scheduled, archived] = await Promise.all([
        Announcement.countDocuments({ createdBy: userObjectId }),
        Announcement.countDocuments({ createdBy: userObjectId, status: "draft" }),
        Announcement.countDocuments({ createdBy: userObjectId, status: "published" }),
        Announcement.countDocuments({ createdBy: userObjectId, status: "scheduled" }),
        Announcement.countDocuments({ createdBy: userObjectId, status: "archived" }),
      ]);

      stats = { total, draft, published, scheduled, archived };
    } else if (userRole === "super-admin" || userRole === "admin") {
      const [total, draft, published, scheduled, archived] = await Promise.all([
        Announcement.countDocuments({}),
        Announcement.countDocuments({ status: "draft" }),
        Announcement.countDocuments({ status: "published" }),
        Announcement.countDocuments({ status: "scheduled" }),
        Announcement.countDocuments({ status: "archived" }),
      ]);

      stats = { total, draft, published, scheduled, archived };
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

/**
 * Get Student Announcements
 * GET /api/v1/announcements/student
 */
export const getStudentAnnouncements = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { page = 1, pageSize = 20 } = req.query;

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

    // Get user's enrolled courses
    const enrollments = await Enrollment.find({ student: userObjectId }).select("course").lean();
    const enrolledCourseIds = enrollments.map((e) => e.course);

    // Build query for announcements visible to this student
    const query = {
      status: "published",
      $or: [
        { targetAudience: "all_students" },
        { targetAudience: "enrolled_students" },
        {
          targetAudience: { $in: ["specific_course", "specific_courses"] },
          targetCourses: { $in: enrolledCourseIds },
        },
      ],
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gte: new Date() } },
          ],
        },
      ],
    };

    const skip = (Number(page) - 1) * Number(pageSize);

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate("createdBy", "fullName email profilePicture")
        .populate("targetCourses", "title")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Announcement.countDocuments(query),
    ]);

    // Mark which announcements have been read
    const announcementsWithReadStatus = announcements.map((announcement) => {
      const isRead = announcement.readBy?.some(
        (read) => read.user?.toString() === userId || read.user?._id?.toString() === userId
      );
      return {
        ...announcement,
        isRead,
      };
    });

    return res.json({
      announcements: announcementsWithReadStatus,
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

