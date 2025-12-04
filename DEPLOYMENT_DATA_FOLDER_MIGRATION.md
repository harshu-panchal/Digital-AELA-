# Data Folder Migration - Deployment Guide

## ⚠️ IMPORTANT: Manual Steps Required on VPS

This migration moves the `data` folder from `root/data/` to `frontend/data/`. Simply pushing code **WILL NOT** automatically work. You need to perform manual steps on your VPS.

---

## 📋 Pre-Deployment Checklist

### What Changed:
- ✅ Data folder moved from `data/` to `frontend/data/`
- ✅ Backend code updated to reference new location
- ⚠️ **Existing uploaded files on VPS need to be moved manually**

---

## 🚀 Deployment Steps

### Step 1: Frontend (Vercel) - ✅ Automatic

**Action Required:** NONE - Auto-deploys when you push to main branch

- Vercel will automatically rebuild and deploy
- The data folder structure will be in the repo, but contents are ignored (which is correct)
- **Note:** Vercel doesn't store uploaded files (they're on your VPS backend)

---

### Step 2: Backend (Contabo VPS) - ⚠️ MANUAL STEPS REQUIRED

**⚠️ CRITICAL:** You must perform these steps on your VPS server to avoid breaking file uploads and existing files.

#### Step 2.1: Backup Existing Data (IMPORTANT!)

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to your project directory
cd /path/to/your/project

# Create a backup of existing data folder
cp -r data data_backup_$(date +%Y%m%d)

# Verify backup was created
ls -la data_backup_*
```

#### Step 2.2: Move Existing Data Folder

```bash
# Move the existing data folder to frontend/data
mv data frontend/data

# Verify the move was successful
ls -la frontend/data/
# You should see: photos, videos, PDFs, images, others folders
```

#### Step 2.3: Update Git Repository

```bash
# Pull the latest code changes
git pull origin main  # or your main branch name

# If you have uncommitted changes, stash them first:
# git stash
# git pull origin main
# git stash pop
```

#### Step 2.4: Verify Folder Structure

```bash
# Check that the folder structure is correct
cd backend
ls -la ../frontend/data/

# Should show:
# photos/
# videos/
# PDFs/
# images/
# others/
```

#### Step 2.5: Restart Backend Service

```bash
# Check what process manager you're using (PM2, systemd, etc.)
# If using PM2:
pm2 restart digital-aela-backend
# or
pm2 restart all

# If using systemd:
sudo systemctl restart digital-aela-backend
# or whatever your service name is

# If running manually:
# Stop the current process (Ctrl+C) and restart with:
cd backend
npm start
```

#### Step 2.6: Verify Backend is Working

```bash
# Check backend logs for errors
pm2 logs digital-aela-backend
# or
sudo journalctl -u digital-aela-backend -f

# Test static file serving
curl http://localhost:5000/static/photos/testimonials/
# Should return directory listing or files
```

#### Step 2.7: Test File Upload

1. Go to your admin panel
2. Try uploading a test image (gallery, profile, etc.)
3. Verify the file is saved correctly
4. Check that existing files still display correctly

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Backend starts without errors
- [ ] Existing images/photos still display correctly
- [ ] New file uploads work
- [ ] Static files are served correctly (`/static/photos/...`, etc.)
- [ ] No 404 errors for existing media files
- [ ] Database references to files still work

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Cannot find module" or path errors

**Solution:** Verify the data folder path is correct:
```bash
cd backend
node -e "const path = require('path'); console.log(path.resolve(__dirname, '../frontend/data'))"
# Should show: /path/to/your/project/frontend/data
```

### Issue 2: Existing files return 404

**Possible causes:**
- Data folder wasn't moved correctly
- Backend is looking in wrong location
- Permissions issue

**Solution:**
```bash
# Check folder exists
ls -la frontend/data/

# Check permissions
chmod -R 755 frontend/data/

# Verify backend can read files
ls -la frontend/data/photos/
```

### Issue 3: New uploads fail

**Solution:**
```bash
# Check folder permissions (backend needs write access)
sudo chown -R your-user:your-group frontend/data/
chmod -R 755 frontend/data/

# Check backend logs for specific errors
pm2 logs digital-aela-backend --lines 100
```

### Issue 4: Backend won't start

**Solution:**
- Check backend logs for path resolution errors
- Verify Node.js version compatibility
- Ensure all dependencies are installed: `cd backend && npm install`

---

## 📝 Rollback Plan (If Something Goes Wrong)

If you need to rollback:

```bash
# Stop backend
pm2 stop digital-aela-backend

# Move data folder back
mv frontend/data data

# Revert code changes (git reset or checkout previous commit)
git checkout HEAD~1 backend/src/app.js backend/src/services/fileStorageService.js

# Restart backend
pm2 start digital-aela-backend
```

---

## 📅 Deployment Timeline Recommendation

1. **Off-Peak Hours**: Deploy during low-traffic hours
2. **Backup First**: Always backup before making changes
3. **Test Locally**: Test the changes in a staging environment first if possible
4. **Monitor**: Watch logs for first 30 minutes after deployment

---

## 🆘 Need Help?

If you encounter issues:
1. Check backend logs: `pm2 logs` or `journalctl -u your-service`
2. Verify folder structure matches expected paths
3. Check file permissions
4. Test static file serving: `curl http://localhost:5000/static/photos/`

---

## ✅ After Successful Deployment

Once everything is working:
1. Delete old backup after verifying everything works (wait 24-48 hours)
2. Update any deployment scripts/documentation
3. Consider automating this folder structure in your deployment process

---

**Last Updated:** After data folder migration to frontend/data

