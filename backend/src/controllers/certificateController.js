import mongoose from "mongoose";
import Certificate from "../models/Certificate.js";
import CertificateTemplate from "../models/CertificateTemplate.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import VideoProgress from "../models/VideoProgress.js";
import CourseVideo from "../models/CourseVideo.js";

/**
 * Generate Certificate (Automatic or Manual)
 * POST /api/v1/certificates/generate
 */
export const generateCertificate = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { studentId, courseId, enrollmentId, templateId, issuedType = "automatic" } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // For manual issuance, only teachers and super-admins can issue certificates
    // Teachers can only issue for courses they created
    // Super-admins can only issue for courses they created
    if (issuedType === "manual") {
      if (userRole !== "teacher" && userRole !== "super-admin") {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Only teachers and admins can manually issue certificates",
          },
        });
      }
      
      // For manual issuance, courseId is required
      if (!courseId) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Course ID is required for manual certificate issuance",
          },
        });
      }
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    let studentObjectId = null;
    let courseObjectId = null;
    let enrollmentObjectId = null;

    // Determine student
    if (studentId) {
      if (!mongoose.isValidObjectId(studentId)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid student ID",
          },
        });
      }
      studentObjectId = new mongoose.Types.ObjectId(studentId);
    } else if (issuedType === "automatic") {
      // For automatic, use current user if student
      if (userRole === "student") {
        studentObjectId = userObjectId;
      } else {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Student ID required for automatic certificate generation",
          },
        });
      }
    } else {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Student ID is required",
        },
      });
    }

    // Verify student exists
    const student = await User.findById(studentObjectId).lean();
    if (!student) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Student not found",
        },
      });
    }

    // Handle course/enrollment
    if (courseId) {
      if (!mongoose.isValidObjectId(courseId)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid course ID",
          },
        });
      }
      courseObjectId = new mongoose.Types.ObjectId(courseId);

      const course = await Course.findById(courseObjectId).lean();
      if (!course) {
        return res.status(404).json({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "Course not found",
          },
        });
      }

      // Verify course ownership for manual issuance
      if (issuedType === "manual") {
        const courseInstructorId = course.instructor?.toString();
        const currentUserId = userObjectId?.toString();
        
        if (courseInstructorId !== currentUserId) {
          return res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "You can only issue certificates for courses you created",
            },
          });
        }
      }

      // Check enrollment
      let enrollment = null;
      if (enrollmentId) {
        enrollmentObjectId = new mongoose.Types.ObjectId(enrollmentId);
        enrollment = await Enrollment.findById(enrollmentObjectId).lean();
        if (!enrollment || enrollment.student.toString() !== studentObjectId.toString()) {
          return res.status(404).json({
            error: {
              code: "RESOURCE_NOT_FOUND",
              message: "Enrollment not found or doesn't match student",
            },
          });
        }
      } else {
        // Find enrollment
        enrollment = await Enrollment.findOne({
          student: studentObjectId,
          course: courseObjectId,
        }).lean();
        if (enrollment) {
          enrollmentObjectId = enrollment._id;
        }
      }

      // For manual issuance, validate completion requirements
      if (issuedType === "manual" && enrollment && courseObjectId) {
        // Check 1: Enrollment status must be "completed"
        if (enrollment.status !== "completed") {
          return res.status(400).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Student must have completed the course (enrollment status must be 'completed')",
            },
          });
        }

        // Check 2: Course progress must be 100% (all videos completed)
        const courseVideos = await CourseVideo.find({ course: courseObjectId }).lean();
        const totalVideos = courseVideos.length;
        const videoIds = courseVideos.map((v) => v._id);

        if (totalVideos > 0) {
          const completedVideoProgress = await VideoProgress.find({
            student: studentObjectId,
            course: courseObjectId,
            video: { $in: videoIds },
            isCompleted: true,
          }).lean();

          const completedVideos = completedVideoProgress.length;
          const courseProgressPercentage =
            totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

          if (courseProgressPercentage !== 100) {
            return res.status(400).json({
              error: {
                code: "VALIDATION_ERROR",
                message: `Student must have completed all course videos (current progress: ${courseProgressPercentage}%)`,
              },
            });
          }
        }
      }
    }

    // Get template
    let template = null;
    if (templateId) {
      if (!mongoose.isValidObjectId(templateId)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid template ID",
          },
        });
      }
      template = await CertificateTemplate.findById(templateId).lean();
      if (!template) {
        return res.status(404).json({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "Template not found",
          },
        });
      }
    } else {
      // Get default template
      template = await CertificateTemplate.findOne({
        templateType: courseObjectId ? "course_completion" : "achievement",
        isDefault: true,
        isActive: true,
      }).lean();
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      student: studentObjectId,
      course: courseObjectId || { $exists: false },
      status: { $ne: "revoked" },
    }).lean();

    if (existingCertificate) {
      return res.status(409).json({
        error: {
          code: "ALREADY_EXISTS",
          message: "Certificate already exists for this student and course",
          certificate: existingCertificate,
        },
      });
    }

    // Create certificate
    const certificate = await Certificate.create({
      student: studentObjectId,
      course: courseObjectId,
      enrollment: enrollmentObjectId,
      template: template?._id,
      studentName: student.fullName || student.email,
      courseTitle: courseObjectId ? (await Course.findById(courseObjectId).lean())?.title : null,
      completionDate: new Date(),
      status: "pending",
      issuedType,
      issuedBy: issuedType === "manual" ? userObjectId : null,
      metadata: {
        templateUsed: template?.name || "default",
      },
    });

    // Generate PDF (in production, this would generate actual PDF)
    // For now, we'll mark it as generated
    const pdfUrl = `/api/v1/certificates/${certificate._id}/pdf`;

    // Update status to "issued" which will trigger certificateNumber generation via pre-save hook
    await Certificate.findByIdAndUpdate(certificate._id, {
      pdfUrl,
      status: "issued",
    });

    const populatedCertificate = await Certificate.findById(certificate._id)
      .populate("student", "fullName email")
      .populate("course", "title thumbnailUrl")
      .populate("template", "name")
      .populate("issuedBy", "fullName")
      .lean();

    // Create notification for student when certificate is issued
    try {
      const { createNotification } = await import("../utils/notificationHelper.js");
      const courseTitle = populatedCertificate.course?.title || "course";
      await createNotification(
        certificate.student,
        "Certificate Issued",
        `Congratulations! Your certificate for "${courseTitle}" has been issued.`,
        "certificate",
        {
          certificateId: certificate._id.toString(),
          certificateNumber: populatedCertificate.certificateNumber,
          courseId: populatedCertificate.course?._id?.toString() || null,
        },
        `/certificates/${certificate._id}`
      );
    } catch (notifError) {
      // eslint-disable-next-line no-console
      console.error("[Certificate] Error creating notification:", notifError);
      // Don't fail certificate generation if notification fails
    }

    return res.status(201).json({
      certificate: populatedCertificate,
      message: "Certificate generated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Student Certificates
 * GET /api/v1/certificates/student
 */
export const getStudentCertificates = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { page = 1, pageSize = 20, status } = req.query;

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

    // Students can only view their own certificates
    let query = {};
    if (userRole === "student") {
      query.student = userObjectId;
    } else if (userRole === "super-admin") {
      // Admins can view all
      if (req.query.studentId) {
        query.student = new mongoose.Types.ObjectId(req.query.studentId);
      }
    } else {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      });
    }

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [certificates, total] = await Promise.all([
      Certificate.find(query)
        .populate("student", "fullName email")
        .populate("course", "title thumbnailUrl")
        .populate("template", "name")
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Certificate.countDocuments(query),
    ]);

    return res.json({
      certificates,
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
 * Get Certificate Details
 * GET /api/v1/certificates/:certificateId
 */
export const getCertificateDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { certificateId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(certificateId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid certificate ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const certificate = await Certificate.findById(certificateId)
      .populate("student", "fullName email")
      .populate("course", "title description thumbnailUrl")
      .populate("template", "name design")
      .populate("issuedBy", "fullName")
      .lean();

    if (!certificate) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Certificate not found",
        },
      });
    }

    // Check permissions
    if (
      userRole !== "super-admin" &&
      certificate.student._id.toString() !== userObjectId.toString()
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only view your own certificates",
        },
      });
    }

    return res.json({
      certificate,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Download Certificate PDF
 * GET /api/v1/certificates/:certificateId/pdf
 */
export const downloadCertificatePDF = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { certificateId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(certificateId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid certificate ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const certificate = await Certificate.findById(certificateId)
      .populate("student", "fullName email")
      .populate("course", "title")
      .populate("template", "name design")
      .lean();

    if (!certificate) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Certificate not found",
        },
      });
    }

    // Check permissions
    if (
      userRole !== "super-admin" &&
      certificate.student._id.toString() !== userObjectId.toString()
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only download your own certificates",
        },
      });
    }

    if (certificate.status !== "generated" && certificate.status !== "issued") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Certificate is not ready for download",
        },
      });
    }

    // In production, generate actual PDF here using pdfkit, puppeteer, or similar
    // For now, return certificate data that can be used to generate PDF on frontend
    // or return a placeholder URL

    return res.json({
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        verificationCode: certificate.verificationCode,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        completionDate: certificate.completionDate,
        issuedAt: certificate.issuedAt,
        template: certificate.template,
      },
      pdfUrl: certificate.pdfUrl,
      message:
        "PDF generation endpoint. In production, this would return the actual PDF file. For now, use the certificate data to generate PDF on frontend.",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Verify Certificate
 * GET /api/v1/certificates/verify/:verificationCode
 */
export const verifyCertificate = async (req, res, next) => {
  try {
    const { verificationCode } = req.params;

    if (!verificationCode) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Verification code is required",
        },
      });
    }

    const certificate = await Certificate.findOne({ verificationCode })
      .populate("student", "fullName email")
      .populate("course", "title")
      .populate("template", "name")
      .lean();

    if (!certificate) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Certificate not found with this verification code",
        },
        valid: false,
      });
    }

    if (certificate.status === "revoked") {
      return res.json({
        valid: false,
        message: "This certificate has been revoked",
        certificate: null,
      });
    }

    return res.json({
      valid: true,
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        completionDate: certificate.completionDate,
        issuedAt: certificate.issuedAt,
        issuedType: certificate.issuedType,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get All Certificates (Admin)
 * GET /api/v1/certificates
 */
export const getAllCertificates = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { page = 1, pageSize = 20, status, studentId, courseId } = req.query;

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
          message: "Only admins can view all certificates",
        },
      });
    }

    const query = {};
    if (status) query.status = status;
    if (studentId && mongoose.isValidObjectId(studentId)) {
      query.student = new mongoose.Types.ObjectId(studentId);
    }
    if (courseId && mongoose.isValidObjectId(courseId)) {
      query.course = new mongoose.Types.ObjectId(courseId);
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [certificates, total] = await Promise.all([
      Certificate.find(query)
        .populate("student", "fullName email")
        .populate("course", "title thumbnailUrl")
        .populate("template", "name")
        .populate("issuedBy", "fullName")
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Certificate.countDocuments(query),
    ]);

    return res.json({
      certificates,
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
 * Revoke Certificate (Admin)
 * DELETE /api/v1/certificates/:certificateId
 */
export const revokeCertificate = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { certificateId } = req.params;

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
          message: "Only admins can revoke certificates",
        },
      });
    }

    if (!mongoose.isValidObjectId(certificateId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid certificate ID",
        },
      });
    }

    const certificate = await Certificate.findByIdAndUpdate(
      certificateId,
      { status: "revoked" },
      { new: true }
    )
      .populate("student", "fullName email")
      .populate("course", "title")
      .lean();

    if (!certificate) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Certificate not found",
        },
      });
    }

    return res.json({
      certificate,
      message: "Certificate revoked successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Certificate Templates
 * GET /api/v1/certificates/templates
 */
export const getCertificateTemplates = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { templateType, isActive } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Only admins can view templates
    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view templates",
        },
      });
    }

    const query = {};
    if (templateType) query.templateType = templateType;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const templates = await CertificateTemplate.find(query)
      .populate("createdBy", "fullName")
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return res.json({
      templates,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create Certificate Template (Admin)
 * POST /api/v1/certificates/templates
 */
export const createCertificateTemplate = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const templateData = req.body;

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
          message: "Only admins can create templates",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const template = await CertificateTemplate.create({
      ...templateData,
      createdBy: userObjectId,
    });

    const populatedTemplate = await CertificateTemplate.findById(template._id)
      .populate("createdBy", "fullName")
      .lean();

    return res.status(201).json({
      template: populatedTemplate,
      message: "Template created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update Certificate Template (Admin)
 * PUT /api/v1/certificates/templates/:templateId
 */
export const updateCertificateTemplate = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { templateId } = req.params;
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
          message: "Only admins can update templates",
        },
      });
    }

    if (!mongoose.isValidObjectId(templateId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid template ID",
        },
      });
    }

    const template = await CertificateTemplate.findByIdAndUpdate(templateId, updateData, {
      new: true,
    })
      .populate("createdBy", "fullName")
      .lean();

    if (!template) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Template not found",
        },
      });
    }

    return res.json({
      template,
      message: "Template updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete Certificate Template (Admin)
 * DELETE /api/v1/certificates/templates/:templateId
 */
export const deleteCertificateTemplate = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { templateId } = req.params;

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
          message: "Only admins can delete templates",
        },
      });
    }

    if (!mongoose.isValidObjectId(templateId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid template ID",
        },
      });
    }

    const template = await CertificateTemplate.findByIdAndDelete(templateId).lean();

    if (!template) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Template not found",
        },
      });
    }

    return res.json({
      message: "Template deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

