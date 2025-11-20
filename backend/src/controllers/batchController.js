import mongoose from "mongoose";
import Batch from "../models/Batch.js";
import User from "../models/User.js";

/**
 * Get All Batches (Admin/Teacher)
 * GET /api/v1/batches
 */
export const getAllBatches = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const {
      page = 1,
      pageSize = 20,
      status,
      search,
      courseId,
      instructorId,
      sortBy = "startDate",
      sortOrder = "desc",
    } = req.query;

    // Only admins and teachers can view all batches
    if (userRole !== "super-admin" && userRole !== "admin" && userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins and teachers can view all batches",
        },
      });
    }

    const query = {};

    if (status) query.status = status;
    if (courseId && mongoose.isValidObjectId(courseId)) {
      query.course = new mongoose.Types.ObjectId(courseId);
    }
    if (instructorId && mongoose.isValidObjectId(instructorId)) {
      query.instructor = new mongoose.Types.ObjectId(instructorId);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [batches, total] = await Promise.all([
      Batch.find(query)
        .populate("students", "fullName email profilePicture")
        .populate("instructor", "fullName email profilePicture")
        .populate("course", "title")
        .populate("createdBy", "fullName email")
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Batch.countDocuments(query),
    ]);

    return res.json({
      batches,
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
 * Get Student's Batch
 * GET /api/v1/batches/my-batch
 */
export const getMyBatch = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};

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

    const batch = await Batch.findOne({
      students: userObjectId,
      status: { $in: ["upcoming", "active"] },
    })
      .populate("students", "fullName email profilePicture")
      .populate("instructor", "fullName email profilePicture metadata")
      .populate("course", "title description thumbnail")
      .populate("createdBy", "fullName email")
      .lean();

    if (!batch) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "No active batch found for this student",
        },
      });
    }

    return res.json({
      batch,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Batch Details
 * GET /api/v1/batches/:batchId
 */
export const getBatchDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { batchId } = req.params;

    if (!mongoose.isValidObjectId(batchId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid batch ID",
        },
      });
    }

    const batch = await Batch.findById(batchId)
      .populate("students", "fullName email profilePicture")
      .populate("instructor", "fullName email profilePicture metadata")
      .populate("course", "title description thumbnail")
      .populate("createdBy", "fullName email")
      .lean();

    if (!batch) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Batch not found",
        },
      });
    }

    // Students can only view their own batch
    if (userRole === "student") {
      const userObjectId = mongoose.isValidObjectId(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;
      const isEnrolled = batch.students.some(
        (student) => student._id.toString() === userId
      );
      if (!isEnrolled) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You are not enrolled in this batch",
          },
        });
      }
    }

    return res.json({
      batch,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create Batch (Admin only)
 * POST /api/v1/batches
 */
export const createBatch = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const {
      name,
      code,
      description,
      startDate,
      endDate,
      capacity,
      schedule,
      courseId,
      instructorId,
      metadata,
    } = req.body;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can create batches",
        },
      });
    }

    if (!name || !code || !startDate || !endDate) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Name, code, start date, and end date are required",
        },
      });
    }

    // Check if code already exists
    const existingBatch = await Batch.findOne({ code: code.toUpperCase() });
    if (existingBatch) {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "Batch code already exists",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const batchData = {
      name,
      code: code.toUpperCase(),
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      capacity: capacity || 50,
      createdBy: userObjectId,
      students: [],
      enrolledCount: 0,
    };

    if (schedule) {
      batchData.schedule = schedule;
    }

    if (courseId && mongoose.isValidObjectId(courseId)) {
      batchData.course = new mongoose.Types.ObjectId(courseId);
    }

    if (instructorId && mongoose.isValidObjectId(instructorId)) {
      batchData.instructor = new mongoose.Types.ObjectId(instructorId);
    }

    if (metadata) {
      batchData.metadata = metadata;
    }

    // Determine initial status
    const now = new Date();
    if (now < batchData.startDate) {
      batchData.status = "upcoming";
    } else if (now >= batchData.startDate && now <= batchData.endDate) {
      batchData.status = "active";
    } else {
      batchData.status = "completed";
    }

    const batch = await Batch.create(batchData);

    const populatedBatch = await Batch.findById(batch._id)
      .populate("instructor", "fullName email")
      .populate("course", "title")
      .populate("createdBy", "fullName email")
      .lean();

    return res.status(201).json({
      batch: populatedBatch,
      message: "Batch created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update Batch (Admin only)
 * PUT /api/v1/batches/:batchId
 */
export const updateBatch = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const { batchId } = req.params;
    const updateData = req.body;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can update batches",
        },
      });
    }

    if (!mongoose.isValidObjectId(batchId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid batch ID",
        },
      });
    }

    const batch = await Batch.findById(batchId);

    if (!batch) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Batch not found",
        },
      });
    }

    // Update fields
    if (updateData.name) batch.name = updateData.name;
    if (updateData.code) batch.code = updateData.code.toUpperCase();
    if (updateData.description !== undefined) batch.description = updateData.description;
    if (updateData.startDate) batch.startDate = new Date(updateData.startDate);
    if (updateData.endDate) batch.endDate = new Date(updateData.endDate);
    if (updateData.capacity) batch.capacity = updateData.capacity;
    if (updateData.schedule) batch.schedule = updateData.schedule;
    if (updateData.courseId) {
      batch.course = mongoose.isValidObjectId(updateData.courseId)
        ? new mongoose.Types.ObjectId(updateData.courseId)
        : null;
    }
    if (updateData.instructorId) {
      batch.instructor = mongoose.isValidObjectId(updateData.instructorId)
        ? new mongoose.Types.ObjectId(updateData.instructorId)
        : null;
    }
    if (updateData.metadata) batch.metadata = { ...batch.metadata, ...updateData.metadata };
    if (updateData.status) batch.status = updateData.status;

    // Update status based on dates
    await batch.updateStatus();

    await batch.save();

    const populatedBatch = await Batch.findById(batch._id)
      .populate("students", "fullName email")
      .populate("instructor", "fullName email")
      .populate("course", "title")
      .populate("createdBy", "fullName email")
      .lean();

    return res.json({
      batch: populatedBatch,
      message: "Batch updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Add Student to Batch (Admin only)
 * POST /api/v1/batches/:batchId/students/:studentId
 */
export const addStudentToBatch = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const { batchId, studentId } = req.params;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can add students to batches",
        },
      });
    }

    if (!mongoose.isValidObjectId(batchId) || !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid batch or student ID",
        },
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Batch not found",
        },
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Student not found",
        },
      });
    }

    try {
      await batch.addStudent(studentId);
    } catch (error) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: error.message,
        },
      });
    }

    const populatedBatch = await Batch.findById(batch._id)
      .populate("students", "fullName email")
      .lean();

    return res.json({
      batch: populatedBatch,
      message: "Student added to batch successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Remove Student from Batch (Admin only)
 * DELETE /api/v1/batches/:batchId/students/:studentId
 */
export const removeStudentFromBatch = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const { batchId, studentId } = req.params;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can remove students from batches",
        },
      });
    }

    if (!mongoose.isValidObjectId(batchId) || !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid batch or student ID",
        },
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Batch not found",
        },
      });
    }

    await batch.removeStudent(studentId);

    const populatedBatch = await Batch.findById(batch._id)
      .populate("students", "fullName email")
      .lean();

    return res.json({
      batch: populatedBatch,
      message: "Student removed from batch successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Batch Statistics (Admin only)
 * GET /api/v1/batches/stats
 */
export const getBatchStats = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view batch statistics",
        },
      });
    }

    const [total, active, upcoming, completed, totalStudents] = await Promise.all([
      Batch.countDocuments({}),
      Batch.countDocuments({ status: "active" }),
      Batch.countDocuments({ status: "upcoming" }),
      Batch.countDocuments({ status: "completed" }),
      Batch.aggregate([
        { $group: { _id: null, totalStudents: { $sum: "$enrolledCount" } } },
      ]),
    ]);

    const totalStudentsCount = totalStudents[0]?.totalStudents || 0;

    return res.json({
      stats: {
        total,
        active,
        upcoming,
        completed,
        totalStudents: totalStudentsCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

