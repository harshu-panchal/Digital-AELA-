import mongoose from "mongoose";
import Backup from "../models/Backup.js";
import {
  createDatabaseBackup,
  restoreDatabaseBackup,
  deleteBackupFile,
  getBackupFileStream,
  cleanupExpiredBackups,
} from "../utils/backupService.js";

/**
 * Create Backup
 * POST /api/v1/backups
 */
export const createBackup = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { name, type = "full", retentionDays = 30 } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can create backups",
        },
      });
    }

    if (!name) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Backup name is required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Create backup record
    const backup = await Backup.create({
      name,
      type,
      status: "in_progress",
      createdBy: userObjectId,
      retentionDays,
      startedAt: new Date(),
      metadata: {
        database: mongoose.connection.db?.databaseName || "unknown",
        timestamp: new Date(),
      },
    });

    // Start backup process asynchronously
    createDatabaseBackup(name)
      .then(async (result) => {
        await backup.markCompleted(result.filePath, result.fileName, result.fileSize);
      })
      .catch(async (error) => {
        await backup.markFailed(error);
      });

    const populatedBackup = await Backup.findById(backup._id)
      .populate("createdBy", "fullName email")
      .lean();

    return res.status(201).json({
      backup: populatedBackup,
      message: "Backup creation started",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get All Backups
 * GET /api/v1/backups
 */
export const getAllBackups = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const {
      page = 1,
      pageSize = 20,
      status,
      type,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view backups",
        },
      });
    }

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [backups, total] = await Promise.all([
      Backup.find(query)
        .populate("createdBy", "fullName email")
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Backup.countDocuments(query),
    ]);

    return res.json({
      backups,
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
 * Get Backup Details
 * GET /api/v1/backups/:backupId
 */
export const getBackupDetails = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const { backupId } = req.params;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view backup details",
        },
      });
    }

    if (!mongoose.isValidObjectId(backupId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid backup ID",
        },
      });
    }

    const backup = await Backup.findById(backupId)
      .populate("createdBy", "fullName email")
      .lean();

    if (!backup) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Backup not found",
        },
      });
    }

    return res.json({
      backup,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Download Backup
 * GET /api/v1/backups/:backupId/download
 */
export const downloadBackup = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const { backupId } = req.params;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can download backups",
        },
      });
    }

    if (!mongoose.isValidObjectId(backupId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid backup ID",
        },
      });
    }

    const backup = await Backup.findById(backupId);

    if (!backup) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Backup not found",
        },
      });
    }

    if (backup.status !== "completed" || !backup.filePath) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Backup is not available for download",
        },
      });
    }

    try {
      const { stream, size, filename } = await getBackupFileStream(backup.filePath);

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${backup.fileName || filename}"`);
      res.setHeader("Content-Length", size);

      return res.send(stream);
    } catch (fileError) {
      return res.status(404).json({
        error: {
          code: "FILE_NOT_FOUND",
          message: "Backup file not found on server",
        },
      });
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * Restore Backup
 * POST /api/v1/backups/:backupId/restore
 */
export const restoreBackup = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const { backupId } = req.params;
    const { confirm } = req.body;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can restore backups",
        },
      });
    }

    if (!confirm || confirm !== "yes") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Restore confirmation required. Send { confirm: 'yes' } in request body.",
        },
      });
    }

    if (!mongoose.isValidObjectId(backupId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid backup ID",
        },
      });
    }

    const backup = await Backup.findById(backupId);

    if (!backup) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Backup not found",
        },
      });
    }

    if (backup.status !== "completed" || !backup.filePath) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Backup is not available for restore",
        },
      });
    }

    // Start restore process asynchronously
    restoreDatabaseBackup(backup.filePath)
      .then(() => {
        console.log(`Backup ${backupId} restored successfully`);
      })
      .catch((error) => {
        console.error(`Failed to restore backup ${backupId}:`, error);
      });

    return res.json({
      message: "Backup restore process started. This may take several minutes.",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete Backup
 * DELETE /api/v1/backups/:backupId
 */
export const deleteBackup = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const { backupId } = req.params;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can delete backups",
        },
      });
    }

    if (!mongoose.isValidObjectId(backupId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid backup ID",
        },
      });
    }

    const backup = await Backup.findById(backupId);

    if (!backup) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Backup not found",
        },
      });
    }

    // Delete backup file if exists
    if (backup.filePath) {
      try {
        await deleteBackupFile(backup.filePath);
      } catch (fileError) {
        console.error("Failed to delete backup file:", fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    await Backup.findByIdAndDelete(backupId);

    return res.json({
      message: "Backup deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Backup Statistics
 * GET /api/v1/backups/stats
 */
export const getBackupStats = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view backup statistics",
        },
      });
    }

    const [
      total,
      completed,
      failed,
      inProgress,
      totalSize,
      recentBackups,
    ] = await Promise.all([
      Backup.countDocuments({}),
      Backup.countDocuments({ status: "completed" }),
      Backup.countDocuments({ status: "failed" }),
      Backup.countDocuments({ status: "in_progress" }),
      Backup.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
      ]),
      Backup.find({ status: "completed" })
        .sort({ completedAt: -1 })
        .limit(5)
        .select("name completedAt fileSize")
        .lean(),
    ]);

    const totalSizeBytes = totalSize[0]?.totalSize || 0;

    return res.json({
      stats: {
        total,
        completed,
        failed,
        inProgress,
        totalSize: totalSizeBytes,
        totalSizeFormatted: formatBytes(totalSizeBytes),
        recentBackups,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Cleanup Expired Backups
 * POST /api/v1/backups/cleanup
 */
export const cleanupBackups = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can cleanup backups",
        },
      });
    }

    const result = await cleanupExpiredBackups();

    return res.json({
      message: `Cleanup completed. ${result.cleaned} expired backups removed.`,
      cleaned: result.cleaned,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Helper function to format bytes
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

