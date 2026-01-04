# Recruiter API Contract (v1)

This document outlines the backend endpoints needed to support the recruiter dashboard flows:

- Recruiter authentication
- Job post management
- Applicant pipeline visibility
- Recruiter-authored blog posts
- Access to hiring resources (e-books)

All endpoints are versioned under `/api/v1`. Responses are JSON unless stated otherwise.

---

## 1. Authentication

| Action             | Method | Endpoint                | Auth Required | Description                |
| ------------------ | ------ | ----------------------- | ------------- | -------------------------- |
| Recruiter login    | POST   | `/api/v1/auth/login`    | No            | Obtain JWT / session token |
| Recruiter register | POST   | `/api/v1/auth/register` | No            | Create recruiter account   |
| Refresh session    | POST   | `/api/v1/auth/refresh`  | Refresh token | Issue new access token     |
| Logout             | POST   | `/api/v1/auth/logout`   | Access token  | Revoke current session     |

**Headers**

| Header          | Value                   | Notes                               |
| --------------- | ----------------------- | ----------------------------------- |
| `Content-Type`  | `application/json`      | Required for JSON payloads          |
| `Authorization` | `Bearer <ACCESS_TOKEN>` | Required for endpoints marked “Yes” |

**Login Request**

```json
POST /api/v1/auth/login
{
  "email": "recruiter@example.com",
  "password": "hunter2"
}
```

