import mongoose from "mongoose";
import JoinUsApplication from "../models/JoinUsApplication.js";
import { uploadToCloudinary, uploadPdfToCloudinary } from "../middleware/uploadMiddleware.js";
import { uploadVideoToCloudinary } from "../middleware/videoUploadMiddleware.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

/**
 * Helper function to upload file to Cloudinary based on file type
 */
const uploadFileToCloudinary = async (file, folder) => {
  const { buffer, mimetype, originalname, size } = file;

  // Determine file type and upload accordingly
  if (mimetype.startsWith("image/")) {
    // Upload as image
    return await uploadToCloudinary(buffer, folder);
  } else if (mimetype === "application/pdf" || 
             mimetype === "application/msword" || 
             mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    // Upload as raw document (PDF, DOC, DOCX)
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "raw",
          public_id: `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            format: result.format || mimetype.split("/")[1],
            bytes: result.bytes || size,
          });
        }
      );

      const readableStream = Readable.from(buffer);
      readableStream.pipe(uploadStream);
    });
  } else if (mimetype.startsWith("video/")) {
    // Upload as video
    return await uploadVideoToCloudinary(buffer, folder);
  } else {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }
};

/**
 * Submit Join Us Application
 * POST /api/v1/join-us/submit
 */
export const submitApplication = async (req, res, next) => {
  try {
    const { applicationType } = req.body;

    if (!applicationType || !["teacher", "influencer"].includes(applicationType)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "applicationType must be 'teacher' or 'influencer'",
        },
      });
    }

    // Extract form data (excluding files)
    const formData = {};
    const fileFields = ["resume", "videoIntro", "profileImage"];
    
    Object.keys(req.body).forEach((key) => {
      if (!fileFields.includes(key)) {
        formData[key] = req.body[key];
      }
    });

    // Handle file uploads
    const attachments = [];
    const uploadPromises = [];

    // Process files from req.files (multer fields middleware creates req.files object with field names as keys)
    if (req.files) {
      for (const fieldName of fileFields) {
        const fileArray = req.files[fieldName];
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0]; // Take first file if multiple
          if (file && file.buffer) {
            const folder = `digital-aela/join-us/${applicationType}/${fieldName}`;
            uploadPromises.push(
              uploadFileToCloudinary(file, folder)
                .then((result) => {
                  attachments.push({
                    fieldName,
                    url: result.url,
                    publicId: result.public_id,
                    fileName: file.originalname || `${fieldName}.${result.format}`,
                    fileType: file.mimetype,
                    fileSize: result.bytes || file.size,
                  });
                })
                .catch((error) => {
                  console.error(`Error uploading ${fieldName}:`, error);
                  throw new Error(`Failed to upload ${fieldName}: ${error.message}`);
                })
            );
          }
        }
      }
    }

    // Wait for all file uploads to complete
    await Promise.all(uploadPromises);

    // Create application
    const application = await JoinUsApplication.create({
      applicationType,
      status: "pending",
      formData,
      attachments,
      submittedAt: new Date(),
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application: {
        id: application._id,
        applicationType: application.applicationType,
        status: application.status,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get pending applications (Admin only)
 * GET /api/v1/admin/pending/join-us-applications
 */
export const getPendingJoinUsApplications = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { page = 1, pageSize = 20, applicationType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const query = { status: "pending" };
    if (applicationType && ["teacher", "influencer"].includes(applicationType)) {
      query.applicationType = applicationType;
    }

    const [applications, total] = await Promise.all([
      JoinUsApplication.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JoinUsApplication.countDocuments(query),
    ]);

    return res.json({
      applications,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get application by ID (Admin only)
 * GET /api/v1/admin/pending/join-us-applications/:applicationId
 */
export const getJoinUsApplicationById = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { applicationId } = req.params;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid application ID",
        },
      });
    }

    const application = await JoinUsApplication.findById(applicationId).lean();

    if (!application) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Application not found",
        },
      });
    }

    return res.json({
      application,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Approve application (Admin only)
 * PATCH /api/v1/admin/join-us-applications/:applicationId/approve
 */
export const approveJoinUsApplication = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { applicationId } = req.params;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid application ID",
        },
      });
    }

    const application = await JoinUsApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Application not found",
        },
      });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Application has already been reviewed",
        },
      });
    }

    application.status = "approved";
    application.reviewedBy = userId;
    application.reviewedAt = new Date();
    application.rejectionReason = null;

    await application.save();

    return res.json({
      message: "Application approved successfully",
      application: await JoinUsApplication.findById(applicationId).lean(),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Reject application (Admin only)
 * PATCH /api/v1/admin/join-us-applications/:applicationId/reject
 */
export const rejectJoinUsApplication = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { applicationId } = req.params;
    const { rejectionReason } = req.body;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid application ID",
        },
      });
    }

    const application = await JoinUsApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Application not found",
        },
      });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Application has already been reviewed",
        },
      });
    }

    application.status = "rejected";
    application.reviewedBy = userId;
    application.reviewedAt = new Date();
    if (rejectionReason) {
      application.rejectionReason = rejectionReason.trim();
    }

    await application.save();

    return res.json({
      message: "Application rejected successfully",
      application: await JoinUsApplication.findById(applicationId).lean(),
    });
  } catch (error) {
    return next(error);
  }
};

