# Complete Fix for Malformed Image URLs

## Problem
Images uploaded before moving the data folder have malformed URLs:
- **Stored in database**: `https:///static/photos/courses/image.jpg` (triple slashes)
- **Displayed as**: `https://api.digitalaela.com/static/https:///static/photos/courses/image.jpg` (double URL)

## Root Cause
URLs were stored with `https:///static/...` pattern (triple slashes), which creates double URLs when processed.

## Complete Solution

### Step 1: Fix URLs in Database (RUN THIS FIRST!)

On your VPS server, run the fix script:

```bash
cd /path/to/your/project/backend
node scripts/fixMalformedImageUrls.js
```

This will:
- Find all courses with malformed URLs
- Convert `https:///static/...` → `/static/...`
- Convert `https://static/...` → `/static/...`
- Update the database

### Step 2: Deploy Code Fixes

The code has been updated to:
1. ✅ Handle triple-slash URLs in normalizer
2. ✅ Detect and fix double URLs in frontend
3. ✅ Prevent future malformed URLs

Push and deploy:

```bash
# On your local machine
git add .
git commit -m "Fix: Handle triple-slash and double URLs"
git push origin main

# On your VPS
cd /path/to/your/project
git pull origin main
pm2 restart digital-aela-backend
```

### Step 3: Clear Browser Cache

After fixing, clear cache:
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

## What Was Fixed

### 1. Backend URL Normalizer (`backend/src/utils/urlNormalizer.js`)
- ✅ Now handles `https:///static/...` (triple slashes)
- ✅ Fixes to `/static/...` format

### 2. Backend Fix Script (`backend/scripts/fixMalformedImageUrls.js`)
- ✅ Detects triple-slash URLs
- ✅ Updates database automatically

### 3. Frontend Media URL (`frontend/src/utils/mediaUrl.js`)
- ✅ Detects double URLs (already prepended)
- ✅ Handles triple-slash patterns
- ✅ Fixes automatically on display

## Verification

After running the script and deploying:

1. **Check database URLs:**
   ```javascript
   // In MongoDB or your admin panel
   // URLs should be: /static/photos/courses/image.jpg
   ```

2. **Test image display:**
   - Go to a course with the old image
   - Check browser console for any URL warnings
   - Verify image loads correctly

3. **Check backend logs:**
   ```bash
   pm2 logs digital-aela-backend | grep -i url
   ```

## Expected Results

- ✅ Database URLs: `/static/photos/courses/image.jpg`
- ✅ Displayed URLs: `https://api.digitalaela.com/static/photos/courses/image.jpg`
- ✅ Images load correctly
- ✅ No console errors

## Important Notes

1. **Backup database** before running the script (though it only updates URL fields)
2. **Run script on VPS** - it needs database access
3. **Deploy code changes** - both backend and frontend fixes
4. **Clear cache** - browser may cache old URLs

## If Issues Persist

1. Check if script ran successfully
2. Verify database was updated (check one course manually)
3. Check browser console for URL warnings
4. Verify backend is serving files from `frontend/data/`

---

**All fixes are in place. Just run the script and deploy!**