**Login Response**

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "rec_123",
    "role": "recruiter",
    "email": "recruiter@example.com",
    "fullName": "Adil Rahman",
    "createdAt": "2025-02-16T10:00:00.000Z"
  }
}
```

---

## 2. Recruiter Profile

| Action            | Method | Endpoint                    | Auth | Description                     |
| ----------------- | ------ | --------------------------- | ---- | ------------------------------- |
| Get my profile    | GET    | `/api/v1/recruiter/profile` | Yes  | Fetch current recruiter profile |
| Update my profile | PATCH  | `/api/v1/recruiter/profile` | Yes  | Update recruiter metadata       |

**Profile Response**

```json
{
  "id": "rec_123",
  "fullName": "Adil Rahman",
  "company": "AELA Talent Collective",
  "headline": "Talent Partner · GCC",
  "avatarUrl": "https://...",
  "bio": "We help brands hire communication coaches.",
  "socials": {
    "linkedin": "https://linkedin.com/in/...",
    "website": "https://company.com"
  },
  "stats": {
    "activeRoles": 4,
    "totalViews": 1280,
    "totalApplications": 230,
    "savedApplicants": 48
  }
}
```

---

## 3. Job Posts

| Action                | Method | Endpoint                                   | Auth | Description                               |
| --------------------- | ------ | ------------------------------------------ | ---- | ----------------------------------------- |
| List my jobs          | GET    | `/api/v1/recruiter/jobs`                   | Yes  | Get paginated list of recruiter job posts |
| Create job            | POST   | `/api/v1/recruiter/jobs`                   | Yes  | Create a new job post                     |
| Get single job        | GET    | `/api/v1/recruiter/jobs/:jobId`            | Yes  | Fetch job details (owner only)            |
| Update job            | PATCH  | `/api/v1/recruiter/jobs/:jobId`            | Yes  | Update job metadata (title, tags, etc.)   |
| Delete job            | DELETE | `/api/v1/recruiter/jobs/:jobId`            | Yes  | Archive/remove job post                   |
| Get applicant summary | GET    | `/api/v1/recruiter/jobs/:jobId/applicants` | Yes  | List applicants per job                   |

**Job Payload (Create / Update)**

```json
{
  "title": "Communication Coach · Dubai",
  "company": "AELA Talent Collective",
  "employmentType": "full-time", // enum: full-time, part-time, contract, internship
  "location": "Dubai, UAE",
  "isRemote": false,
  "salary": {
    "currency": "INR",
    "range": "30k-50k"
  },
  "experience": "3+ years coaching experience",
  "description": "<p>HTML description...</p>",
  "cultureHighlights": ["Flexible schedule", "Community focused"],
  "tags": ["communication", "coaching", "IELTS"],
  "applyCTA": "https://recruiter.portal/apply/123"
}
```

**Job Response**

```json
{
  "id": "job_abc123",
  "ownerId": "rec_123",
  "title": "Communication Coach · Dubai",
  "company": "AELA Talent Collective",
  "employmentType": "full-time",
  "location": "Dubai, UAE",
  "isRemote": false,
  "salary": { "currency": "INR", "range": "30k-50k" },
  "experience": "3+ years coaching experience",
  "description": "<p>HTML description...</p>",
  "cultureHighlights": ["Flexible schedule", "Community focused"],
  "tags": ["communication", "coaching", "IELTS"],
  "applyCTA": "https://recruiter.portal/apply/123",
  "stats": {
    "views": 238,
    "saves": 17,
    "applications": 42
  },
  "createdAt": "2025-02-10T08:00:00.000Z",
  "updatedAt": "2025-02-18T09:30:00.000Z"
}
```

---

## 4. Applicant Pipeline

| Action                  | Method | Endpoint                                                  | Auth | Description                     |
| ----------------------- | ------ | --------------------------------------------------------- | ---- | ------------------------------- |
| Applicants per job      | GET    | `/api/v1/recruiter/jobs/:jobId/applicants`                | Yes  | List applicants + current stage |
| Update applicant status | PATCH  | `/api/v1/recruiter/jobs/:jobId/applicants/:applicationId` | Yes  | Move applicant to a new stage   |

**Applicant Response**

```json
{
  "jobId": "job_abc123",
  "jobTitle": "Communication Coach · Dubai",
  "applicants": [
    {
      "applicationId": "app_789",
      "candidateId": "student_321",
      "fullName": "Sara Malik",
      "headline": "IELTS Scholar · Dubai",
      "profileUrl": "/profiles/students/sara-malik",
      "submittedAt": "2025-02-16T09:12:00.000Z",
      "currentStage": "interview", // enum: screening, assessment, interview, offer, hired, rejected
      "notes": "Strong presentation sample",
      "resumeUrl": "https://cdn/aela/resumes/app_789.pdf"
    }
  ]
}
```

**Applicant Status Update**

```json
PATCH /api/v1/recruiter/jobs/job_abc123/applicants/app_789
{
  "currentStage": "offer",
  "notes": "Recommended for offer pending reference"
}
```

---

## 5. Recruiter Blogs

| Action            | Method | Endpoint                                  | Auth | Description                    |
| ----------------- | ------ | ----------------------------------------- | ---- | ------------------------------ |
| List drafts       | GET    | `/api/v1/recruiter/blogs?status=draft`    | Yes  | Fetch recruiter-authored blogs |
| Create blog draft | POST   | `/api/v1/recruiter/blogs`                 | Yes  | Create blog (draft by default) |
| Update blog       | PATCH  | `/api/v1/recruiter/blogs/:blogId`         | Yes  | Update content/status          |
| Publish blog      | POST   | `/api/v1/recruiter/blogs/:blogId/publish` | Yes  | Publish to public feed         |

**Blog Payload**

```json
{
  "title": "How We Hired 3 Coaches in 30 Days",
  "excerpt": "Practical playbook for fast hiring.",
  "content": "<p>HTML or markdown content...</p>",
  "coverImage": "https://cdn/aela/images/blogs/cover.jpg",
  "status": "draft" // draft, scheduled, published
}
```

**Blog Response**

```json
{
  "id": "blog_456",
  "authorId": "rec_123",
  "title": "How We Hired 3 Coaches in 30 Days",
  "excerpt": "Practical playbook for fast hiring.",
  "coverImage": "https://cdn/aela/images/blogs/cover.jpg",
  "status": "draft",
  "createdAt": "2025-02-12T10:00:00.000Z",
  "updatedAt": "2025-02-18T11:30:00.000Z"
}
```

---

## 6. Hiring Resources (E-books)

| Action       | Method | Endpoint                            | Auth     | Description                    |
| ------------ | ------ | ----------------------------------- | -------- | ------------------------------ |
| List e-books | GET    | `/api/v1/resources/ebooks`          | Optional | List hiring resources (public) |
| Fetch e-book | GET    | `/api/v1/resources/ebooks/:ebookId` | Optional | Get metadata/download link     |

**E-book Response**

```json
{
  "id": "ebook-interview",
  "title": "Interview Scorecard Templates",
  "description": "Ready-to-use scorecards for competency interviews.",
  "pages": 24,
  "downloadUrl": "https://cdn/aela/resources/interview-scorecards.pdf",
  "categories": ["hiring", "templates"],
  "publishedAt": "2025-01-10T08:00:00.000Z"
}
```

---

## 7. Common Error Format

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested job does not exist."
  }
}
```

| Code                 | Description                                | HTTP Status |
| -------------------- | ------------------------------------------ | ----------- |
| `UNAUTHORIZED`       | Missing/invalid token                      | 401         |
| `FORBIDDEN`          | Role does not have access                  | 403         |
| `RESOURCE_NOT_FOUND` | Job/blog/applicant not found               | 404         |
| `VALIDATION_ERROR`   | Request body fails validation              | 422         |
| `CONFLICT`           | Duplicate entry (e.g., job already exists) | 409         |
| `SERVER_ERROR`       | Unhandled server exception                 | 500         |

---

## 8. Notes for Implementation

- Persist timestamps in ISO 8601 (`toISOString()`).
- Use pagination (`?page=1&pageSize=20`) where lists can grow.
- Protect recruiter endpoints with role checks after token validation.
- Future enhancements: bulk applicant status updates, analytics endpoints, blog scheduling.

This spec should give both backend and frontend teams a clear contract to build against. Feel free to extend it with additional fields (ATS integration IDs, file upload support, etc.) as requirements evolve.
