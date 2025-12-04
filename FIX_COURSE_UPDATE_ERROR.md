# Fix for Course Update 500 Error

## Problem
When updating a course image as admin, you're getting:
```
PUT https://api.digitalaela.com/api/v1/admin/courses/... 500 (Internal Server Error)
ERR_MODULE_NOT_FOUND
```

## Root Cause
The error is caused by a **dynamic import failure** in the `adminContentController.js` file. The controller was using `await import()` which can fail in production environments.

## Solution Applied
✅ **Fixed:** Converted dynamic imports to static imports at the top of the file.

### Changes Made:
1. Added static import: `import { normalizeUrl } from "../utils/urlNormalizer.js";`
2. Removed dynamic imports: `await import("../../utils/urlNormalizer.js");`

## Deployment Steps

### 1. **Code is Already Fixed** ✅
The fix has been applied to your codebase. You just need to deploy it.

### 2. **Deploy Frontend (Vercel)** ✅
- Auto-deploys when you push to main branch
- No action needed

### 3. **Deploy Backend (VPS)** ⚠️ **REQUIRED**

**IMPORTANT:** You also need to complete the data folder migration! The error might be related to that too.

#### Option A: Quick Fix (Just deploy the code fix)
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to project
cd /path/to/your/project

# Pull latest code
git pull origin main

# Restart backend
pm2 restart digital-aela-backend
# or
sudo systemctl restart your-backend-service
```

#### Option B: Complete Fix (Deploy code + Complete data folder migration)
**Follow the steps in `DEPLOYMENT_DATA_FOLDER_MIGRATION.md`**

The data folder migration is still required because:
- Backend code expects `frontend/data/`
- Your server still has `data/` at root
- File operations will fail until migration is complete

## Verification

After deploying, test:
1. ✅ Update a course image in admin panel
2. ✅ Verify no 500 errors
3. ✅ Check that image saves correctly
4. ✅ Verify existing images still display

## If Error Persists

1. **Check backend logs:**
   ```bash
   pm2 logs digital-aela-backend --lines 50
   ```

2. **Verify urlNormalizer file exists:**
   ```bash
   ls -la backend/src/utils/urlNormalizer.js
   ```

3. **Check for path issues:**
   ```bash
   cd backend
   node -e "console.log(require.resolve('./src/utils/urlNormalizer.js'))"
   ```

4. **Complete the data folder migration** - This is likely the real issue!

---

**Next Steps:**
1. Push and deploy the code fix (already done in codebase)
2. Complete data folder migration on VPS (see `DEPLOYMENT_DATA_FOLDER_MIGRATION.md`)

