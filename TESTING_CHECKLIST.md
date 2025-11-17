# ✅ Course Video System - Testing Checklist

## 📝 Pre-Testing Setup

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] MongoDB connected
- [ ] Cloudinary configured (check `.env` file)
- [ ] Test accounts ready:
  - [ ] Teacher account
  - [ ] Student account (enrolled in test course)
  - [ ] Student account (NOT enrolled in test course)

---

## 🧪 Backend API Tests

### Test 1: Health Check
- [ ] `GET /health` returns 200 OK
- [ ] Response contains `status: "ok"`

### Test 2: Video Upload (Teacher)
- [ ] `POST /api/v1/courses/:courseId/videos` with valid video
- [ ] Returns 201 Created
- [ ] Response contains video object
- [ ] Video URL is valid Cloudinary URL
- [ ] Video saved in database

**Test Cases:**
- [ ] Valid MP4 file (< 500MB) ✅
- [ ] Invalid file type (should fail) ❌
- [ ] File > 500MB (should fail) ❌
- [ ] Without auth token (should fail) ❌
- [ ] As student (should fail) ❌

### Test 3: Get Course Videos
- [ ] `GET /api/v1/courses/:courseId/videos` as teacher
- [ ] Returns all videos
- [ ] `hasAccess: true` for teacher

**Test Cases:**
- [ ] As course owner (teacher) ✅
- [ ] As enrolled student ✅
- [ ] As non-enrolled student (only previews) ✅
- [ ] Without auth (should fail) ❌

### Test 4: Get Single Video
- [ ] `GET /api/v1/videos/:videoId` as enrolled student
- [ ] Returns video with `hasAccess: true`

**Test Cases:**
- [ ] Enrolled student accessing regular video ✅
- [ ] Non-enrolled student accessing regular video (should fail) ❌
- [ ] Non-enrolled student accessing preview video ✅

### Test 5: Update Video Progress
- [ ] `POST /api/v1/videos/:videoId/progress` with `watchedDuration: 30`
- [ ] Returns updated progress
- [ ] Progress percentage calculated correctly
- [ ] Completion triggers at 90%

**Test Cases:**
- [ ] Update to 30 seconds ✅
- [ ] Update to 50% ✅
- [ ] Update to 90% (completion) ✅
- [ ] Update as non-enrolled (should fail) ❌

### Test 6: Get Video Progress
- [ ] `GET /api/v1/videos/:videoId/progress`
- [ ] Returns progress data
- [ ] Unwatched video returns 0%

### Test 7: Get Course Progress
- [ ] `GET /api/v1/courses/:courseId/progress`
- [ ] Returns course progress summary
- [ ] Lists all videos with individual progress
- [ ] Course percentage calculated correctly

### Test 8: Update Video Details
- [ ] `PATCH /api/v1/videos/:videoId` with new title
- [ ] Video updated in database
- [ ] Only teacher/super-admin can update

### Test 9: Delete Video
- [ ] `DELETE /api/v1/videos/:videoId` as course owner
- [ ] Video deleted from database
- [ ] Progress records cleaned up
- [ ] Unauthorized users cannot delete

---

## 🎨 Frontend UI Tests

### Test 10: Teacher Video Upload Page
**Location:** `/teacher/courses/:courseId`

- [ ] "Course Videos" section visible
- [ ] Upload form displays correctly
- [ ] File input accepts video files
- [ ] Form validation works:
  - [ ] Title required
  - [ ] File required
  - [ ] File size validation
  - [ ] File type validation
- [ ] Upload progress bar shows
- [ ] Success message appears
- [ ] Video appears in list after upload
- [ ] Form resets after upload

### Test 11: Video Management (Edit/Delete)
- [ ] Edit button opens edit form
- [ ] Form pre-filled with current data
- [ ] Save button updates video
- [ ] Cancel button closes form
- [ ] Delete button shows confirmation
- [ ] Delete removes video from list

### Test 12: Student Videos List
**Location:** Course detail page

