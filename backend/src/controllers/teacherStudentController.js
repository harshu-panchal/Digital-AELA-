import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import LessonCompletion from "../models/LessonCompletion.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Quiz from "../models/Quiz.js";
import VideoProgress from "../models/VideoProgress.js";
import CourseVideo from "../models/CourseVideo.js";
import Certificate from "../models/Certificate.js";

/**
 * Get all students enrolled in teacher's courses
 * GET /api/v1/teacher/students
 */
export const getTeacherStudents = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { page = 1, pageSize = 20, courseId, status, search } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Build enrollment query
    let enrollmentQuery = {};

    // Super-admin can see all students, teachers only see students in their courses
    if (userRole === "super-admin") {
      // Super-admin sees all enrollments
      if (courseId && mongoose.isValidObjectId(courseId)) {
        enrollmentQuery.course = new mongoose.Types.ObjectId(courseId);
      }
    } else {
      // Teacher sees only students in their courses
      const courseQuery = { instructor: teacherObjectId };
      if (courseId && mongoose.isValidObjectId(courseId)) {
        courseQuery._id = new mongoose.Types.ObjectId(courseId);
      }

      const teacherCourses = await Course.find(courseQuery).lean();
      const courseIds = teacherCourses.map((c) => c._id);

      if (courseIds.length === 0) {
        return res.status(200).json({
          students: [],
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total: 0,
            totalPages: 0,
          },
        });
      }

      enrollmentQuery.course = { $in: courseIds };
    }

    if (status) {
      enrollmentQuery.status = status;
    }

    // Get enrollments with pagination
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate("student", "fullName email")
      .populate("course", "title category")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Enrollment.countDocuments(enrollmentQuery);

    // Aggregate student data
    const studentMap = new Map();
    const studentData = {
      totalStudents: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
    };

    enrollments.forEach((enrollment) => {
      const studentId = enrollment.student._id.toString();
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName: enrollment.student.fullName,
          studentEmail: enrollment.student.email,
          enrollments: [],
        });
        studentData.totalStudents += 1;
      }

      const student = studentMap.get(studentId);
      student.enrollments.push({
        courseId: enrollment.course._id,
        courseTitle: enrollment.course.title,
        courseCategory: enrollment.course.category,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
      });

      if (enrollment.status === "active") studentData.activeEnrollments += 1;
      if (enrollment.status === "completed")
        studentData.completedEnrollments += 1;
    });

    // Filter by search if provided
    let students = Array.from(studentMap.values());
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.studentName.toLowerCase().includes(searchLower) ||
          s.studentEmail.toLowerCase().includes(searchLower)
      );
    }

    return res.status(200).json({
      students,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
      stats: studentData,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get students for a specific course
 * GET /api/v1/teacher/courses/:courseId/students
 */
export const getCourseStudents = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { courseId } = req.params;
    const { page = 1, pageSize = 20, status, search } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
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

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Super-admin can view students for any course, teachers only their own
    let course;
    if (userRole === "super-admin") {
      course = await Course.findById(courseId).lean();
    } else {
      course = await Course.findOne({
        _id: courseId,
        instructor: teacherObjectId,
      }).lean();
    }

    if (!course) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Course not found or you don't have permission",
        },
      });
    }

    // Build enrollment query
    const enrollmentQuery = { course: courseId };
    if (status) {
      enrollmentQuery.status = status;
    }

    // Get enrollments
    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate("student", "fullName email")
      .sort({ enrolledAt: -1 })
      .lean();

    // Filter by search if provided
    let filteredEnrollments = enrollments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEnrollments = enrollments.filter(
        (e) =>
          e.student.fullName.toLowerCase().includes(searchLower) ||
          e.student.email.toLowerCase().includes(searchLower)
      );
    }

    // Get all videos for the course to calculate progress
    const allVideos = await CourseVideo.find({ course: courseId }).lean();
    const totalVideos = allVideos.length;
    const videoIds = allVideos.map((v) => v._id);

    // Get all video progress for these students
    const studentIds = filteredEnrollments.map((e) => e.student._id);
    const allVideoProgress =
      totalVideos > 0 && studentIds.length > 0
        ? await VideoProgress.find({
            course: courseId,
            student: { $in: studentIds },
            video: { $in: videoIds },
          }).lean()
        : [];

    // Get lesson completions
    const lessonCompletions = await LessonCompletion.find({
      course: courseId,
      student: { $in: studentIds },
    }).lean();

    // Get quiz attempts
    const teacherQuizzes = await Quiz.find({
      $or: [
        { "metadata.createdBy": userId },
        { "metadata.createdBy": teacherObjectId.toString() },
        { "metadata.createdBy": teacherObjectId },
      ],
    }).lean();

    const quizIds = teacherQuizzes.map((q) => q._id);
    const quizAttempts =
      quizIds.length > 0 && studentIds.length > 0
        ? await QuizAttempt.find({
            student: { $in: studentIds },
            quiz: { $in: quizIds },
          })
            .populate("quiz", "title")
            .lean()
        : [];

    // Get certificates for this course
    const certificates = await Certificate.find({
      course: courseId,
      student: { $in: studentIds },
    }).lean();

    const certificateMap = new Map();
    certificates.forEach((cert) => {
      const studentId = cert.student.toString();
      certificateMap.set(studentId, true);
    });

    // Format students with progress
    const students = await Promise.all(
      filteredEnrollments.map(async (enrollment) => {
        const studentId = enrollment.student._id.toString();
        const studentObjectId = enrollment.student._id;

        // Calculate course progress percentage based on completed videos
        const studentVideoProgress = allVideoProgress.filter(
          (vp) => vp.student.toString() === studentId && vp.isCompleted === true
        );
        const completedVideos = studentVideoProgress.length;
        const courseProgressPercentage =
          totalVideos > 0
            ? Math.round((completedVideos / totalVideos) * 100)
            : 0;

        // Check if certificate already exists
        const hasCertificate = certificateMap.has(studentId) || false;

        // Calculate progress from lesson completions
        const studentCompletions = lessonCompletions.filter(
          (lc) => lc.student.toString() === studentId
        ).length;

        // Get quiz performance
        const studentQuizAttempts = quizAttempts.filter(
          (qa) => qa.student.toString() === studentId
        );
        const avgQuizScore =
          studentQuizAttempts.length > 0
            ? studentQuizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
              studentQuizAttempts.length
            : null;

        return {
          studentId,
          studentName: enrollment.student.fullName,
          studentEmail: enrollment.student.email,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          courseProgressPercentage, // NEW: Course progress percentage (0-100)
          completedVideos,
          totalVideos,
          lessonCompletions: studentCompletions,
          avgQuizScore: avgQuizScore
            ? Math.round(avgQuizScore * 100) / 100
            : null,
          hasCertificate,
        };
      })
    );

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    const paginatedStudents = students.slice(skip, skip + limit);
    const total = students.length;

    return res.status(200).json({
      students: paginatedStudents,
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
 * Get student details and performance
 * GET /api/v1/teacher/students/:studentId
 */
export const getStudentDetails = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { studentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid student ID",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    // Get enrollments and related data
    let enrollments = [];
    let lessonCompletions = [];
    let quizAttempts = [];

    if (userRole === "super-admin") {
      // Super-admin can see all enrollments for the student
      enrollments = await Enrollment.find({ student: studentObjectId })
        .populate("course", "title category")
        .sort({ enrolledAt: -1 })
        .lean();

      // Get lesson completions
      lessonCompletions = await LessonCompletion.find({
        student: studentObjectId,
      })
        .populate("course", "title")
        .lean();

      // Get quiz attempts
      quizAttempts = await QuizAttempt.find({
        student: studentObjectId,
      })
        .populate("quiz", "title")
        .sort({ completedAt: -1 })
        .lean();
    } else {
      // Teacher sees only data for their courses
      const teacherCourses = await Course.find({
        instructor: teacherObjectId,
      }).lean();
      const courseIds = teacherCourses.map((c) => c._id);

      // Verify student is enrolled in at least one of teacher's courses
      const enrollment = await Enrollment.findOne({
        student: studentId,
        course: { $in: courseIds },
      })
        .populate("student", "fullName email")
        .lean();

      if (!enrollment) {
        return res.status(404).json({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "Student not found in your courses",
          },
        });
      }

      // Get all enrollments for this student in teacher's courses
      enrollments = await Enrollment.find({
        student: studentId,
        course: { $in: courseIds },
      })
        .populate("course", "title category")
        .sort({ enrolledAt: -1 })
        .lean();

      // Get lesson completions
      lessonCompletions = await LessonCompletion.find({
        student: studentId,
        course: { $in: courseIds },
      })
        .populate("course", "title")
        .lean();

      // Get quiz attempts
      const teacherQuizzes = await Quiz.find({
        $or: [
          { "metadata.createdBy": userId },
          { "metadata.createdBy": teacherObjectId.toString() },
          { "metadata.createdBy": teacherObjectId },
        ],
      }).lean();

      const quizIds = teacherQuizzes.map((q) => q._id);
      quizAttempts =
        quizIds.length > 0
          ? await QuizAttempt.find({
              student: studentId,
              quiz: { $in: quizIds },
            })
              .populate("quiz", "title")
              .sort({ completedAt: -1 })
              .lean()
          : [];
    }

    // Get student info
    const student = await User.findById(studentId)
      .select("fullName email")
      .lean();
    if (!student) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Student not found",
        },
      });
    }

    // Calculate performance metrics
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(
      (e) => e.status === "completed"
    ).length;
    const totalLessonsCompleted = lessonCompletions.length;
    const totalQuizAttempts = quizAttempts.length;
    const avgQuizScore =
      totalQuizAttempts > 0
        ? quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
          totalQuizAttempts
        : 0;

    return res.status(200).json({
      student,
      enrollments,
      lessonCompletions,
      quizAttempts,
      performance: {
        totalCourses: enrollments.length,
        completedCourses,
        completionRate:
          totalCourses > 0
            ? Math.round((completedCourses / totalCourses) * 100 * 100) / 100
            : 0,
        totalLessonsCompleted,
        totalQuizAttempts,
        avgQuizScore: Math.round(avgQuizScore * 100) / 100,
      },
      recentActivity: {
        lessonCompletions: lessonCompletions
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map((lc) => ({
            courseTitle: lc.course?.title || "Course",
            completedAt: lc.createdAt,
          })),
        quizAttempts: quizAttempts.slice(0, 10).map((qa) => ({
          quizTitle: qa.quiz?.title || qa.quizName || "Quiz",
          score: qa.score || 0,
          completedAt: qa.completedAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Update student enrollment status for a course
 * PATCH /api/v1/teacher/courses/:courseId/students/:studentId/enrollment
 */
export const updateStudentEnrollmentStatus = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { courseId, studentId } = req.params;
    const { status } = req.body;

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
          message:
            "Only teachers and super admins can update student enrollment status",
        },
      });
    }

    if (
      !mongoose.isValidObjectId(courseId) ||
      !mongoose.isValidObjectId(studentId)
    ) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID or student ID",
        },
      });
    }

    const validStatuses = ["active", "completed", "dropped", "paused"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Verify course ownership (unless super-admin)
    let course;
    if (userRole === "super-admin") {
      course = await Course.findById(courseId).lean();
    } else {
      course = await Course.findOne({
        _id: courseId,
        instructor: teacherObjectId,
      }).lean();
    }

    if (!course) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Course not found or you don't have permission",
        },
      });
    }

    // Update enrollment status
    const enrollment = await Enrollment.findOneAndUpdate(
      {
        student: studentId,
        course: courseId,
      },
      {
        status,
        ...(status === "completed" && { completedAt: new Date() }),
        lastAccessedAt: new Date(),
      },
      { new: true }
    )
      .populate("student", "fullName email")
      .populate("course", "title")
      .lean();

    if (!enrollment) {
      return res.status(404).json({
        error: {
          code: "NOT_ENROLLED",
          message: "Student is not enrolled in this course",
        },
      });
    }

    return res.status(200).json({
      message: "Student enrollment status updated successfully",
      enrollment,
    });
  } catch (error) {
    return next(error);
  }
};
