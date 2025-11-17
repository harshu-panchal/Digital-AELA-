# 🚀 Course Video & Progress Tracking - Implementation Roadmap

## Overview
This roadmap provides a step-by-step guide to implement the complete course video upload and progress tracking system.

---

## 📋 Implementation Phases

### **Phase 1: Backend Foundation** ⏱️ Estimated: 2-3 days

#### Step 1.1: Create Database Models
1. **Create `CourseVideo` Model**
   - File: `backend/src/models/CourseVideo.js`
   - Fields: course, title, description, videoUrl, thumbnailUrl, duration, order, isPreview, metadata
   - Add indexes for efficient queries

2. **Create `VideoProgress` Model**
   - File: `backend/src/models/VideoProgress.js`
   - Fields: student, course, video, watchedDuration, totalDuration, progressPercentage, isCompleted, etc.
   - Add unique index on (student, course, video)

**Testing Checklist:**
- [ ] Models can be imported without errors
- [ ] Indexes are created correctly
- [ ] Schema validation works

---

#### Step 1.2: Create Video Upload Middleware
1. **Create Video Upload Middleware**
   - File: `backend/src/middleware/videoUploadMiddleware.js`
   - Configure multer for video files (500MB limit)
   - Add video file type validation
   - Create `uploadVideoToCloudinary` helper function
   - Handle upload errors

**Testing Checklist:**
- [ ] Video files are accepted (MP4, MOV, AVI, WebM)
- [ ] File size validation works (rejects > 500MB)
- [ ] Invalid file types are rejected
- [ ] Cloudinary upload works correctly

---

#### Step 1.3: Create Video Controller
1. **Create Video Controller**
   - File: `backend/src/controllers/courseVideoController.js`
   - Implement all controller functions:
     - `uploadCourseVideo` - Upload video to course
     - `getCourseVideos` - Get all videos for a course (with access control)
     - `getVideo` - Get single video (with access control)
     - `updateVideo` - Update video details
     - `deleteVideo` - Delete video
     - `updateVideoProgress` - Track video watch progress
     - `getVideoProgress` - Get video progress for student
     - `getCourseProgress` - Get overall course progress

**Testing Checklist:**
- [ ] Upload video endpoint works
- [ ] Access control works (teacher/super-admin can upload)
- [ ] Students can only access enrolled courses
- [ ] Progress tracking updates correctly
- [ ] Course progress calculation is accurate

---

#### Step 1.4: Create Video Routes
1. **Create Video Routes**
   - File: `backend/src/routes/courseVideoRoutes.js`
   - Define all routes with proper middleware
   - Add authentication middleware
   - Add video upload middleware where needed

2. **Register Routes in `app.js`**
   - Import courseVideoRoutes
   - Add: `app.use("/api/v1", courseVideoRoutes);`

**Testing Checklist:**
- [ ] All routes are accessible
- [ ] Authentication is required
- [ ] File upload works via routes
- [ ] Error handling works correctly

---

### **Phase 2: Frontend Services** ⏱️ Estimated: 1 day

#### Step 2.1: Create Video Service
1. **Create Video Service**
   - File: `frontend/src/services/courseVideos.js`
   - Implement all API functions:
     - `uploadCourseVideo`
     - `getCourseVideos`
     - `getVideo`
     - `updateVideo`
     - `deleteVideo`
     - `updateVideoProgress`
     - `getVideoProgress`
     - `getCourseProgress`

**Testing Checklist:**
- [ ] All service functions work
- [ ] FormData is handled correctly for uploads
- [ ] Error handling is proper

---

#### Step 2.2: Update Base Client (if needed)
1. **Check `baseClient.js`**
   - Ensure FormData is handled properly
   - Don't set Content-Type header for FormData
   - Let browser set boundary automatically

**Testing Checklist:**
- [ ] FormData uploads work
- [ ] JSON requests still work
- [ ] Headers are set correctly

---

### **Phase 3: Teacher Interface** ⏱️ Estimated: 2-3 days

#### Step 3.1: Create Video Upload Component
1. **Create VideoUpload Component**
   - File: `frontend/modules/teacher/VideoUpload.jsx`
   - Add file input with validation
   - Add form fields (title, description, order, isPreview)
   - Add upload progress indicator
   - Handle file selection and validation
   - Show success/error messages

