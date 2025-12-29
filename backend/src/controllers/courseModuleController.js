import CourseModule from "../models/CourseModule.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import mongoose from "mongoose";
import { uploadModuleFileToLocal } from "../middleware/moduleUploadMiddleware.js";
import { deleteFileFromLocal } from "../services/fileStorageService.js";

/**
 * Create a new module for a course (Teacher/Super Admin only)
 * POST /api/v1/courses/:courseId/modules
 */
export const createModule = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId, userRole } = req.auth;

    if (!["teacher", "super-admin"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can create course modules",
        },
      });
    }

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    // Check if course exists and user has permission
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Verify ownership (teacher can only create modules for their own courses)
    if (userRole === "teacher" && course.instructor.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only create modules for your own courses",
        },
      });
    }

    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Module title is required",
        },
      });
    }

    // Process uploaded files if any
    const files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadModuleFileToLocal(
            file.buffer,
            `digital-aela/courses/${courseId}/modules`,
            file.originalname,
            file.mimetype
          );

          files.push({
            fileUrl: uploadResult.url,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedAt: new Date(),
            metadata: {
              filePath: uploadResult.filePath,
              format: uploadResult.format,
            },
          });
        } catch (uploadError) {
          console.error("[CourseModule] Error uploading file:", uploadError);
          // Continue with other files, but log the error
        }
      }
    }

    // Create module record
    const module = await CourseModule.create({
      course: courseId,
      title: title.trim(),
      description: description ? description.trim() : "",
      files: files,
    });

    const populatedModule = await CourseModule.findById(module._id)
      .populate("course", "title instructor")
      .lean();

    return res.status(201).json({
      message: "Module created successfully",
      module: populatedModule,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all modules for a course (with access control)
 * GET /api/v1/courses/:courseId/modules
 */
export const getCourseModules = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId, userRole } = req.auth || {};

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Check access permissions
    let hasAccess = false;

    // Teachers and super-admins can always see modules for their courses
    if (userRole === "teacher" && course.instructor.toString() === userId) {
      hasAccess = true;
    } else if (userRole === "super-admin") {
      hasAccess = true;
    } else if (userId) {
      // Check if student is enrolled (allow active, completed, and paused statuses)
      const enrollmentQueries = [
        { student: userId, course: courseId, status: { $ne: "dropped" } },
        { student: String(userId), course: String(courseId), status: { $ne: "dropped" } },
      ];

      if (mongoose.Types.ObjectId.isValid(courseId) && mongoose.Types.ObjectId.isValid(userId)) {
        enrollmentQueries.push({
          student: new mongoose.Types.ObjectId(userId),
          course: new mongoose.Types.ObjectId(courseId),
          status: { $ne: "dropped" },
        });
      }

      let enrollment = null;
      for (const query of enrollmentQueries) {
        enrollment = await Enrollment.findOne(query);
        if (enrollment) break;
      }

      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You must be enrolled in this course to access modules",
        },
      });
    }

    // Get modules ordered chronologically (by createdAt)
    const modules = await CourseModule.find({ course: courseId })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      modules,
      hasAccess: true,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a single module with access control
 * GET /api/v1/modules/:moduleId
 */
