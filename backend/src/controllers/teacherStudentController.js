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
    const { page = 1, pageSize = 20, courseId, search } = req.query;

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

    if (!teacherObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

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
        return res.json({
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
    if (search) {
      // We'll filter after populating student
    }

    // Get enrollments
    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate("student", "fullName email")
      .populate("course", "title")
      .sort({ enrolledAt: -1 })
      .lean();

    // Group by student and aggregate data
    const studentMap = new Map();

    enrollments.forEach((enrollment) => {
      const studentId = enrollment.student._id.toString();
      const studentName = enrollment.student.fullName || "Unknown";
      const studentEmail = enrollment.student.email || "";

      // Filter by search if provided
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !studentName.toLowerCase().includes(searchLower) &&
          !studentEmail.toLowerCase().includes(searchLower)
        ) {
          return;
        }
      }

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName,
          studentEmail,
          courses: [],
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          lastActivity: null,
        });
      }

      const studentData = studentMap.get(studentId);
      studentData.courses.push({
        courseId: enrollment.course._id.toString(),
        courseTitle: enrollment.course.title,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        lastAccessedAt: enrollment.lastAccessedAt,
      });

      studentData.totalEnrollments += 1;
      if (enrollment.status === "active") studentData.activeEnrollments += 1;
      if (enrollment.status === "completed") studentData.completedEnrollments += 1;

      if (
        !studentData.lastActivity ||
        (enrollment.lastAccessedAt &&
          new Date(enrollment.lastAccessedAt) > new Date(studentData.lastActivity))
      ) {
        studentData.lastActivity = enrollment.lastAccessedAt;
      }
    });

    // Convert to array and sort
    let students = Array.from(studentMap.values()).sort((a, b) => {
      if (b.lastActivity && a.lastActivity) {
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      }
      return b.totalEnrollments - a.totalEnrollments;
    });

    // Pagination
    const total = students.length;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedStudents = students.slice(skip, skip + parseInt(pageSize));

    return res.json({
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
          e.student.fullName?.toLowerCase().includes(searchLower) ||
          e.student.email?.toLowerCase().includes(searchLower)
      );
    }

    // Get all videos for the course to calculate progress
    const courseVideos = await CourseVideo.find({ course: courseId }).lean();
    const totalVideos = courseVideos.length;
    const videoIds = courseVideos.map((v) => v._id);

    // Get all video progress records for this course
    const allVideoProgress = await VideoProgress.find({
      course: courseId,
      video: { $in: videoIds },
    }).lean();

    // Get lesson completions for progress
    const lessonCompletions = await LessonCompletion.find({
      course: courseId,
    }).lean();

    // Get quiz attempts for this course (if course has quizzes)
    const courseQuizzes = await Quiz.find({
      "metadata.courseId": courseId,
    }).lean();

    const quizIds = courseQuizzes.map((q) => q._id);
    const quizAttempts =
      quizIds.length > 0
        ? await QuizAttempt.find({
            quiz: { $in: quizIds },
          }).lean()
        : [];

    // Get all certificates for this course to check if students already have certificates
    const certificates = await Certificate.find({
      course: courseId,
    }).lean();

    // Create a map of student certificates
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
          totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

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
          studentName: enrollment.student.fullName || "Unknown",
          studentEmail: enrollment.student.email || "",
          enrollmentId: enrollment._id.toString(),
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          completedAt: enrollment.completedAt,
          courseProgressPercentage, // NEW: Course progress percentage (0-100)
          hasCertificate, // NEW: Whether student already has a certificate
          progress: {
            lessonCompletions: studentCompletions,
            avgQuizScore: avgQuizScore ? Math.round(avgQuizScore * 100) / 100 : null,
            quizAttempts: studentQuizAttempts.length,
          },
        };
      })
    );

    // Pagination
    const total = students.length;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedStudents = students.slice(skip, skip + parseInt(pageSize));

    return res.json({
      course: {
        id: course._id.toString(),
        title: course.title,
      },
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

    let courseIds = [];
    let enrollments = [];
    let lessonCompletions = [];
    let quizAttempts = [];
    
    // Super-admin can view any student, teachers only students in their courses
    if (userRole === "super-admin") {
      // Super-admin sees all enrollments and data for the student
      enrollments = await Enrollment.find({ student: studentId })
        .populate("course", "title category")
        .sort({ enrolledAt: -1 })
        .lean();
      
      courseIds = enrollments.map((e) => e.course._id);
      
      lessonCompletions = await LessonCompletion.find({
        student: studentId,
      })
        .populate("course", "title")
        .lean();

      const allQuizzes = await Quiz.find().select("_id").lean();
      const quizIds = allQuizzes.map((q) => q._id);
      
      quizAttempts = await QuizAttempt.find({
        student: studentId,
        quiz: { $in: quizIds },
      })
        .populate("quiz", "title")
        .sort({ attemptedAt: -1 })
        .lean();
    } else {
      // Teacher sees only data for their courses
      const teacherCourses = await Course.find({ instructor: teacherObjectId }).lean();
      courseIds = teacherCourses.map((c) => c._id);

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
    const student = await User.findById(studentId).select("fullName email").lean();
    if (!student) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Student not found",
        },
      });
    }

    // Calculate overall performance
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.status === "completed").length;
    const totalLessonsCompleted = lessonCompletions.length;
    const totalQuizAttempts = quizAttempts.length;
    const avgQuizScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttempts.length
        : 0;

    return res.json({
      student: {
        id: student._id.toString(),
        name: student.fullName,
        email: student.email,
      },
      enrollments: enrollments.map((e) => ({
        courseId: e.course._id.toString(),
        courseTitle: e.course.title,
        category: e.course.category,
        status: e.status,
        enrolledAt: e.enrolledAt,
        lastAccessedAt: e.lastAccessedAt,
        completedAt: e.completedAt,
      })),
      performance: {
        totalCourses,
        completedCourses,
        completionRate:
          totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100 * 100) / 100 : 0,
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

