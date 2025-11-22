# Security Checklist - Before Pushing to GitHub

**⚠️ CRITICAL: Complete this checklist BEFORE pushing your code to GitHub to prevent secret leaks!**

## ✅ Pre-Push Security Checklist

### 1. Environment Files

- [ ] **`.env` file exists** in `backend/` directory with your actual secrets
- [ ] **`.env` file is NOT tracked by Git** (run: `git ls-files | grep .env`)
- [ ] **`.env.example` exists** as a template (without real secrets) - this CAN be committed
- [ ] **`.env` is listed in `.gitignore`** (check both root and `backend/.gitignore`)
- [ ] **No `.env` files appear in `git status`** (if they do, remove them: `git rm --cached backend/.env`)

### 2. Credential Files

- [ ] **No credential JSON files** are committed (e.g., `*-credentials.json`, `google-cloud-credentials.json`)
- [ ] **`config/credentials/` directory is in `.gitignore`** (if you use service accounts)
- [ ] **No API keys hardcoded** in any source code files
- [ ] **No passwords or secrets** in comments or documentation

### 3. Git Status Check

Run these commands to verify:

```bash
# Check if .env is tracked
git ls-files | grep .env

# Check what's staged for commit
git status

# Check for any credentials files
git ls-files | grep -i credential
git ls-files | grep -i secret
git ls-files | grep -i key
```

**Expected results:**
- `.env.example` may appear (this is OK)
- **No actual `.env` files should appear**
- **No credential JSON files should appear**
- **No hardcoded secrets should appear**

### 4. API Keys and Secrets

- [ ] **Google Cloud Translate API Key** is only in `.env` file (not in code)
- [ ] **MongoDB URI** is only in `.env` file
- [ ] **JWT Secrets** are only in `.env` file
- [ ] **Cloudinary credentials** are only in `.env` file
- [ ] **Email passwords/API keys** are only in `.env` file
- [ ] **All API keys are unique** (not reused from other projects)

### 5. .gitignore Verification

Verify these patterns exist in `.gitignore` files:

**Root `.gitignore` should include:**
```
.env
.env.local
backend/.env
frontend/.env
*.json (except package*.json)
config/credentials/
```

**Backend `.gitignore` should include:**
```
.env
.env.local
*.json (except package*.json)
config/credentials/
google-cloud-credentials.json
```

## 🔧 Quick Fixes

### If `.env` is Already Tracked:

1. **Remove from Git (but keep file locally):**
   ```bash
   git rm --cached backend/.env
   ```

2. **Commit the removal:**
   ```bash
   git commit -m "Remove .env file from version control"
   ```

3. **Verify it's now ignored:**
   ```bash
   git status
   # .env should NOT appear
   ```

4. **If you already pushed to GitHub:**
   - ⚠️ **IMMEDIATELY rotate all API keys and secrets**
   - Regenerate Google Cloud API key
   - Regenerate JWT secrets
   - Change MongoDB password
   - Change all other secrets

### If Credential Files are Tracked:

1. **Remove from Git:**
   ```bash
   git rm --cached backend/config/credentials/*.json
   ```

2. **Add to .gitignore:**
   ```
   config/credentials/
   *.json
   !package*.json
   ```

3. **Commit changes:**
   ```bash
   git add .gitignore
   git commit -m "Add credentials to .gitignore"
   ```

## 📋 Final Verification

Before pushing to GitHub, run this complete check:

```bash
# Navigate to project root
cd /path/to/Digital-AELA--main

# 1. Check for .env files in Git
echo "=== Checking for .env files ==="
git ls-files | grep "\.env$"

# 2. Check for credential files
echo "=== Checking for credential files ==="
git ls-files | grep -i "credential\|secret\|key\.json"

# 3. Check git status
echo "=== Git status ==="
git status

# 4. Verify .gitignore
echo "=== Verifying .gitignore ==="
grep -r "\.env" .gitignore backend/.gitignore || echo "WARNING: .env might not be in .gitignore"
```

**All checks should pass before pushing!**

## 🚨 If Secrets Were Leaked

If you discover that secrets were accidentally committed and pushed:

1. **Immediately rotate ALL secrets:**
   - Google Cloud API key → Regenerate in Google Cloud Console
   - JWT secrets → Generate new random strings
   - MongoDB password → Change in MongoDB Atlas
   - Cloudinary credentials → Regenerate in Cloudinary dashboard
   - Email passwords → Change all email passwords

2. **Remove from Git history (if repository is small):**
   ```bash
   # CAUTION: This rewrites history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **For large repositories, consider using BFG Repo-Cleaner or contact GitHub support**

4. **Monitor for unauthorized access:**
   - Check Google Cloud API usage logs
   - Check MongoDB connection logs
   - Check all service dashboards for unusual activity

## ✅ After Verification

Once all checks pass:

- [ ] All secrets are in `.env` files only
- [ ] `.env` files are in `.gitignore`
- [ ] No secrets in Git history
- [ ] `.env.example` is committed (template only)
- [ ] All API keys are secured and restricted

**You're safe to push!** 🎉

## 📝 Notes

- **`.env.example` is safe to commit** - it's just a template
- **Never commit actual `.env` files** - they contain real secrets
- **Always verify before pushing** - use this checklist every time
- **Rotate secrets if unsure** - it's better to be safe than sorry

---

**Remember: Secrets in Git are permanent. Once pushed, consider them compromised and rotate immediately!**