- [ ] Videos section appears (if course has `_id`)
- [ ] Videos list displays correctly
- [ ] Course progress bar shows
- [ ] Individual video progress bars show
- [ ] Completion checkmarks appear
- [ ] Preview badges show for preview videos
- [ ] Locked videos marked (if not enrolled)

### Test 13: Video Player Page
**Location:** `/courses/videos/:videoId`

- [ ] Video player loads
- [ ] Video plays correctly
- [ ] Controls work (play, pause, volume, fullscreen)
- [ ] Progress bar at bottom shows
- [ ] Video info displays (title, description)
- [ ] Progress percentage shows
- [ ] Completion indicator appears at 90%

### Test 14: Progress Tracking
- [ ] Progress updates every 5 seconds
- [ ] Progress bar updates in real-time
- [ ] Progress persists after refresh
- [ ] Auto-resume works (starts from last position)
- [ ] Completion triggers at 90%

### Test 15: Access Control UI
**As Non-Enrolled Student:**
- [ ] Lock screen appears for locked videos
- [ ] "Enroll Now" button works
- [ ] Preview videos accessible

**As Enrolled Student:**
- [ ] All videos accessible
- [ ] No lock screens
- [ ] Progress tracking works

### Test 16: Mobile Responsiveness
- [ ] Video upload form responsive
- [ ] Videos list responsive
- [ ] Video player responsive
- [ ] Progress bars visible
- [ ] Touch controls work

---

## 🔍 Integration Tests

### Test 17: Complete Flow (Teacher)
1. [ ] Teacher creates course
2. [ ] Teacher uploads video
3. [ ] Teacher edits video
4. [ ] Teacher views video list
5. [ ] Teacher deletes video

### Test 18: Complete Flow (Student)
1. [ ] Student enrolls in course
2. [ ] Student views videos list
3. [ ] Student clicks video
4. [ ] Video player opens
5. [ ] Student watches video
6. [ ] Progress updates
7. [ ] Student refreshes page
8. [ ] Video resumes from last position
9. [ ] Student completes video (90%+)
10. [ ] Completion indicator appears

### Test 19: Access Control Flow
1. [ ] Non-enrolled student views course
2. [ ] Sees locked videos
3. [ ] Clicks locked video
4. [ ] Lock screen appears
5. [ ] Student enrolls
6. [ ] Videos become accessible
7. [ ] Student can watch videos

---

## 🐛 Error Handling Tests

### Test 20: Error Scenarios
- [ ] Network error during upload (shows error message)
- [ ] Invalid file type (shows validation error)
- [ ] File too large (shows size error)
- [ ] Unauthorized access (shows access denied)
- [ ] Video not found (shows 404 error)
- [ ] Server error (shows generic error)

---

## 📊 Performance Tests

### Test 21: Performance
- [ ] Large video upload (< 500MB) completes
- [ ] Video list loads quickly (< 2 seconds)
- [ ] Video player loads quickly (< 3 seconds)
- [ ] Progress updates don't lag
- [ ] Multiple videos in list render smoothly

---

## ✅ Final Verification

- [ ] All backend endpoints work
- [ ] All frontend components work
- [ ] Access control enforced
- [ ] Progress tracking accurate
- [ ] Auto-resume works
- [ ] Mobile responsive
- [ ] Error handling works
- [ ] No console errors
- [ ] No linter errors

---

## 📝 Test Results

**Date:** _______________

**Tester:** _______________

**Backend Tests:** ___ / 9 passed
**Frontend Tests:** ___ / 7 passed
**Integration Tests:** ___ / 3 passed
**Error Handling:** ___ / 6 passed
**Performance:** ___ / 5 passed

**Total:** ___ / 30 tests passed

**Issues Found:**
1. _________________________________
2. _________________________________
3. _________________________________

**Notes:**
_________________________________
_________________________________

---

**Ready to test!** Start with the Pre-Testing Setup checklist. 🚀

