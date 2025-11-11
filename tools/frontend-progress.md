## Auth Smoke Test Checklist (Frontend)

### 1. Pre-flight

- Clear `localStorage` entries (`aela.auth.users`, `aela.auth.session`) to start fresh.
- Confirm `admin@digitalaela.com / admin123` still signs in as Super Admin.

### 2. Registration Flows

- Student: complete form, ensure password mismatch warning, successful register redirects to `/learn-earn/dashboard`.
- Teacher: register with unique email, verify profile fields persist (inspect `localStorage`).
- Recruiter: register, confirm redirect to `/explore-jobs/recruiter-dashboard`.
- Branch Owner: register, confirm landing on `/`.
- Attempt duplicate email registration to see error toast.

### 3. Login Flows

- Each portal (student/teacher/recruiter/branch owner) logs in with created credentials.
- Try logging into wrong portal (e.g., recruiter credential on student login) to confirm role mismatch toast.
- Validate “already logged in” auto-redirect when revisiting a login page.

### 4. Navigation & Protected Routes

- After sign-in, navbar shows personalised menu (role badge, logout).
- Access protected routes while signed out → redirect to `/login/student` with toast.
- Signed-in user without permission (e.g., student visiting `/learn-earn/admin`) receives forbidden toast + redirect.

### 5. Content Modules

- Visit `/learn-earn`, `/explore-jobs`, `/blogs/create`, `/books/:id/payment` to ensure they render when permitted.
- With no session, confirm each route reroutes to login.
- Blogs: verify `Create Blog` CTA only appears when authenticated.

### 6. Logout Flow

- Use navbar logout, confirm toast, navbar reverts to “Login”, protected routes gate again.
- Log back in to confirm session cleared properly.

### 7. Follow-ups

- Document any missing “forgot password” handling.
- Note any UX quirks (e.g., repeated toasts, uneven redirects) for backend integration pass.