**Testing Checklist:**
- [ ] File selection works
- [ ] File validation works (size, type)
- [ ] Upload progress shows
- [ ] Success message appears after upload
- [ ] Form resets after successful upload

---

#### Step 3.2: Integrate into Course Pages
1. **Update Course Create Page**
   - File: `frontend/modules/teacher/CourseCreate.jsx`
   - Add VideoUpload component section
   - Show after course is created
   - Pass courseId to VideoUpload

2. **Update Course Detail Page**
   - File: `frontend/modules/teacher/CourseDetail.jsx` or `TeacherCourseDetail.jsx`
   - Add VideoUpload component
   - Show existing videos list
   - Allow editing/deleting videos

**Testing Checklist:**
- [ ] Video upload appears on course pages
- [ ] Videos can be uploaded after course creation
- [ ] Existing videos are displayed
- [ ] Video management works (edit/delete)

---

### **Phase 4: Student Interface** ⏱️ Estimated: 3-4 days

#### Step 4.1: Create Video Player Page
1. **Create CourseVideoPlayer Component**
   - File: `frontend/modules/student/CourseVideoPlayer.jsx`
   - Add video player with controls
   - Implement progress tracking (update every 5 seconds)
   - Add auto-resume functionality
   - Show progress indicator
   - Handle access control (locked videos)
   - Show completion status

**Testing Checklist:**
- [ ] Video plays correctly
- [ ] Progress updates every 5 seconds
- [ ] Auto-resume works (starts from last position)
- [ ] Progress bar shows correctly
- [ ] Locked videos show proper message
- [ ] Completion indicator appears at 90%

---

#### Step 4.2: Create Videos List Component
1. **Create CourseVideosList Component**
   - File: `frontend/modules/student/CourseVideosList.jsx`
   - Display all course videos
   - Show progress for each video
   - Show overall course progress
   - Show completion indicators
   - Show locked/unlocked status

**Testing Checklist:**
- [ ] All videos are displayed
- [ ] Progress bars show correctly
- [ ] Course progress percentage is accurate
- [ ] Completion checkmarks appear
- [ ] Locked videos are marked

---

#### Step 4.3: Add Routes
1. **Update App.jsx**
   - Add route: `/courses/videos/:videoId`
   - Import CourseVideoPlayer component
   - Add to Routes

**Testing Checklist:**
- [ ] Route is accessible
- [ ] Video player loads correctly
- [ ] Navigation works

---

#### Step 4.4: Integrate into Course Detail Page
1. **Update Student Course Detail Page**
   - File: `frontend/modules/business-management/business-pages/CourseDetail.jsx`
   - Add CourseVideosList component
   - Show videos section
   - Link to video player

**Testing Checklist:**
- [ ] Videos list appears on course page
- [ ] Clicking video navigates to player
- [ ] Progress is visible
- [ ] Access control works

---

### **Phase 5: Testing & Polish** ⏱️ Estimated: 2-3 days

#### Step 5.1: Functional Testing
1. **Video Upload Testing**
   - [ ] Upload small video (< 10MB)
   - [ ] Upload medium video (50-100MB)
   - [ ] Upload large video (200-500MB)
   - [ ] Test invalid file types
   - [ ] Test file size limit
   - [ ] Test multiple video uploads

2. **Access Control Testing**
   - [ ] Teacher can upload to own courses
   - [ ] Teacher cannot upload to others' courses
   - [ ] Super-admin can upload to any course
   - [ ] Enrolled students can access videos
   - [ ] Non-enrolled students see locked videos
   - [ ] Preview videos are accessible to all

3. **Progress Tracking Testing**
   - [ ] Progress updates during playback
   - [ ] Progress persists after page refresh
   - [ ] Auto-resume works correctly
   - [ ] Completion triggers at 90%
   - [ ] Course progress calculates correctly
   - [ ] Multiple students' progress is tracked separately

---

#### Step 5.2: UI/UX Polish
1. **Mobile Optimization**
   - [ ] Video player is responsive
   - [ ] Progress bars are visible on mobile
   - [ ] Touch controls work
   - [ ] Upload form is mobile-friendly

