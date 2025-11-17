# 🧪 Course Video System - Testing Guide

## Overview

This guide will help you systematically test the complete course video upload and progress tracking system.

---

## 📋 Pre-Testing Checklist

### Backend Setup

- [ ] Backend server is running
- [ ] MongoDB is connected
- [ ] Cloudinary is configured with video upload support
- [ ] Environment variables are set:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `MONGODB_URI`

### Frontend Setup

- [ ] Frontend server is running
- [ ] Backend API URL is configured (`VITE_API_URL`)
- [ ] User authentication is working

### Test Accounts

- [ ] Teacher account created
- [ ] Student account created
- [ ] Super-admin account created

---

## 🧪 Testing Phases

### Phase 1: Backend API Testing

#### Test 1.1: Video Upload Endpoint

**Endpoint:** `POST /api/v1/courses/:courseId/videos`

**Prerequisites:**

- Create a course first (or use existing course ID)
- Login as teacher or super-admin

**Test Steps:**

1. Get authentication token
2. Create a test course (if needed)
3. Upload a test video file (MP4, < 500MB)
4. Verify response

**Expected Results:**

- ✅ Status: 201 Created
- ✅ Response contains video object
- ✅ Video URL is returned
- ✅ Video record created in database

**Test with:**

- Valid video file (MP4)
- Large file (> 100MB)
- Invalid file type (should fail)
- File > 500MB (should fail)
- Without authentication (should fail)
- As student (should fail)

---

#### Test 1.2: Get Course Videos

**Endpoint:** `GET /api/v1/courses/:courseId/videos`

**Test Steps:**

1. Login as teacher (course owner)
2. Get videos for your course
3. Login as enrolled student
4. Get videos for enrolled course
5. Login as non-enrolled student
6. Get videos for non-enrolled course

**Expected Results:**

- ✅ Teacher sees all videos
- ✅ Enrolled student sees all videos
- ✅ Non-enrolled student sees only preview videos
- ✅ Locked videos marked with `isLocked: true`

---

#### Test 1.3: Get Single Video

**Endpoint:** `GET /api/v1/videos/:videoId`

**Test Steps:**

1. Get video as enrolled student (should work)
2. Get video as non-enrolled student (should fail for non-preview)
3. Get preview video as non-enrolled (should work)

**Expected Results:**

- ✅ Enrolled students can access
- ✅ Non-enrolled students blocked (except preview)
- ✅ Preview videos accessible to all

---

#### Test 1.4: Update Video Progress

**Endpoint:** `POST /api/v1/videos/:videoId/progress`

**Test Steps:**

1. Watch video for 30 seconds
2. Update progress with `watchedDuration: 30`
3. Check progress percentage
4. Watch 90% of video
5. Verify completion status

**Expected Results:**

- ✅ Progress updates correctly
- ✅ Percentage calculated accurately
- ✅ Completion triggers at 90%
- ✅ `isCompleted` flag set to true

---

#### Test 1.5: Get Video Progress

**Endpoint:** `GET /api/v1/videos/:videoId/progress`

**Test Steps:**

1. Get progress for video you've watched
2. Get progress for unwatched video (should return 0%)

**Expected Results:**

- ✅ Returns correct progress data
- ✅ Unwatched videos return 0%

---

#### Test 1.6: Get Course Progress

**Endpoint:** `GET /api/v1/courses/:courseId/progress`

**Test Steps:**

1. Enroll in course with multiple videos
2. Watch some videos completely
3. Get course progress
4. Verify calculations

**Expected Results:**

- ✅ Course progress percentage correct
- ✅ Completed videos count accurate
- ✅ All videos listed with progress

---

#### Test 1.7: Update Video Details

**Endpoint:** `PATCH /api/v1/videos/:videoId`

**Test Steps:**

1. Update video title
2. Update description
3. Change order
4. Toggle preview status

**Expected Results:**

- ✅ Updates saved correctly
- ✅ Only teacher/super-admin can update
- ✅ Students cannot update

---

#### Test 1.8: Delete Video

**Endpoint:** `DELETE /api/v1/videos/:videoId`

**Test Steps:**

1. Delete video as course owner
2. Try to delete as different teacher (should fail)
3. Verify video deleted from database
4. Verify progress records deleted

**Expected Results:**

- ✅ Video deleted successfully
- ✅ Progress records cleaned up
- ✅ Unauthorized users cannot delete

---

### Phase 2: Frontend Testing

#### Test 2.1: Teacher Video Upload

**Location:** `/teacher/courses/:courseId`

**Test Steps:**

1. Login as teacher
2. Navigate to course detail page
3. Scroll to "Course Videos" section
4. Select video file
5. Enter video title
6. Upload video
7. Verify upload progress
8. Check success message

**Expected Results:**

- ✅ File selection works
- ✅ Validation works (size, type)
- ✅ Upload progress shows
- ✅ Success message appears
- ✅ Video appears in list
- ✅ Form resets after upload

---

#### Test 2.2: Video Management (Edit/Delete)

**Location:** `/teacher/courses/:courseId`

**Test Steps:**

1. Click edit on a video
2. Update title/description
3. Save changes
4. Delete a video
5. Confirm deletion

