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

---

## Recruiter Dashboard API Smoke Test (Frontend ↔ Backend)

### 1. Pre-flight

- Backend: `cd backend && npm run dev` (requires `.env` with valid `MONGODB_URI`, JWT secrets).
- Frontend: ensure `frontend/.env` has `VITE_API_URL=http://localhost:5000/api/v1`, then `npm run dev`.
- Clear browser storage: `localStorage.removeItem("aela.auth.session"); localStorage.removeItem("aela.auth.tokens");`.

### 2. Recruiter Auth

- Register new recruiter via `/login/recruiter?mode=register`; verify success toast and redirect to `/explore-jobs/recruiter-dashboard`.
- Sign out via navbar, then log back in with same credentials to confirm backend session works.
- Attempt recruiter login with incorrect password → expect unauthorized toast from API.

### 3. Profile & Dashboard Load

- On dashboard load, confirm:
  - Header metrics populated (counts should match API data).
  - “Recommended e-books” list renders items from `/resources/ebooks`.
  - “Blogs in progress” reflects `/recruiter/blogs?status=draft` response.
  - Applicant table fills with `/recruiter/jobs/:id/applicants` data.
- Use “Refresh” button, check for loading banner + success toast and updated data.

### 4. Job CRUD Flow

- Click “New Job Drop”, submit minimal valid data → expect success toast and new card hydrated from API.
- Edit the new job (pencil icon), change title and submit → updated card should reflect API response.
- Delete the job (trash icon) → verify toast + removal from grid and Mongo collection.

### 5. Error Handling Checks

- Temporarily stop backend → trigger dashboard refresh to observe red error banner and toast.
- Submit job form without required fields → ensure client validation prevents API call.

### 6. Follow-ups & Open Items

- ✅ Refresh-token handling now automatic when sessions expire mid-visit.
- ✅ Applicant stage updates exposed in dashboard table; monitor for UX tweaks (loading indicators, bulk updates).
- ✅ Blog composer shipped (draft/publish) — add rich editor + cover image uploads in future iteration.
- Next: incorporate blog editing & deletion, plus analytics cards once backend endpoints exist.

---

## i18n & Translation Guidelines

- **Static UI text (labels, headings, buttons)**
  - Use i18next keys instead of hard-coded strings.
  - Prefer the `common.json` and feature-specific namespaces under `frontend/public/locales/<lng>/`.
  - For React components, get the translator via `const { t } = useLanguage();` and call `t("namespace.key", { defaultValue: "English text" })`.

- **Dynamic / API-driven text**
  - Use the shared hooks/components:
    - `useDynamicTranslation({ sourceLang: "en" })`
    - `TranslatedText` for single strings.
    - `TranslatedContent` or `translateBatch` / `translateObject` for lists and objects.
  - Always batch where possible (e.g., translate all announcement titles in one `translateBatch` call).

- **Language state**
  - The navbar language dropdown must always use `useLanguage().changeLanguage`.
  - `LanguageContext` keeps `i18next`, `localStorage`, and document `dir/lang` in sync for RTL and LTR layouts.

- **When adding new features**
  - Add any new static copy to the appropriate JSON file first.
  - Use `defaultValue` in `t()` calls so English text is still shown while non-English JSONs are being filled.
  - For new dynamic pages (blogs, jobs, dashboards), wire translation once at the data layer instead of inside each small child component.