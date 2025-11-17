# 🚀 Quick Testing Steps

## Step 1: Start Backend Server

```bash
cd backend
npm run dev
```

**Expected Output:**
```
[Server] Listening on port 5000
[Socket.IO] Server initialized
```

---

## Step 2: Start Frontend Server

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## Step 3: Verify Backend Health

Open browser or use curl:
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

---

## Step 4: Test Authentication

1. Open frontend: `http://localhost:5173`
2. Login as **Teacher** account
3. Verify you can access teacher dashboard

---

## Step 5: Test Video Upload (Teacher)

1. Navigate to: `/teacher/courses` or create a new course
2. Open an existing course: `/teacher/courses/:courseId`
3. Scroll to **"Course Videos"** section
4. Click "Choose Video File"
5. Select a test video (MP4, < 500MB)
6. Fill in:
   - Title: "Test Video 1"
   - Description: "This is a test video"
   - Order: 1
   - Preview: (optional checkbox)
7. Click "Upload Video"
8. **Expected:** Progress bar shows, then success message

---

## Step 6: Verify Video in List

After upload:
- ✅ Video should appear in "Uploaded Videos" list
- ✅ Shows title, description, duration
- ✅ Edit and Delete buttons visible

---

## Step 7: Test Video Edit

1. Click **Edit** button on a video
2. Change title to "Updated Test Video"
3. Click **Save**
4. **Expected:** Title updates, form closes

---

## Step 8: Test as Student

1. Login as **Student** account
2. Enroll in the course (if not already enrolled)
3. Navigate to course detail page
4. Scroll to **"Course Videos"** section
5. **Expected:**
   - Videos list appears
   - Course progress bar shows
   - Videos are clickable

---

## Step 9: Test Video Player

1. Click on a video from the list
2. **Expected:**
   - Video player page loads
   - Video starts playing
   - Progress bar at bottom shows
3. Watch video for 10-15 seconds
4. Refresh the page
5. **Expected:** Video resumes from last position

---

## Step 10: Test Progress Tracking

1. Watch a video to 50% completion
2. Check browser console (F12) → Network tab
3. Look for: `POST /api/v1/videos/:videoId/progress`
4. **Expected:** Progress updates every 5 seconds
5. Watch video to 90%+
6. **Expected:** Completion indicator appears

---

## Step 11: Test Access Control

### Test as Non-Enrolled Student:
1. Login as student
2. Navigate to course you're NOT enrolled in
3. Try to access a non-preview video
4. **Expected:** Lock screen with "Enroll Now" button

### Test Preview Videos:
1. As teacher, mark a video as "Preview"
2. As non-enrolled student, access that video
3. **Expected:** Video plays (preview accessible)

---

## Step 12: Test Mobile View

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone/Android)
4. Test:
   - Video upload
   - Video player
   - Videos list
5. **Expected:** All components responsive

---

## 🐛 Troubleshooting

### Backend Not Starting?
- Check MongoDB connection
- Verify `.env` file exists
- Check port 5000 is not in use

### Video Upload Fails?
- Check Cloudinary credentials in `.env`
- Verify file size < 500MB
- Check file type is MP4

### Progress Not Updating?
- Check browser console for errors
- Verify student is enrolled
- Check API calls in Network tab

### Videos Not Showing?
- Check course has `_id` (backend course)
- Verify authentication token
- Check API response in Network tab

---

## ✅ Success Indicators

You're ready when:
- ✅ Teacher can upload videos
- ✅ Videos appear in list
- ✅ Student can see videos (if enrolled)
- ✅ Video player works
- ✅ Progress tracking works
- ✅ Auto-resume works
- ✅ Access control works

---

**Start with Step 1 and work through each step!** 🎯

