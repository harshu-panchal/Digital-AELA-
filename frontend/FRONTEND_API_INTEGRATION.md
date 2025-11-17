# Frontend API Integration Guide

This document outlines the newly integrated frontend services for enrollment and password reset.

---

## 📚 Course Enrollment Services

All enrollment functions are available in `src/services/api/courses.js`

### Available Functions

#### 1. `enrollInCourse(courseId)`

Enroll the authenticated student in a course.

```javascript
import { enrollInCourse } from "@/services/api/courses";

try {
  const result = await enrollInCourse("course-id-here");
  console.log("Enrolled successfully:", result.enrollment);
} catch (error) {
  console.error("Enrollment failed:", error);
}
```

#### 2. `fetchEnrolledCourses(params)`

Get all courses enrolled by the authenticated student.

```javascript
import { fetchEnrolledCourses } from "@/services/api/courses";

// Get all enrolled courses
const { enrollments, pagination } = await fetchEnrolledCourses();

// Get only active enrollments
const activeEnrollments = await fetchEnrolledCourses({
  status: "active",
  page: 1,
  pageSize: 10,
});
```

#### 3. `getEnrollmentStatus(courseId)`

Check if the student is enrolled in a specific course.

```javascript
import { getEnrollmentStatus } from "@/services/api/courses";

try {
  const { enrolled, enrollment } = await getEnrollmentStatus("course-id");
  if (enrolled) {
    console.log("Enrollment details:", enrollment);
  }
} catch (error) {
  // Not enrolled or course doesn't exist
  console.log("Not enrolled");
}
```

#### 4. `updateEnrollmentStatus(courseId, status)`

Update enrollment status (pause, resume, complete, etc.).

```javascript
import { updateEnrollmentStatus } from "@/services/api/courses";

// Pause enrollment
await updateEnrollmentStatus("course-id", "paused");

// Resume enrollment
await updateEnrollmentStatus("course-id", "active");

// Mark as completed
await updateEnrollmentStatus("course-id", "completed");
```

#### 5. `unenrollFromCourse(courseId)`

Unenroll from a course.

```javascript
import { unenrollFromCourse } from "@/services/api/courses";

await unenrollFromCourse("course-id");
```

---

---

## 🔐 Password Reset Services

All password reset functions are available in `src/services/api/auth.js`

### Available Functions

#### 1. `requestPasswordReset(email)`

Request a password reset email.

```javascript
import { requestPasswordReset } from "@/services/api/auth";

try {
  const result = await requestPasswordReset("user@example.com");
  // Always returns success message (for security)
  console.log(result.message);
  // "If an account with that email exists, a password reset link has been sent."
} catch (error) {
  console.error("Failed to request reset:", error);
}
```

#### 2. `resetPassword(token, newPassword)`

Reset password using the token from email.

```javascript
import { resetPassword } from "@/services/api/auth";

// Get token from URL query params
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

try {
  const result = await resetPassword(token, "newSecurePassword123");
  console.log(result.message);
  // "Password has been successfully reset. You can now log in with your new password."
} catch (error) {
  if (error.code === "INVALID_TOKEN") {
    console.error("Invalid or expired token");
  }
}
```

---

## 🎯 Usage Examples

### Complete Enrollment Flow

```javascript
import {
  fetchCourseById,
  getEnrollmentStatus,
  enrollInCourse,
  getCourseProgress,
} from "@/services/api/courses";

// 1. Check if already enrolled
const enrollmentStatus = await getEnrollmentStatus(courseId);
if (enrollmentStatus.enrolled) {
  // Already enrolled, show course content
  const progress = await getCourseProgress(courseId);
  return;
}

// 2. Enroll in course
try {
  await enrollInCourse(courseId);
  // Show success message
} catch (error) {
  if (error.code === "ALREADY_ENROLLED") {
    // Handle already enrolled case
  }
}
```

### Password Reset Flow

```javascript
import { requestPasswordReset, resetPassword } from "@/services/api/auth";

// Forgot Password Page
const handleForgotPassword = async (email) => {
  try {
    await requestPasswordReset(email);
    setMessage("Check your email for password reset instructions");
  } catch (error) {
    setError("Failed to send reset email");
  }
};

// Reset Password Page
const handleResetPassword = async (token, newPassword, confirmPassword) => {
  if (newPassword !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  if (newPassword.length < 6) {
    setError("Password must be at least 6 characters");
    return;
  }

  try {
    await resetPassword(token, newPassword);
    setMessage("Password reset successful! Redirecting to login...");
    setTimeout(() => navigate("/login"), 2000);
  } catch (error) {
    if (error.code === "INVALID_TOKEN") {
      setError("Invalid or expired reset link. Please request a new one.");
    } else {
      setError("Failed to reset password");
    }
  }
};
```

---

## 🔄 Error Handling

All functions throw errors that should be caught:

```javascript
try {
  await enrollInCourse(courseId);
} catch (error) {
  // Error object structure:
  // {
  //   message: "Error message",
  //   status: 400,
  //   code: "ERROR_CODE",
  //   details: {...}
  // }

  switch (error.code) {
    case "ALREADY_ENROLLED":
      // Handle already enrolled
      break;
    case "NOT_FOUND":
      // Course not found
      break;
    case "UNAUTHORIZED":
      // User not authenticated
      break;
    default:
    // Generic error
  }
}
```

---

## 📝 Notes

1. **Authentication Required**: All enrollment and progress functions require authentication (student role).

2. **Error Codes**: Common error codes:

   - `ALREADY_ENROLLED` - User already enrolled
   - `NOT_ENROLLED` - User not enrolled
   - `NOT_FOUND` - Course/lesson not found
   - `INVALID_TOKEN` - Password reset token invalid/expired
   - `VALIDATION_ERROR` - Invalid input data

3. **Progress Calculation**: Progress is automatically calculated when lessons are marked complete.

4. **Course Completion**: Courses are automatically marked as completed when progress reaches 100%.

5. **Token Expiration**: Password reset tokens expire after 1 hour.

---

## 🚀 Next Steps

1. Create UI components for:

   - Course enrollment button
   - Progress bar/indicator
   - Lesson completion checkbox/button
   - Password reset forms

2. Integrate with existing components:

   - Course detail pages
   - Student dashboard
   - Video player components

3. Add loading states and error handling in UI

4. Test all flows end-to-end

---

For more information, see the backend API documentation or contact the development team.