2. **Loading States**
   - [ ] Show loading spinner during upload
   - [ ] Show loading during video fetch
   - [ ] Show loading during progress fetch

3. **Error Handling**
   - [ ] Show error messages for failed uploads
   - [ ] Show error for access denied
   - [ ] Show error for network issues
   - [ ] Handle edge cases gracefully

---

#### Step 5.3: Performance Optimization
1. **Optimize API Calls**
   - [ ] Debounce progress updates
   - [ ] Cache video lists
   - [ ] Optimize database queries

2. **Optimize Video Loading**
   - [ ] Lazy load video thumbnails
   - [ ] Use video poster images
   - [ ] Consider video streaming

---

## 🎯 Quick Start Guide

### For Backend Developers:
1. Start with Phase 1 (Backend Foundation)
2. Test each step before moving to next
3. Use Postman/Thunder Client to test APIs
4. Check Cloudinary configuration

### For Frontend Developers:
1. Wait for Phase 1 completion (or mock APIs)
2. Start with Phase 2 (Services)
3. Then Phase 3 (Teacher Interface)
4. Finally Phase 4 (Student Interface)

### For Full-Stack Developers:
1. Follow phases sequentially
2. Complete backend first, then frontend
3. Test integration at each phase
4. Polish in Phase 5

---

## 📝 Implementation Checklist

### Backend ✅
- [ ] CourseVideo model created
- [ ] VideoProgress model created
- [ ] Video upload middleware created
- [ ] Video controller with all functions
- [ ] Video routes defined
- [ ] Routes registered in app.js
- [ ] All endpoints tested

### Frontend Services ✅
- [ ] courseVideos.js service created
- [ ] All API functions implemented
- [ ] FormData handling verified
- [ ] Error handling added

### Teacher Interface ✅
- [ ] VideoUpload component created
- [ ] Integrated into CourseCreate page
- [ ] Integrated into CourseDetail page
- [ ] Video management UI added

### Student Interface ✅
- [ ] CourseVideoPlayer component created
- [ ] CourseVideosList component created
- [ ] Routes added to App.jsx
- [ ] Integrated into CourseDetail page
- [ ] Progress tracking working
- [ ] Auto-resume working

### Testing ✅
- [ ] Video upload tested
- [ ] Access control tested
- [ ] Progress tracking tested
- [ ] Mobile responsive tested
- [ ] Error handling tested

---

## 🐛 Common Issues & Solutions

### Issue 1: Video Upload Fails
**Solution:** 
- Check Cloudinary configuration
- Verify file size limits
- Check CORS settings
- Verify authentication token

### Issue 2: Progress Not Updating
**Solution:**
- Check API endpoint is called
- Verify progress update logic
- Check database connection
- Verify student enrollment

### Issue 3: Auto-Resume Not Working
**Solution:**
- Check video metadata loads
- Verify progress is fetched
- Check videoRef is set
- Verify currentTime is set correctly

### Issue 4: Access Control Issues
**Solution:**
- Verify authentication middleware
- Check enrollment status
- Verify course ownership
- Check role permissions

---

## 📊 Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Backend | 2-3 days | None |
| Phase 2: Services | 1 day | Phase 1 |
| Phase 3: Teacher UI | 2-3 days | Phase 2 |
| Phase 4: Student UI | 3-4 days | Phase 2 |
| Phase 5: Testing | 2-3 days | Phase 3, 4 |
| **Total** | **10-14 days** | |

---

## 🎓 Next Steps After Implementation

1. **Analytics Dashboard** - Track video views, completion rates
2. **Video Recommendations** - Suggest next video based on progress
3. **Achievement System** - Badges for completing videos/courses
4. **Video Comments** - Allow students to comment
5. **Video Bookmarks** - Bookmark specific timestamps
6. **Download Option** - Allow video downloads (if permitted)
7. **Video Subtitles** - Add subtitle support

---

## 📞 Support

If you encounter issues during implementation:
1. Check the implementation plan document
2. Review error messages carefully
3. Test each component independently
4. Verify database connections
5. Check Cloudinary configuration

---

**Good luck with your implementation! 🚀**