**Expected Results:**

- ✅ Edit form appears
- ✅ Changes save correctly
- ✅ Delete confirmation works
- ✅ Video removed from list

---

#### Test 2.3: Student Videos List

**Location:** Course detail page (`/courses/:slug`)

**Test Steps:**

1. Login as enrolled student
2. Navigate to enrolled course
3. Scroll to videos section
4. Verify videos list appears
5. Check progress indicators
6. Check course progress bar

**Expected Results:**

- ✅ Videos list displays
- ✅ Progress bars show correctly
- ✅ Completion checkmarks appear
- ✅ Course progress percentage accurate
- ✅ Locked videos marked (if not enrolled)

---

#### Test 2.4: Video Player Page

**Location:** `/courses/videos/:videoId`

**Test Steps:**

1. Click on a video from list
2. Verify video loads
3. Play video
4. Check progress updates
5. Refresh page
6. Verify auto-resume works
7. Watch 90% of video
8. Check completion indicator

**Expected Results:**

- ✅ Video player loads
- ✅ Video plays correctly
- ✅ Progress updates every 5 seconds
- ✅ Auto-resume works
- ✅ Completion triggers at 90%
- ✅ Progress bar shows correctly

---

#### Test 2.5: Access Control Testing

**Test as Non-Enrolled Student:**

1. Login as student
2. Navigate to course you're not enrolled in
3. Try to access locked video
4. Verify lock screen appears
5. Click "Enroll Now" button

**Expected Results:**

- ✅ Locked videos show lock screen
- ✅ Preview videos accessible
- ✅ Enroll button works

**Test as Enrolled Student:**

1. Enroll in course
2. Access videos
3. Verify all videos accessible
4. Check progress tracking works

**Expected Results:**

- ✅ All videos accessible
- ✅ Progress tracking works
- ✅ No lock screens

---

#### Test 2.6: Mobile Responsiveness

**Test on Mobile:**

1. Open on mobile device/browser dev tools
2. Test video upload (teacher)
3. Test video player
4. Test videos list
5. Test progress bars

**Expected Results:**

- ✅ All components responsive
- ✅ Video player works on mobile
- ✅ Touch controls work
- ✅ Progress bars visible

---

## 🐛 Common Issues & Solutions

### Issue 1: Video Upload Fails

**Symptoms:** Error during upload
**Check:**

- Cloudinary configuration
- File size limits
- Network connection
- CORS settings

**Solution:**

```bash
# Check Cloudinary config
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
```

---

### Issue 2: Progress Not Updating

**Symptoms:** Progress stays at 0%
**Check:**

- API endpoint is called
- Student is enrolled
- Video duration is set
- Network requests in browser console

**Solution:**

- Check browser console for errors
- Verify enrollment status
- Check API response

---

### Issue 3: Auto-Resume Not Working

**Symptoms:** Video starts from beginning
**Check:**

- Progress is fetched on load
- Video metadata loads
- `currentTime` is set correctly

**Solution:**

- Check `handleVideoLoaded` function
- Verify progress data in response
- Check video element reference

---

### Issue 4: Access Control Issues

**Symptoms:** Wrong access permissions
**Check:**

- Authentication token
- Enrollment status
- User role
- Course ownership

**Solution:**

- Verify token in request headers
- Check enrollment in database
- Verify role permissions

---

## 📊 Test Results Template

```
## Test Results - [Date]

### Backend Tests
- [ ] Video Upload: ✅/❌
- [ ] Get Videos: ✅/❌
- [ ] Get Video: ✅/❌
- [ ] Update Progress: ✅/❌
- [ ] Get Progress: ✅/❌
- [ ] Course Progress: ✅/❌
- [ ] Update Video: ✅/❌
- [ ] Delete Video: ✅/❌

### Frontend Tests
- [ ] Teacher Upload: ✅/❌
- [ ] Video Management: ✅/❌
- [ ] Videos List: ✅/❌
- [ ] Video Player: ✅/❌
- [ ] Access Control: ✅/❌
- [ ] Mobile Responsive: ✅/❌

### Issues Found:
1. [Issue description]
2. [Issue description]

### Notes:
[Any additional notes]
```

---

## 🚀 Quick Test Commands

### Test Backend Health

```bash
curl http://localhost:5000/health
```

### Test Video Upload (with token)

```bash
curl -X POST http://localhost:5000/api/v1/courses/[COURSE_ID]/videos \
  -H "Authorization: Bearer [TOKEN]" \
  -F "video=@test-video.mp4" \
  -F "title=Test Video" \
  -F "description=Test Description"
```

### Test Get Videos

```bash
curl -X GET http://localhost:5000/api/v1/courses/[COURSE_ID]/videos \
  -H "Authorization: Bearer [TOKEN]"
```

---

## ✅ Success Criteria

The system is working correctly if:

- ✅ Teachers can upload videos
- ✅ Videos are stored in Cloudinary
- ✅ Students can access enrolled course videos
- ✅ Progress tracking works accurately
- ✅ Auto-resume functions correctly
- ✅ Access control prevents unauthorized access
- ✅ Mobile experience is smooth
- ✅ All error cases handled gracefully

---

**Ready to start testing!** 🚀
