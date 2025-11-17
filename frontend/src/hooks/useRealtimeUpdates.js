import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { toast } from "react-toastify";

/**
 * Hook for real-time course enrollment updates (for teachers)
 */
export const useCourseEnrollmentUpdates = (courseId, onNewEnrollment) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !courseId) return;

    // Subscribe to course updates
    socket.emit("subscribe_course_updates", { courseId });

    // Listen for new enrollments
    const handleNewEnrollment = (data) => {
      if (onNewEnrollment) {
        onNewEnrollment(data.enrollment);
      }
    };

    const handleEnrollmentNotification = (data) => {
      toast.info(`${data.enrollment.studentName} enrolled in ${data.enrollment.courseTitle}`);
    };

    socket.on("new_enrollment", handleNewEnrollment);
    socket.on("new_enrollment_notification", handleEnrollmentNotification);

    return () => {
      socket.off("new_enrollment", handleNewEnrollment);
      socket.off("new_enrollment_notification", handleEnrollmentNotification);
      socket.emit("unsubscribe_course_updates", { courseId });
    };
  }, [socket, isConnected, courseId, onNewEnrollment]);
};

/**
 * Hook for real-time quiz attempt updates (for teachers)
 */
export const useQuizAttemptUpdates = (quizId, onNewAttempt) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !quizId) return;

    // Subscribe to quiz updates
    socket.emit("subscribe_quiz_updates", { quizId });

    // Listen for new quiz attempts
    const handleNewAttempt = (data) => {
      if (onNewAttempt) {
        onNewAttempt(data.attempt);
      }
    };

    const handleAttemptNotification = (data) => {
      toast.info(`${data.attempt.studentName} completed ${data.attempt.quizTitle} (Score: ${data.attempt.score}%)`);
    };

    socket.on("new_quiz_attempt", handleNewAttempt);
    socket.on("new_quiz_attempt_notification", handleAttemptNotification);

    return () => {
      socket.off("new_quiz_attempt", handleNewAttempt);
      socket.off("new_quiz_attempt_notification", handleAttemptNotification);
      socket.emit("unsubscribe_quiz_updates", { quizId });
    };
  }, [socket, isConnected, quizId, onNewAttempt]);
};

/**
 * Hook for real-time online status updates
 */
export const useOnlineStatus = (onUserOnline, onUserOffline) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUserOnline = (data) => {
      if (onUserOnline) {
        onUserOnline(data);
      }
    };

    const handleUserOffline = (data) => {
      if (onUserOffline) {
        onUserOffline(data);
      }
    };

    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    // Update own online status
    socket.emit("update_online_status");

    return () => {
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [socket, isConnected, onUserOnline, onUserOffline]);
};

/**
 * Hook for activity feed updates
 */
export const useActivityFeed = (onActivity) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe to activity feed
    socket.emit("subscribe_activity_feed");

    const handleActivity = (data) => {
      if (onActivity) {
        onActivity(data);
      }
    };

    socket.on("activity_update", handleActivity);

    return () => {
      socket.off("activity_update", handleActivity);
      socket.emit("unsubscribe_activity_feed");
    };
  }, [socket, isConnected, onActivity]);
};

