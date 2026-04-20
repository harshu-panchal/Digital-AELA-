import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import BranchMembership from "../models/BranchMembership.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import EbookResource from "../models/EbookResource.js";
import Announcement from "../models/Announcement.js";
import StudentProfile from "../models/StudentProfile.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import { validateObjectId } from "../services/branchService.js";

const text = (value) => String(value || "").trim();

const getPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page || "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(query.pageSize || "20", 10))
  );
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
};

const ensureBranch = (req, res) => {
  if (!req.branch) {
    res.status(404).json({
      error: {
        code: "BRANCH_NOT_FOUND",
        message: "No branch is linked to this branch owner account",
      },
    });
    return null;
  }
  return req.branch;
};

const branchObjectId = (branch) =>
  branch?._id instanceof mongoose.Types.ObjectId
    ? branch._id
    : new mongoose.Types.ObjectId(branch._id);

const buildUserQuery = (branchId, role, queryParams) => {
  const query = {
    branchId,
    branchJoinType: "branch",
  };

  if (role) query.role = role;
  if (queryParams.status) query.approvalStatus = queryParams.status;
  if (queryParams.search) {
    query.$or = [
      { fullName: { $regex: text(queryParams.search), $options: "i" } },
      { email: { $regex: text(queryParams.search), $options: "i" } },
    ];
  }

  return query;
};

export const getBranchOwnerProfile = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const owner = await User.findById(req.auth.userId)
      .select("-passwordHash")
      .lean();

    return res.json({ branch, owner });
  } catch (error) {
    return next(error);
  }
};

