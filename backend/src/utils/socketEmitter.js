/**
 * Socket.io emitter utility
 * Provides access to the Socket.io instance from controllers
 */

let ioInstance = null;

/**
 * Set the Socket.io instance
 * @param {Server} io - Socket.io server instance
 */
export const setSocketIO = (io) => {
  ioInstance = io;
};

/**
 * Get the Socket.io instance
 * @returns {Server|null} Socket.io server instance
 */
export const getSocketIO = () => {
  return ioInstance;
};

/**
 * Emit course enrollment event
 * @param {Object} enrollment - Enrollment document
 */
export const emitCourseEnrollment = async (enrollment) => {
  if (!ioInstance) return;

  try {
    const Enrollment = (await import("../models/Enrollment.js")).default;
    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate("student", "fullName email")
      .populate("course", "title instructor")
      .lean();

    if (populatedEnrollment?.course?.instructor) {
      const instructorId = populatedEnrollment.course.instructor.toString();
      const courseId = populatedEnrollment.course._id.toString();

      // Emit to course room subscribers
      ioInstance.to(`course:${courseId}`).emit("new_enrollment", {
        enrollment: {
          id: populatedEnrollment._id.toString(),
          student: {
            id: populatedEnrollment.student._id.toString(),
            name: populatedEnrollment.student.fullName,
            email: populatedEnrollment.student.email,
          },
          course: {
            id: courseId,
            title: populatedEnrollment.course.title,
          },
          enrolledAt: populatedEnrollment.enrolledAt,
          status: populatedEnrollment.status,
        },
      });

      // Notify instructor directly
      ioInstance.to(`user:${instructorId}`).emit("new_enrollment_notification", {
        enrollment: {
          id: populatedEnrollment._id.toString(),
          studentName: populatedEnrollment.student.fullName,
          courseTitle: populatedEnrollment.course.title,
          enrolledAt: populatedEnrollment.enrolledAt,
        },
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Socket.IO] Error emitting course enrollment:", error);
  }
};

/**
 * Emit quiz attempt event
 * @param {Object} attempt - QuizAttempt document
 */
export const emitQuizAttempt = async (attempt) => {
  if (!ioInstance) return;

  try {
    const QuizAttempt = (await import("../models/QuizAttempt.js")).default;
    const populatedAttempt = await QuizAttempt.findById(attempt._id)
      .populate("student", "fullName")
      .populate("quiz", "title metadata")
      .lean();

    if (populatedAttempt?.quiz) {
      const quizId = populatedAttempt.quiz._id.toString();
      const createdBy = populatedAttempt.quiz.metadata?.createdBy;

      if (createdBy) {
        // Emit to quiz room subscribers
        ioInstance.to(`quiz:${quizId}`).emit("new_quiz_attempt", {
          attempt: {
            id: populatedAttempt._id.toString(),
            student: {
              id: populatedAttempt.student._id.toString(),
              name: populatedAttempt.student.fullName,
            },
            quiz: {
              id: quizId,
              title: populatedAttempt.quiz.title || populatedAttempt.quizName,
            },
            score: populatedAttempt.score,
            totalQuestions: populatedAttempt.totalQuestions,
            correctAnswers: populatedAttempt.correctAnswers,
            coinsEarned: populatedAttempt.coinsEarned,
            completedAt: populatedAttempt.completedAt,
          },
        });

        // Notify teacher directly
        ioInstance.to(`user:${createdBy}`).emit("new_quiz_attempt_notification", {
          attempt: {
            id: populatedAttempt._id.toString(),
            studentName: populatedAttempt.student.fullName,
            quizTitle: populatedAttempt.quiz.title || populatedAttempt.quizName,
            score: populatedAttempt.score,
            completedAt: populatedAttempt.completedAt,
          },
        });
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Socket.IO] Error emitting quiz attempt:", error);
  }
};

