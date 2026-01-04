# Security Features Documentation

This document outlines the security features implemented in the Digital AELA platform, specifically focusing on password management and audit logging.

## 1. Password Management Section

A new **Security** section has been added to the Admin Panel Settings page. This section allows administrators to securely update their account passwords and manage financial security.

### Features (Account & Financial Passwords):

- **Current Password Verification**: Users must provide their current password to authorize a change (for account passwords).
- **Strength Validation**: All passwords must meet strict complexity requirements:
  - Minimum 12 characters.
  - At least one uppercase letter.
  - At least one lowercase letter.
  - At least one number.
  - At least one special character (`@$!%*?&`).
- **Real-time Feedback**: The UI provides a password strength indicator and a checklist of requirements for both account and financial password resets.
- **Password History**: Users cannot reuse any of their last **5 passwords** for their account.
- **Rate Limiting**: Password change attempts are rate-limited to 3 attempts per 15 minutes to prevent brute-force attacks.
- **Email Notification**: Users receive an email confirmation immediately after a successful account or financial password change.

## 2. Audit Logging System

A comprehensive audit logging system has been implemented to track sensitive actions within the system.

### Tracked Actions:

- `password_change`: Logged when a user successfully changes their password.
- `password_change_attempt`: Logged when a password change attempt fails (e.g., incorrect current password).

### Logged Data:

Each audit log entry includes:

- **User**: The ID of the user performing the action.
- **Action**: The specific action performed.
- **Entity**: The model affected (e.g., `User`).
- **Status**: `success` or `failure`.
- **Details**: Additional information such as failure reasons.
- **Contextual Info**: IP address and User Agent of the request.
- **Timestamp**: Exact date and time of the event.

## 3. Technical Implementation Details

### Backend

- **Controller**: [authController.js](file:///c:/Users/harsh/Desktop/Digital-AELA--main/backend/src/controllers/authController.js) contains the `changePassword` logic.
- **Model Extensions**:
  - [User.js](file:///c:/Users/harsh/Desktop/Digital-AELA--main/backend/src/models/User.js) now includes `passwordHistory` and `lastPasswordChange`.
  - [AuditLog.js](file:///c:/Users/harsh/Desktop/Digital-AELA--main/backend/src/models/AuditLog.js) defines the schema for audit events.
- **Middleware**: [rateLimiter.js](file:///c:/Users/harsh/Desktop/Digital-AELA--main/backend/src/middleware/rateLimiter.js) provides the `strictRateLimiter`.

### Frontend

- **Page**: [SystemSettings.jsx](file:///c:/Users/harsh/Desktop/Digital-AELA--main/frontend/modules/admin/pages/SystemSettings.jsx) implements the Security category UI.
- **Service**: [auth.js](file:///c:/Users/harsh/Desktop/Digital-AELA--main/frontend/src/services/api/auth.js) includes the `changePassword` API call.

## 4. Verification

A verification script is available at `backend/scripts/verifyPasswordChange.js` to test the password security logic, including history checks and strength validation.

```bash
node backend/scripts/verifyPasswordChange.js
```
