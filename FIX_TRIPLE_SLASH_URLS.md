# Fix Triple Slash URLs (https:///static/...)

## Problem
Some images have malformed URLs stored in the database with triple slashes:
- Bad: `https:///static/photos/courses/image.jpg`
- Should be: `/static/photos/courses/image.jpg`

When displayed, these become double URLs:
- `https://api.digitalaela.com/static/https:///static/photos/courses/image.jpg`

## Solution

### Step 1: Run the Fix Script on Your VPS

```bash
# SSH into your VPS
cd /path/to/your/project

# Run the fix script
cd backend
node scripts/fixMalformedImageUrls.js
```

This script will:
1. Find all courses with malformed URLs
2. Fix them to proper format (`/static/...`)
3. Update the database

### Step 2: Verify the Fix

After running the script, check if URLs are fixed:

```bash
# In MongoDB or check your course data
# URLs should now be: /static/photos/courses/...
```

### Step 3: Clear Cache

If images are cached, you may need to:
1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Restart backend if needed

## What Was Fixed

1. ✅ Updated `urlNormalizer.js` to handle `https:///static/` pattern
2. ✅ Updated fix script to catch triple-slash URLs
3. ✅ Frontend `mediaUrl.js` already handles this case

## Code Changes

- `backend/src/utils/urlNormalizer.js` - Now handles triple slash patterns
- `backend/scripts/fixMalformedImageUrls.js` - Updated to detect and fix triple slash URLs

## After Running the Script

1. All malformed URLs in the database will be fixed
2. New uploads will use correct format automatically
3. Existing images will display correctly

---

**Note:** Make sure to backup your database before running the script, though it only updates URL fields and doesn't modify other data.

