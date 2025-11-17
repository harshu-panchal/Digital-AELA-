# 📍 Where to Upload Course Videos

## 🎯 Location: Teacher Course Detail Page

The video upload button is located in the **Course Detail Page** for teachers.

---

## 📋 Step-by-Step Navigation

### Step 1: Login as Teacher

1. Go to your frontend URL (usually `http://localhost:5173`)
2. Login with your **teacher account**

### Step 2: Go to Teacher Dashboard

1. After login, you should see the **Teacher Dashboard**
2. URL: `/teacher/dashboard`

### Step 3: Access Your Course

You have **two ways** to access your course:

#### Option A: From Dashboard

1. On the Teacher Dashboard, look for the **"Recent activity"** section
2. Find your course in the list
3. Click on the course title or the **"View"** button
4. This will take you to: `/teacher/courses/:courseId`

#### Option B: Direct URL

1. If you know your course ID, navigate directly to:
   ```
   http://localhost:5173/teacher/courses/[YOUR_COURSE_ID]
   ```
   Replace `[YOUR_COURSE_ID]` with your actual course ID

### Step 4: Find the Video Upload Section

1. Once on the Course Detail page, **scroll down**
2. Look for a section titled: **"Course Videos"**
3. This section is located **after** the "Curriculum & engagement" section
4. You'll see:
   - Header: "Course Videos"
   - Description: "Upload and manage course videos. Students can access videos after enrollment."

---

## 🎥 Video Upload Form

In the **"Course Videos"** section, you'll find:

### Upload Form Fields:

1. **"Choose Video File"** button - Click to select your video file
2. **Title** input field - Enter video title (required)
3. **Description** textarea - Enter video description (optional)
4. **Order** number input - Set display order (defaults to next number)
5. **Preview** checkbox - Mark video as preview (accessible without enrollment)
6. **"Upload Video"** button - Click to start upload

### Visual Layout:

```
┌─────────────────────────────────────┐
│  Course Videos                      │
│  Upload and manage course videos... │
├─────────────────────────────────────┤
│                                     │
│  [Choose Video File] button         │
│  Title: [___________]               │
│  Description: [___________]         │
│  Order: [__]  ☐ Preview            │
│  [Upload Video] button              │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Uploaded Videos                    │
│  [List of uploaded videos]          │
└─────────────────────────────────────┘
```

---

## 🔍 Quick Visual Guide

### Page Structure:

```
Teacher Dashboard
    ↓
Course Detail Page (/teacher/courses/:courseId)
    ├── Course Information
    ├── Course Settings
    ├── Curriculum & engagement
    ├── **Course Videos** ← YOU ARE HERE!
    │   ├── Video Upload Form
    │   └── Uploaded Videos List
    ├── Activity & approvals
    └── Student enrolments
```

---

## ✅ What You Need Before Uploading

1. **A Course Created**

   - You must have at least one course created
   - The course must have a valid `_id` (backend course)

2. **Video File Ready**

   - Format: MP4, MOV, AVI, or WebM
   - Size: Less than 500MB
   - Location: On your computer

3. **Teacher Account**
   - You must be logged in as a teacher or super-admin
   - You must be the owner of the course

---

## 🚨 Troubleshooting

### "I don't see the Course Videos section"

**Possible reasons:**

- The course doesn't have a backend `_id` (it's only a frontend course)
- You're not logged in as a teacher
- You're not the owner of the course
- The page hasn't fully loaded (try refreshing)

**Solution:**

- Make sure the course is created in the backend
- Check that you're logged in as the course owner
- Try refreshing the page

### "I can't find my course"

**Solution:**

- Go to Teacher Dashboard
- Look in "Recent activity" section
- Or create a new course first at `/teacher/courses/new`

### "Upload button doesn't work"

**Check:**

- Backend server is running
- Cloudinary is configured
- You have a valid video file selected
- File size is under 500MB

---

## 📸 Screenshot Locations

The video upload section should look like this:

```
┌─────────────────────────────────────────────────────────┐
│ Course Videos                                           │
│ Upload and manage course videos. Students can access    │
│ videos after enrollment.                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  Choose Video File                           │      │
│  │  [📁 Select File Button]                     │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  Title*                                                │
│  ┌──────────────────────────────────────────────┐      │
│  │ [Enter video title]                          │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  Description                                            │
│  ┌──────────────────────────────────────────────┐      │
│  │ [Enter description]                          │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  Order: [1]  ☐ Preview video                           │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │         Upload Video                          │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Access URLs

- **Teacher Dashboard:** `/teacher/dashboard`
- **Create New Course:** `/teacher/courses/new`
- **Course Detail (with videos):** `/teacher/courses/:courseId`

---

## 💡 Pro Tips

1. **Scroll Down:** The video upload section is below other sections, so scroll down if you don't see it immediately

2. **Check Course ID:** Make sure you're on the correct course detail page. The URL should be `/teacher/courses/[courseId]`

3. **Multiple Videos:** You can upload multiple videos to the same course. Each video will appear in the "Uploaded Videos" list below the form.

4. **Edit Videos:** After uploading, you can click the **Edit** button (pencil icon) to modify video details.

5. **Delete Videos:** Use the **Delete** button (trash icon) to remove videos you no longer need.

---

**Need help?** Check the browser console (F12) for any errors, or verify your backend server is running!
