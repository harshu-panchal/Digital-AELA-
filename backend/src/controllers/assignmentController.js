import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";

/**
 * Teacher: Create Assignment
 * POST /api/v1/teacher/assignments
 */
export const createAssignment = async (req, res, next) => {
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

    if (userRole !== "teacher" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can create assignments",
        },
      });
    }

    const {
      title,
      description,
      courseId,
      dueDate,
      maxMarks,
      instructions,
      attachments,
      allowLateSubmission,
      latePenalty,
      status,
    } = req.body;

    if (!title) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title is required",
        },
      });
    }

    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid course ID is required",
        },
      });
    }

    if (!dueDate) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Due date is required",
        },
      });
    }

    const instructorObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    // Verify course exists and teacher is the instructor
    const course = await Course.findById(courseObjectId).lean();
    if (!course) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Super-admin can create assignments for any course, teachers only for their own
    if (userRole !== "super-admin" && course.instructor.toString() !== instructorObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only create assignments for your own courses",
        },
      });
    }

    const assignment = await Assignment.create({
      title,
      description: description || "",
      course: courseObjectId,
      instructor: instructorObjectId,
      dueDate: new Date(dueDate),
      maxMarks: maxMarks || 100,
      instructions: instructions || "",
      attachments: attachments || [],
      allowLateSubmission: allowLateSubmission || false,
      latePenalty: latePenalty || 0,
      status: status || "published",
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate("course", "title")
      .populate("instructor", "fullName")
      .lean();

    // Create notifications for enrolled students
    try {
      const { createBulkNotifications } = await import("../utils/notificationHelper.js");
      
      // Get all enrolled students for this course
      const enrollments = await Enrollment.find({
        course: courseObjectId,
        status: "active",
      })
        .select("student")
        .lean();
      
      if (enrollments.length > 0) {
        const studentIds = enrollments.map((e) => e.student);
        const courseTitle = populatedAssignment.course?.title || "course";
        const assignmentTitle = populatedAssignment.title;
        const dueDateStr = new Date(dueDate).toLocaleDateString();
        
        await createBulkNotifications(
          studentIds,
          "New Assignment Added",
          `A new assignment "${assignmentTitle}" has been added to "${courseTitle}". Due date: ${dueDateStr}`,
          "assignment",
          {
            assignmentId: assignment._id.toString(),
            courseId: courseId,
            courseTitle: courseTitle,
            dueDate: dueDate,
          },
          `/student/assignments/${assignment._id}`
        );
      }
    } catch (notifError) {
      // eslint-disable-next-line no-console
      console.error("[Assignment] Error creating notifications:", notifError);
      // Don't fail assignment creation if notification fails
    }

    return res.status(201).json({
      assignment: populatedAssignment,
      message: "Assignment created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Get All Assignments for My Courses
 * GET /api/v1/teacher/assignments
 */
export const getTeacherAssignments = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { courseId, status, page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can access this endpoint",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Build assignment query
    let assignmentQuery = {};
    
    // Super-admin can see all assignments, teachers only see their own courses
    if (userRole === "super-admin") {
      // Super-admin sees all assignments
      if (courseId && mongoose.isValidObjectId(courseId)) {
        assignmentQuery.course = new mongoose.Types.ObjectId(courseId);
      }
    } else {
      // Teacher sees only assignments for their courses
      const courseQuery = { instructor: teacherObjectId };
      if (courseId && mongoose.isValidObjectId(courseId)) {
        courseQuery._id = new mongoose.Types.ObjectId(courseId);
      }

      const teacherCourses = await Course.find(courseQuery).select("_id").lean();
      const courseIds = teacherCourses.map((c) => c._id);

      if (courseIds.length === 0) {
        return res.json({
          assignments: [],
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total: 0,
            totalPages: 0,
          },
        });
      }

      assignmentQuery.course = { $in: courseIds };
    }
    
    if (status) {
      assignmentQuery.status = status;
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [assignments, total] = await Promise.all([
      Assignment.find(assignmentQuery)
        .populate("course", "title thumbnailUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Assignment.countDocuments(assignmentQuery),
    ]);

    // Get submission counts for each assignment
    const assignmentIds = assignments.map((a) => a._id);
    const submissionCounts = await AssignmentSubmission.aggregate([
      {
        $match: {
          assignment: { $in: assignmentIds },
        },
      },
      {
        $group: {
          _id: "$assignment",
          total: { $sum: 1 },
          graded: {
            $sum: {
              $cond: [{ $eq: ["$status", "graded"] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "submitted"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const countsMap = {};
    submissionCounts.forEach((count) => {
      countsMap[count._id.toString()] = count;
    });

    const assignmentsWithCounts = assignments.map((assignment) => ({
      ...assignment,
      submissionStats: countsMap[assignment._id.toString()] || {
        total: 0,
        graded: 0,
        pending: 0,
      },
    }));

    return res.json({
      assignments: assignmentsWithCounts,
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
 * Teacher: Get Assignment Details with Submissions
 * GET /api/v1/teacher/assignments/:assignmentId
 */
export const getAssignmentDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { assignmentId } = req.params;
    const { includeSubmissions = "true" } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can access this endpoint",
        },
      });
    }

    if (!mongoose.isValidObjectId(assignmentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid assignment ID",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const assignment = await Assignment.findById(assignmentId)
      .populate("course", "title thumbnailUrl")
      .populate("instructor", "fullName email")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Assignment not found",
        },
      });
    }

    // Super-admin can view any assignment, teachers only their own
    if (userRole !== "super-admin" && assignment.instructor._id.toString() !== teacherObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only view your own assignments",
        },
      });
    }

    let submissions = [];
    if (includeSubmissions === "true") {
      submissions = await AssignmentSubmission.find({
        assignment: assignmentId,
      })
        .populate("student", "fullName email avatarUrl")
        .sort({ submittedAt: -1 })
        .lean();
    }

    return res.json({
      assignment,
      submissions,
      submissionCount: submissions.length,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Grade Assignment Submission
 * PUT /api/v1/teacher/assignments/:assignmentId/submissions/:submissionId/grade
 */
export const gradeSubmission = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { assignmentId, submissionId } = req.params;
    const { marks, feedback } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can grade submissions",
        },
      });
    }

    if (!mongoose.isValidObjectId(assignmentId) || !mongoose.isValidObjectId(submissionId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid assignment or submission ID",
        },
      });
    }

    if (marks === undefined || marks === null || isNaN(Number(marks))) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid marks are required",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Verify assignment belongs to teacher
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Assignment not found",
        },
      });
    }

    // Super-admin can grade any submission, teachers only their own assignments
    if (userRole !== "super-admin" && assignment.instructor.toString() !== teacherObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only grade submissions for your own assignments",
        },
      });
    }

    // Verify submission exists and belongs to assignment
    const submission = await AssignmentSubmission.findById(submissionId).lean();
    if (!submission) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Submission not found",
        },
      });
    }

    if (submission.assignment.toString() !== assignmentId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Submission does not belong to this assignment",
        },
      });
    }

    const marksValue = Number(marks);
    if (marksValue < 0 || marksValue > assignment.maxMarks) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Marks must be between 0 and ${assignment.maxMarks}`,
        },
      });
    }

    // Update submission
    const updatedSubmission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      {
        marks: marksValue,
        feedback: feedback || "",
        status: "graded",
        gradedAt: new Date(),
        gradedBy: teacherObjectId,
      },
      { new: true }
    )
      .populate("student", "fullName email")
      .populate("assignment", "title maxMarks")
      .lean();

    return res.json({
      submission: updatedSubmission,
      message: "Submission graded successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Student: Get Assignments for Enrolled Courses
 * GET /api/v1/student/assignments
 */
export const getStudentAssignments = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { courseId, status, page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Get student's enrollments
    const enrollmentQuery = { student: studentObjectId, status: "active" };
    if (courseId && mongoose.isValidObjectId(courseId)) {
      enrollmentQuery.course = new mongoose.Types.ObjectId(courseId);
    }

    const enrollments = await Enrollment.find(enrollmentQuery).select("course").lean();
    const courseIds = enrollments.map((e) => e.course);

    if (courseIds.length === 0) {
      return res.json({
        assignments: [],
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Build assignment query
    const assignmentQuery = {
      course: { $in: courseIds },
      status: "published",
    };

    if (status === "due") {
      assignmentQuery.dueDate = { $lt: new Date() };
    } else if (status === "upcoming") {
      assignmentQuery.dueDate = { $gte: new Date() };
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [assignments, total] = await Promise.all([
      Assignment.find(assignmentQuery)
        .populate("course", "title thumbnailUrl")
        .populate("instructor", "fullName")
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Assignment.countDocuments(assignmentQuery),
    ]);

    // Get submission status for each assignment
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIds },
      student: studentObjectId,
    }).lean();

    const submissionMap = {};
    submissions.forEach((sub) => {
      submissionMap[sub.assignment.toString()] = sub;
    });

    const assignmentsWithStatus = assignments.map((assignment) => {
      const submission = submissionMap[assignment._id.toString()];
      const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;
      const isSubmitted = !!submission;
      const isGraded = submission?.status === "graded";

      return {
        ...assignment,
        submissionStatus: isGraded
          ? "graded"
          : isSubmitted
          ? "submitted"
          : isOverdue
          ? "overdue"
          : "pending",
        submission: submission || null,
      };
    });

    return res.json({
      assignments: assignmentsWithStatus,
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
 * Student: Submit Assignment
 * POST /api/v1/student/assignments/:assignmentId/submit
 */
export const submitAssignment = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { assignmentId } = req.params;
    const { submissionType, submittedFiles, submittedText, submittedUrl } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(assignmentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid assignment ID",
        },
      });
    }

    if (!submissionType || !["file", "text", "url", "mixed"].includes(submissionType)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid submission type is required",
        },
      });
    }

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Verify assignment exists
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Assignment not found",
        },
      });
    }

    // Verify student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: studentObjectId,
      course: assignment.course,
      status: "active",
    }).lean();

    if (!enrollment) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You must be enrolled in this course to submit assignments",
        },
      });
    }

    // Check if assignment is still open
    if (assignment.status === "closed") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "This assignment is closed for submissions",
        },
      });
    }

    // Check due date
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isLate = now > dueDate;

    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Assignment due date has passed and late submissions are not allowed",
        },
      });
    }

    // Validate submission content based on type
    if (submissionType === "file" && (!submittedFiles || submittedFiles.length === 0)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "At least one file is required for file submission",
        },
      });
    }

    if (submissionType === "text" && !submittedText) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Text content is required for text submission",
        },
      });
    }

    if (submissionType === "url" && !submittedUrl) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "URL is required for URL submission",
        },
      });
    }

    // Check if submission already exists
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentObjectId,
    }).lean();

    let submission;
    if (existingSubmission) {
      // Update existing submission
      submission = await AssignmentSubmission.findByIdAndUpdate(
        existingSubmission._id,
        {
          submissionType,
          submittedFiles: submittedFiles || [],
          submittedText: submittedText || "",
          submittedUrl: submittedUrl || "",
          submittedAt: new Date(),
          status: isLate ? "late" : "submitted",
          isLate,
          course: assignment.course,
        },
        { new: true }
      )
        .populate("assignment", "title maxMarks dueDate")
        .populate("student", "fullName email")
        .lean();
    } else {
      // Create new submission
      submission = await AssignmentSubmission.create({
        assignment: assignmentId,
        student: studentObjectId,
        course: assignment.course,
        submissionType,
        submittedFiles: submittedFiles || [],
        submittedText: submittedText || "",
        submittedUrl: submittedUrl || "",
        submittedAt: new Date(),
        status: isLate ? "late" : "submitted",
        isLate,
        maxMarks: assignment.maxMarks,
      });

      submission = await AssignmentSubmission.findById(submission._id)
        .populate("assignment", "title maxMarks dueDate")
        .populate("student", "fullName email")
        .lean();
    }

    return res.status(existingSubmission ? 200 : 201).json({
      submission,
      message: existingSubmission
        ? "Submission updated successfully"
        : "Assignment submitted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Student: Get Assignment Details with Submission
 * GET /api/v1/student/assignments/:assignmentId
 */
export const getStudentAssignmentDetails = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { assignmentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(assignmentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid assignment ID",
        },
      });
    }

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const assignment = await Assignment.findById(assignmentId)
      .populate("course", "title thumbnailUrl")
      .populate("instructor", "fullName email")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Assignment not found",
        },
      });
    }

    // Verify student is enrolled
    const enrollment = await Enrollment.findOne({
      student: studentObjectId,
      course: assignment.course,
      status: "active",
    }).lean();

    if (!enrollment) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You must be enrolled in this course to view assignments",
        },
      });
    }

    // Get student's submission if exists
    const submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentObjectId,
    })
      .populate("gradedBy", "fullName")
      .lean();

    const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;
    const isSubmitted = !!submission;
    const isGraded = submission?.status === "graded";

    return res.json({
      assignment,
      submission: submission || null,
      submissionStatus: isGraded
        ? "graded"
        : isSubmitted
        ? "submitted"
        : isOverdue
        ? "overdue"
        : "pending",
      isOverdue,
    });
  } catch (error) {
    return next(error);
  }
};