export const updateBranchOwnerProfile = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const allowedFields = [
      "instituteName",
      "branchName",
      "contactEmail",
      "contactPhone",
      "address",
      "city",
      "state",
      "country",
      "postalCode",
      "description",
      "logoUrl",
      "bannerUrl",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = text(req.body[field]);
    }

    if (updates.contactEmail) {
      updates.contactEmail = updates.contactEmail.toLowerCase();
    }

    const updatedBranch = await Branch.findByIdAndUpdate(branch._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.json({
      branch: updatedBranch,
      message: "Branch profile updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const getBranchDashboard = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const [
      totalTeachers,
      totalStudents,
      pendingTeachers,
      pendingStudents,
      totalCourses,
      pendingCourses,
      totalBooks,
      pendingBooks,
      totalAnnouncements,
      recentUsers,
      recentCourses,
      recentBooks,
    ] = await Promise.all([
      User.countDocuments({ branchId, role: "teacher" }),
      User.countDocuments({ branchId, role: "student" }),
      User.countDocuments({ branchId, role: "teacher", approvalStatus: "pending" }),
      User.countDocuments({ branchId, role: "student", approvalStatus: "pending" }),
      Course.countDocuments({ branchId }),
      Course.countDocuments({ branchId, approvalStatus: "pending" }),
      EbookResource.countDocuments({ branchId }),
      EbookResource.countDocuments({ branchId, approvalStatus: "pending" }),
      Announcement.countDocuments({ branchId }),
      User.find({ branchId, role: { $in: ["teacher", "student"] } })
        .select("fullName email role approvalStatus createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Course.find({ branchId })
        .select("title status approvalStatus createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      EbookResource.find({ branchId })
        .select("title isPublic approvalStatus createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return res.json({
      branch,
      stats: {
        totalTeachers,
        totalStudents,
        pendingApprovals: pendingTeachers + pendingStudents,
        pendingTeachers,
        pendingStudents,
        totalCourses,
        pendingCourses,
        totalBooks,
        pendingBooks,
        totalAnnouncements,
      },
      recentActivity: {
        users: recentUsers,
        courses: recentCourses,
        books: recentBooks,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const listBranchTeachers = async (req, res, next) => {
  req.params.role = "teacher";
  return listBranchUsers(req, res, next);
};

export const listBranchStudents = async (req, res, next) => {
  req.params.role = "student";
  return listBranchUsers(req, res, next);
};

export const listPendingBranchUsers = async (req, res, next) => {
  req.query.status = "pending";
  return listBranchUsers(req, res, next);
};

export const listBranchUsers = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const role = req.params.role || req.query.role;
    if (role && !["teacher", "student"].includes(role)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Role must be teacher or student",
        },
      });
    }

    const branchId = branchObjectId(branch);
    const { page, pageSize, skip } = getPagination(req.query);
    const query = buildUserQuery(branchId, role, req.query);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.json({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getBranchUserDetails = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const userObjectId = validateObjectId(req.params.userId, "user ID");

    const user = await User.findOne({
      _id: userObjectId,
      branchId,
      branchJoinType: "branch",
      role: { $in: ["teacher", "student"] },
    })
      .select("-passwordHash")
      .lean();

    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch user not found",
        },
      });
    }

    const [membership, studentProfile] = await Promise.all([
      BranchMembership.findOne({ userId: user._id, branchId }).lean(),
      user.role === "student"
        ? StudentProfile.findOne({ user: user._id }).lean()
        : Promise.resolve(null),
    ]);

    const activity = {
      enrollments: null,
      payments: null,
      bookPurchases: null,
    };

    if (user.role === "student") {
      const recentEnrollments = await Enrollment.find({ student: user._id })
        .sort({ enrolledAt: -1, createdAt: -1 })
        .limit(25)
        .populate("course", "title status branchId price thumbnailUrl slug")
        .lean();

      const branchCourseIds = await Course.find({ branchId })
        .select("_id")
        .lean();
      const branchCourseIdList = branchCourseIds.map((item) => item._id);

      const [
        totalEnrollments,
        totalBranchEnrollments,
        recentCoursePayments,
        recentBookPayments,
      ] = await Promise.all([
        Enrollment.countDocuments({ student: user._id }),
        branchCourseIdList.length > 0
          ? Enrollment.countDocuments({
              student: user._id,
              course: { $in: branchCourseIdList },
            })
          : 0,
        Payment.find({
          user: user._id,
          status: "completed",
          course: { $ne: null },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("course", "title thumbnailUrl price branchId")
          .lean(),
        Payment.find({
          user: user._id,
          status: "completed",
          course: null,
          "metadata.type": { $in: ["book", "book-cart"] },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

      activity.enrollments = {
        total: totalEnrollments,
        branchTotal: totalBranchEnrollments,
        recent: recentEnrollments,
      };
      activity.payments = {
        recentCoursePayments,
      };
      activity.bookPurchases = {
        recentPayments: recentBookPayments,
      };
    }

    return res.json({
      user,
      membership,
      profile: user.role === "student" ? studentProfile : null,
      teacherProfile: user.role === "teacher" ? user.metadata || {} : null,
      activity,
    });
  } catch (error) {
    return next(error);
  }
};

const updateMembershipStatus = async ({
  user,
  branchId,
  status,
  actorId,
  reason = null,
}) => {
  const update = {
    userId: user._id,
    branchId,
    userRoleAtJoin: user.role,
    status,
  };

  if (status === "approved") {
    update.approvedBy = actorId;
    update.approvedAt = new Date();
    update.rejectedBy = null;
    update.rejectedAt = null;
    update.rejectionReason = null;
  } else if (status === "rejected") {
    update.rejectedBy = actorId;
    update.rejectedAt = new Date();
    update.rejectionReason = reason;
  } else if (status === "removed") {
    update.removedBy = actorId;
    update.removedAt = new Date();
    update.removalReason = reason;
  }

  await BranchMembership.findOneAndUpdate(
    { userId: user._id, branchId },
    update,
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const findBranchUser = async ({ userId, branchId }) => {
  const userObjectId = validateObjectId(userId, "user ID");
  return User.findOne({
    _id: userObjectId,
    branchId,
    branchJoinType: "branch",
    role: { $in: ["teacher", "student"] },
  });
};

export const approveBranchUser = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const actorObjectId = validateObjectId(req.auth.userId, "branch owner ID");
    const user = await findBranchUser({ userId: req.params.userId, branchId });

    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch-linked user not found",
        },
      });
    }

    user.approvalStatus = "approved";
    user.isActive = true;
    user.approvedBy = actorObjectId;
    user.approvedAt = new Date();
    user.rejectionReason = null;
    await user.save();

    await updateMembershipStatus({
      user,
      branchId,
      status: "approved",
      actorId: actorObjectId,
    });

    return res.json({
      user: await User.findById(user._id).select("-passwordHash").lean(),
      message: `${user.role === "teacher" ? "Teacher" : "Student"} approved successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

export const rejectBranchUser = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const reason = text(req.body.rejectionReason || req.body.reason);
    if (!reason) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Rejection reason is required",
        },
      });
    }

    const branchId = branchObjectId(branch);
    const actorObjectId = validateObjectId(req.auth.userId, "branch owner ID");
    const user = await findBranchUser({ userId: req.params.userId, branchId });

    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch-linked user not found",
        },
      });
    }

    user.approvalStatus = "rejected";
    user.isActive = false;
    user.rejectionReason = reason;
    await user.save();

    await updateMembershipStatus({
      user,
      branchId,
      status: "rejected",
      actorId: actorObjectId,
      reason,
    });

    return res.json({
      user: await User.findById(user._id).select("-passwordHash").lean(),
      message: `${user.role === "teacher" ? "Teacher" : "Student"} rejected successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

export const removeBranchUser = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const actorObjectId = validateObjectId(req.auth.userId, "branch owner ID");
    const user = await findBranchUser({ userId: req.params.userId, branchId });

    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch-linked user not found",
        },
      });
    }

    const reason = text(req.body.reason || req.body.removalReason);
    user.branchId = null;
    user.branchJoinType = "independent";
    user.approvalStatus = "approved";
    user.isActive = true;
    user.approvedBy = null;
    user.approvedAt = null;
    user.rejectionReason = null;
    await user.save();

    await updateMembershipStatus({
      user,
      branchId,
      status: "removed",
      actorId: actorObjectId,
      reason,
    });

    return res.json({
      user: await User.findById(user._id).select("-passwordHash").lean(),
      message: "User unlinked from branch successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const listBranchCourses = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const { status, approvalStatus, search } = req.query;
    const { page, pageSize, skip } = getPagination(req.query);
    const query = { branchId };

    if (status) query.status = status;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (search) {
      query.$or = [
        { title: { $regex: text(search), $options: "i" } },
        { description: { $regex: text(search), $options: "i" } },
      ];
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate("instructor", "fullName email approvalStatus")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Course.countDocuments(query),
    ]);

    return res.json({
      courses,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const approveBranchCourse = async (req, res, next) => {
  return updateBranchCourseApproval(req, res, next, "approve");
};

export const rejectBranchCourse = async (req, res, next) => {
  return updateBranchCourseApproval(req, res, next, "reject");
};

const updateBranchCourseApproval = async (req, res, next, action) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const courseObjectId = validateObjectId(req.params.courseId, "course ID");
    const course = await Course.findOne({ _id: courseObjectId, branchId });

    if (!course) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch course not found",
        },
      });
    }

    const actorObjectId = validateObjectId(req.auth.userId, "branch owner ID");
    if (action === "approve") {
      course.status = "published";
      course.approvalStatus = "approved";
      course.approvedBy = actorObjectId;
      course.approvedAt = new Date();
      course.rejectionReason = null;
    } else {
      const reason = text(req.body.rejectionReason || req.body.reason);
      if (!reason) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Rejection reason is required",
          },
        });
      }
      course.status = "archived";
      course.approvalStatus = "rejected";
      course.rejectionReason = reason;
    }

    await course.save();

    return res.json({
      course: await Course.findById(course._id)
        .populate("instructor", "fullName email")
        .lean(),
      message: `Course ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

export const listBranchBooks = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const { isPublic, approvalStatus, search } = req.query;
    const { page, pageSize, skip } = getPagination(req.query);
    const query = { branchId };

    if (isPublic !== undefined) query.isPublic = isPublic === "true";
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (search) {
      query.$or = [
        { title: { $regex: text(search), $options: "i" } },
        { description: { $regex: text(search), $options: "i" } },
      ];
    }

    const [books, total] = await Promise.all([
      EbookResource.find(query)
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      EbookResource.countDocuments(query),
    ]);

    return res.json({
      books,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const approveBranchBook = async (req, res, next) => {
  return updateBranchBookApproval(req, res, next, "approve");
};

export const rejectBranchBook = async (req, res, next) => {
  return updateBranchBookApproval(req, res, next, "reject");
};

const updateBranchBookApproval = async (req, res, next, action) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const bookObjectId = validateObjectId(req.params.bookId, "book ID");
    const book = await EbookResource.findOne({ _id: bookObjectId, branchId });

    if (!book) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch book not found",
        },
      });
    }

    const actorObjectId = validateObjectId(req.auth.userId, "branch owner ID");
    if (action === "approve") {
      book.isPublic = true;
      book.publishedAt = book.publishedAt || new Date();
      book.approvalStatus = "approved";
      book.approvedBy = actorObjectId;
      book.approvedAt = new Date();
      book.rejectionReason = null;
      if (book.metadata) {
        book.metadata.rejected = false;
        book.metadata.rejectionReason = null;
        book.markModified("metadata");
      }
    } else {
      const reason = text(req.body.rejectionReason || req.body.reason);
      if (!reason) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Rejection reason is required",
          },
        });
      }
      book.isPublic = false;
      book.approvalStatus = "rejected";
      book.rejectionReason = reason;
      if (!book.metadata) book.metadata = {};
      book.metadata.rejected = true;
      book.metadata.rejectionReason = reason;
      book.metadata.rejectedAt = new Date();
      book.markModified("metadata");
    }

    await book.save();

    return res.json({
      book: await EbookResource.findById(book._id)
        .populate("createdBy", "fullName email")
        .lean(),
      message: `Book ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

const normalizeAudience = (audience) => {
  if (audience === "teachers") return "branch_teachers";
  if (audience === "students") return "branch_students";
  if (audience === "branch_teachers" || audience === "branch_students") {
    return audience;
  }
  return "branch_all";
};

export const listBranchAnnouncements = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const { page, pageSize, skip } = getPagination(req.query);
    const query = { branchId };

    if (req.query.status) query.status = req.query.status;

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Announcement.countDocuments(query),
    ]);

    return res.json({
      announcements,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createBranchAnnouncement = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const title = text(req.body.title);
    const content = text(req.body.content);

    if (!title || !content) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title and content are required",
        },
      });
    }

    const branchId = branchObjectId(branch);
    const announcement = await Announcement.create({
      title,
      content,
      branchId,
      createdBy: validateObjectId(req.auth.userId, "branch owner ID"),
      targetAudience: normalizeAudience(req.body.audience || req.body.targetAudience),
      priority: req.body.priority || "normal",
      status: req.body.status === "draft" ? "draft" : "published",
      publishedAt: req.body.status === "draft" ? null : new Date(),
      expiresAt: req.body.expiresAt || null,
      metadata: {
        branchScoped: true,
      },
    });

    return res.status(201).json({
      announcement,
      message: "Announcement created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const updateBranchAnnouncement = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const announcementObjectId = validateObjectId(
      req.params.announcementId,
      "announcement ID"
    );

    const update = {};
    for (const field of ["title", "content", "priority", "status", "expiresAt"]) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }
    if (req.body.audience || req.body.targetAudience) {
      update.targetAudience = normalizeAudience(
        req.body.audience || req.body.targetAudience
      );
    }
    if (update.status === "published") update.publishedAt = new Date();

    const announcement = await Announcement.findOneAndUpdate(
      { _id: announcementObjectId, branchId },
      update,
      { new: true, runValidators: true }
    ).lean();

    if (!announcement) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch announcement not found",
        },
      });
    }

    return res.json({ announcement, message: "Announcement updated successfully" });
  } catch (error) {
    return next(error);
  }
};