export const getModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { userId, userRole } = req.auth || {};

    if (!mongoose.isValidObjectId(moduleId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid module ID",
        },
      });
    }

    const module = await CourseModule.findById(moduleId)
      .populate("course", "title instructor")
      .lean();

    if (!module) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Module not found",
        },
      });
    }

    // Check access permissions
    let hasAccess = false;
    const course = module.course;

    if (
      userRole === "teacher" &&
      course.instructor.toString() === userId
    ) {
      hasAccess = true;
    } else if (userRole === "super-admin") {
      hasAccess = true;
    } else if (userId) {
      // Check if student is enrolled
      const courseIdValue = course._id || course;
      const enrollmentQueries = [
        { student: userId, course: courseIdValue, status: { $ne: "dropped" } },
        { student: String(userId), course: String(courseIdValue), status: { $ne: "dropped" } },
      ];

      if (mongoose.Types.ObjectId.isValid(courseIdValue) && mongoose.Types.ObjectId.isValid(userId)) {
        enrollmentQueries.push({
          student: new mongoose.Types.ObjectId(userId),
          course: new mongoose.Types.ObjectId(courseIdValue),
          status: { $ne: "dropped" },
        });
      }

      let enrollment = null;
      for (const query of enrollmentQueries) {
        enrollment = await Enrollment.findOne(query);
        if (enrollment) break;
      }

      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You must be enrolled in this course to access this module",
        },
      });
    }

    return res.status(200).json({
      module,
      hasAccess: true,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update module details
 * PUT /api/v1/modules/:moduleId
 */
export const updateModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { userId, userRole } = req.auth;

    if (!["teacher", "super-admin"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can update modules",
        },
      });
    }

    if (!mongoose.isValidObjectId(moduleId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid module ID",
        },
      });
    }

    const module = await CourseModule.findById(moduleId).populate("course", "instructor");
    if (!module) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Module not found",
        },
      });
    }

    // Verify ownership
    if (userRole === "teacher" && module.course.instructor.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only update modules for your own courses",
        },
      });
    }

    const { title, description } = req.body;

    const updateData = {};
    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Module title cannot be empty",
          },
        });
      }
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description ? description.trim() : "";
    }

    const updatedModule = await CourseModule.findByIdAndUpdate(
      moduleId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("course", "title instructor")
      .lean();

    return res.status(200).json({
      message: "Module updated successfully",
      module: updatedModule,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a module
 * DELETE /api/v1/modules/:moduleId
 */
export const deleteModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { userId, userRole } = req.auth;

    if (!["teacher", "super-admin"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can delete modules",
        },
      });
    }

    if (!mongoose.isValidObjectId(moduleId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid module ID",
        },
      });
    }

    const module = await CourseModule.findById(moduleId).populate("course", "instructor");
    if (!module) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Module not found",
        },
      });
    }

    // Verify ownership
    if (userRole === "teacher" && module.course.instructor.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only delete modules for your own courses",
        },
      });
    }

    // Delete all files associated with the module
    if (module.files && module.files.length > 0) {
      for (const file of module.files) {
        try {
          await deleteFileFromLocal(file.fileUrl);
        } catch (deleteError) {
          console.error("[CourseModule] Error deleting file:", deleteError);
          // Continue with deletion even if file deletion fails
        }
      }
    }

    await CourseModule.findByIdAndDelete(moduleId);

    return res.status(200).json({
      message: "Module deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Add files to an existing module
 * POST /api/v1/modules/:moduleId/files
 */
export const addFilesToModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { userId, userRole } = req.auth;

    if (!["teacher", "super-admin"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can add files to modules",
        },
      });
    }

    if (!mongoose.isValidObjectId(moduleId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid module ID",
        },
      });
    }

    const module = await CourseModule.findById(moduleId).populate("course", "instructor");
    if (!module) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Module not found",
        },
      });
    }

    // Verify ownership
    if (userRole === "teacher" && module.course.instructor.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only add files to modules for your own courses",
        },
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: {
          code: "FILES_REQUIRED",
          message: "No files uploaded",
        },
      });
    }

    const courseId = module.course._id || module.course;
    const newFiles = [];

    // Process uploaded files
    for (const file of req.files) {
      try {
        const uploadResult = await uploadModuleFileToLocal(
          file.buffer,
          `digital-aela/courses/${courseId}/modules/${moduleId}`,
          file.originalname,
          file.mimetype
        );

        newFiles.push({
          fileUrl: uploadResult.url,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadedAt: new Date(),
          metadata: {
            filePath: uploadResult.filePath,
            format: uploadResult.format,
          },
        });
      } catch (uploadError) {
        console.error("[CourseModule] Error uploading file:", uploadError);
        // Continue with other files
      }
    }

    if (newFiles.length === 0) {
      return res.status(400).json({
        error: {
          code: "UPLOAD_FAILED",
          message: "Failed to upload any files",
        },
      });
    }

    // Add new files to module
    module.files.push(...newFiles);
    await module.save();

    const updatedModule = await CourseModule.findById(moduleId)
      .populate("course", "title instructor")
      .lean();

    return res.status(200).json({
      message: "Files added successfully",
      module: updatedModule,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Remove a file from a module
 * DELETE /api/v1/modules/:moduleId/files/:fileIndex
 */
export const removeFileFromModule = async (req, res, next) => {
  try {
    const { moduleId, fileIndex } = req.params;
    const { userId, userRole } = req.auth;

    if (!["teacher", "super-admin"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can remove files from modules",
        },
      });
    }

    if (!mongoose.isValidObjectId(moduleId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid module ID",
        },
      });
    }

    const index = parseInt(fileIndex, 10);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid file index",
        },
      });
    }

    const module = await CourseModule.findById(moduleId).populate("course", "instructor");
    if (!module) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Module not found",
        },
      });
    }

    // Verify ownership
    if (userRole === "teacher" && module.course.instructor.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only remove files from modules for your own courses",
        },
      });
    }

    if (index >= module.files.length) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "File index out of range",
        },
      });
    }

    // Delete the file from storage
    const fileToRemove = module.files[index];
    try {
      await deleteFileFromLocal(fileToRemove.fileUrl);
    } catch (deleteError) {
      console.error("[CourseModule] Error deleting file:", deleteError);
      // Continue with removal even if file deletion fails
    }

    // Remove file from array
    module.files.splice(index, 1);
    await module.save();

    const updatedModule = await CourseModule.findById(moduleId)
      .populate("course", "title instructor")
      .lean();

    return res.status(200).json({
      message: "File removed successfully",
      module: updatedModule,
    });
  } catch (error) {
    return next(error);
  }
};

