# 🚨 IMMEDIATE FIX STEPS - Course Update 500 Error

## The Problem
You're getting `ERR_MODULE_NOT_FOUND` error when updating course images. The code fix is done locally but **NOT deployed to production yet**.

## ⚠️ CRITICAL: You Need to Deploy the Fix!

The error is happening on your **live production server** (api.digitalaela.com). The fix is in your local code but the server is still running old code.

---

## 🔧 Quick Fix Steps (Do This Now)

### Step 1: Push Your Code to Git
```bash
# Make sure all changes are committed
git add .
git commit -m "Fix: Convert dynamic imports to static imports in adminContentController"
git push origin main
```

### Step 2: SSH Into Your VPS Server
```bash
ssh user@your-vps-ip
# Replace with your actual VPS details
```

### Step 3: Navigate to Your Project
```bash
cd /path/to/your/project
# Replace with your actual project path
```

### Step 4: Pull Latest Code
```bash
git pull origin main
```

### Step 5: Restart Backend Service
```bash
# If using PM2:
pm2 restart digital-aela-backend
# or
pm2 restart all

# If using systemd:
sudo systemctl restart your-backend-service-name

# If running manually, stop and restart:
# Ctrl+C to stop, then:
cd backend
npm start
```

### Step 6: Verify Backend Started
```bash
# Check logs
pm2 logs digital-aela-backend --lines 20

# Or check if process is running
pm2 list
```

### Step 7: Test the Fix
1. Go to your admin panel
2. Try updating a course image
3. Check if error is gone

---

## ⚠️ IMPORTANT: Data Folder Migration

**You also need to complete the data folder migration!** The error might be related to this too.

Your backend code now expects files at `frontend/data/` but your server still has them at `data/`.

### Quick Migration Steps:

```bash
# On your VPS server:

# 1. Backup existing data (CRITICAL!)
cp -r data data_backup_$(date +%Y%m%d)

# 2. Move data folder
mv data frontend/data

# 3. Verify move was successful
ls -la frontend/data/
# Should show: photos, videos, PDFs, images, others

# 4. Restart backend again
pm2 restart digital-aela-backend
```

---

## 🔍 Troubleshooting

### If Error Still Persists After Deployment:

1. **Check backend logs for actual error:**
   ```bash
   pm2 logs digital-aela-backend --lines 100 | grep -i error
   ```

2. **Verify the fix was deployed:**
   ```bash
   # Check if static import exists
   grep -n "import { normalizeUrl }" backend/src/controllers/adminContentController.js
   # Should show line 8
   ```

3. **Check if data folder exists at new location:**
   ```bash
   ls -la frontend/data/
   ```

4. **Verify backend can access data folder:**
   ```bash
   cd backend
   node -e "const path = require('path'); console.log(path.resolve(__dirname, '../frontend/data'))"
   ```

### If Backend Won't Start:

1. **Check for syntax errors:**
   ```bash
   cd backend
   npm run build  # if you have a build script
   ```

2. **Check Node.js version:**
   ```bash
   node --version
   # Should be compatible with your code
   ```

3. **Reinstall dependencies if needed:**
   ```bash
   cd backend
   npm install
   ```

---

## 📝 Checklist

- [ ] Code changes committed and pushed to git
- [ ] Code pulled on VPS server
- [ ] Backend service restarted
- [ ] Backend logs show no errors
- [ ] Data folder migrated to `frontend/data/`
- [ ] Tested updating course image - no error
- [ ] Existing images still display correctly

---

## 🆘 Still Having Issues?

If you're still getting errors after following all steps:

1. **Share the backend error logs** (not just the browser console error)
2. **Check the exact error message** from PM2 logs
3. **Verify file paths** match expected locations
4. **Ensure all dependencies are installed**

The most common issues are:
- Code not deployed (still running old code)
- Data folder not migrated
- Backend service not restarted
- Module path resolution issues

---

**Next Steps After Fix:**
Once the error is resolved, you should also complete the full data folder migration to ensure all file operations work correctly. See `DEPLOYMENT_DATA_FOLDER_MIGRATION.md` for detailed steps.