export const deleteBranchAnnouncement = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const announcementObjectId = validateObjectId(
      req.params.announcementId,
      "announcement ID"
    );
    const deleted = await Announcement.findOneAndDelete({
      _id: announcementObjectId,
      branchId: branchObjectId(branch),
    });

    if (!deleted) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Branch announcement not found",
        },
      });
    }

    return res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getBranchAnalytics = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const branchId = branchObjectId(branch);
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [userGrowth, courseGrowth, bookGrowth, approvalBreakdown] =
      await Promise.all([
        User.aggregate([
          { $match: { branchId, createdAt: { $gte: since } } },
          {
            $group: {
              _id: {
                day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                role: "$role",
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.day": 1 } },
        ]),
        Course.countDocuments({ branchId, createdAt: { $gte: since } }),
        EbookResource.countDocuments({ branchId, createdAt: { $gte: since } }),
        User.aggregate([
          { $match: { branchId, role: { $in: ["teacher", "student"] } } },
          {
            $group: {
              _id: { role: "$role", approvalStatus: "$approvalStatus" },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    return res.json({
      analytics: {
        userGrowth,
        newCourses30d: courseGrowth,
        newBooks30d: bookGrowth,
        approvalBreakdown,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getBranchSettings = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;
    return res.json({ settings: branch.settings || {} });
  } catch (error) {
    return next(error);
  }
};

export const updateBranchSettings = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) return null;

    const settings = {
      ...(branch.settings || {}),
    };

    for (const field of [
      "autoApproveTeachers",
      "autoApproveStudents",
      "allowTeacherContentSubmission",
      "defaultAnnouncementAudience",
    ]) {
      if (req.body[field] !== undefined) settings[field] = req.body[field];
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      branch._id,
      { settings },
      { new: true, runValidators: true }
    );

    return res.json({
      settings: updatedBranch.settings,
      message: "Branch settings updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};
