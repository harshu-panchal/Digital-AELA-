# Resolve Git Pull Error - .gitkeep Files Conflict

## The Problem
Git pull is failing because there are untracked `.gitkeep` files in `frontend/data/` that would be overwritten.

## Quick Fix

Run these commands on your VPS server:

```bash
# Remove all .gitkeep files from frontend/data/
find frontend/data -name ".gitkeep" -type f -delete

# Verify they're gone
find frontend/data -name ".gitkeep" -type f

# Now pull the code
git pull origin main
```

## Alternative: If You Want to Keep Your Local Structure

If you want to preserve the folder structure first:

```bash
# Backup the .gitkeep files location
mkdir -p /tmp/data_backup_gitkeep

# Remove .gitkeep files (they'll be restored from repo)
find frontend/data -name ".gitkeep" -type f -exec rm {} \;

# Now pull
git pull origin main
```

## After Pull Succeeds

1. **Restart your backend:**
   ```bash
   pm2 restart digital-aela-backend
   ```

2. **Verify the fix:**
   ```bash
   # Check backend logs
   pm2 logs digital-aela-backend --lines 20
   ```

---

**Note:** `.gitkeep` files are just placeholders to keep empty directories in git. Removing them is safe - they'll be restored from the repository if needed.

