# Translation Not Working in Production - Fix Guide

## Problem
Translation works on localhost but not in production.

## Root Cause
The `VITE_API_URL` environment variable is likely not set in your production deployment, causing the frontend to try to connect to `http://localhost:5000/api/v1` instead of your production backend.

## Solution

### Step 1: Set VITE_API_URL in Production

You need to set the `VITE_API_URL` environment variable in your deployment platform.

#### For Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-domain.com/api/v1`
   - **Environment**: Production (and Preview if needed)
4. Redeploy your application

#### For Netlify:
1. Go to Site settings
2. Navigate to "Environment variables"
3. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-domain.com/api/v1`
   - **Scopes**: Production, Deploy previews, Branch deploys
4. Redeploy your site

#### For Other Platforms:
Set the environment variable `VITE_API_URL` to your backend API URL (e.g., `https://api.yourdomain.com/api/v1`)

### Step 2: Verify Backend Translation Endpoint

Make sure your backend has the translation routes configured:

1. Check that `/api/v1/translate` endpoint exists
2. Verify it's accessible without authentication (or with `skipAuth: true`)
3. Test the endpoint directly:
   ```bash
   curl -X POST https://your-backend-domain.com/api/v1/translate \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello", "targetLang": "hi", "sourceLang": "en"}'
   ```

### Step 3: Check Browser Console

After deploying with `VITE_API_URL` set, check the browser console:

1. Look for errors like:
   - `[API Config] ❌ CRITICAL: VITE_API_URL is not set in production!`
   - `[Translation Service] Translation failed:`
   - Network errors (CORS, connection refused, etc.)

2. If you see the critical error, the environment variable is not set correctly.

3. If you see translation errors, check:
   - The API URL in the error message
   - Whether it's pointing to localhost (wrong) or your production backend (correct)
   - Network error codes (CORS, 502, etc.)

### Step 4: Verify Environment Variable is Loaded

Add this temporary check in your app to verify:

```javascript
// In frontend/src/config/api.js - temporary debug
if (import.meta.env.PROD) {
  console.log("[DEBUG] API Base URL:", API_BASE_URL);
  console.log("[DEBUG] VITE_API_URL from env:", import.meta.env.VITE_API_URL);
}
```

After deployment, check the console. You should see:
- `API Base URL: https://your-backend-domain.com/api/v1` (correct)
- NOT `API Base URL: http://localhost:5000/api/v1` (wrong)

### Step 5: Common Issues

#### Issue: CORS Errors
**Solution**: Make sure your backend allows requests from your frontend domain:
```javascript
// In backend CORS config
origin: ['https://your-frontend-domain.com', 'https://www.your-frontend-domain.com']
```

#### Issue: Backend Not Running
**Solution**: Ensure your backend server is running and accessible at the URL you set in `VITE_API_URL`

#### Issue: Translation Endpoint Not Found (404)
**Solution**: Verify the translation routes are registered in your backend:
```javascript
// Should be in backend/src/app.js
app.use("/api/v1/translate", translationRoutes);
```

#### Issue: Google Cloud Translate API Key Not Set
**Solution**: Ensure `GOOGLE_CLOUD_TRANSLATE_API_KEY` is set in your backend environment variables

### Step 6: Testing

After setting `VITE_API_URL` and redeploying:

1. Open your production site
2. Open browser DevTools (F12)
3. Go to Console tab
4. Change the language using the language selector
5. Check for:
   - No critical API config errors
   - Translation requests in Network tab
   - Text actually translating on the page

## Quick Checklist

- [ ] `VITE_API_URL` is set in production environment variables
- [ ] `VITE_API_URL` points to your production backend (not localhost)
- [ ] Backend server is running and accessible
- [ ] Backend has `/api/v1/translate` endpoint configured
- [ ] Backend has `GOOGLE_CLOUD_TRANSLATE_API_KEY` set
- [ ] CORS is configured to allow your frontend domain
- [ ] Application has been redeployed after setting environment variable

## Still Not Working?

1. Check browser console for specific error messages
2. Check Network tab to see if translation requests are being made
3. Verify the request URL is correct (should be your production backend, not localhost)
4. Test the backend translation endpoint directly with curl/Postman
5. Check backend logs for translation errors

