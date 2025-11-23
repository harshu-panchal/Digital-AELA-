# Deployment Guide

## Environment Variables

### Required Environment Variables

The following environment variables must be set in your deployment platform (e.g., Vercel) for the application to work correctly in production:

#### `VITE_API_URL` (REQUIRED)

**Description**: The base URL for the backend API.

**Format**: `https://your-backend-url.com/api/v1`

**Example**:

- Production: `https://digital-aela-backend.onrender.com/api/v1`
- Development: `http://localhost:5000/api/v1` (default, used if not set)

**Important Notes**:

- This variable MUST be set in production. If not set, the application will default to `http://localhost:5000/api/v1`, which will fail in production.
- The URL should include the `/api/v1` path if your backend uses it.
- Do NOT include a trailing slash - the application will handle that automatically.
- This variable is used by all API service files through the centralized config at `frontend/src/config/api.js`.

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Add the following:
   - **Name**: `VITE_API_URL`
   - **Value**: Your production backend URL (e.g., `https://your-backend.onrender.com/api/v1`)
   - **Environment**: Select all environments (Production, Preview, Development) or just Production
5. Click **Save**
6. **Redeploy** your application for the changes to take effect

### Setting Environment Variables in Other Platforms

#### Netlify

1. Go to **Site settings** → **Environment variables**
2. Add `VITE_API_URL` with your backend URL
3. Redeploy

#### Render

1. Go to your service → **Environment**
2. Add `VITE_API_URL` with your backend URL
3. Redeploy

## Verification

After setting the environment variable:

1. **Check the build logs** - The API URL should be logged during build (in development mode)
2. **Check browser console** - In production, if `VITE_API_URL` is not set, you'll see an error:
   ```
   [API Config] VITE_API_URL is not set in production! API calls will fail.
   ```
3. **Test API calls** - Make sure API requests are going to the correct backend URL, not localhost

## Troubleshooting

### Issue: Website shows dummy data instead of live data

**Possible Causes**:

1. `VITE_API_URL` is not set in production
2. Backend API is not accessible from the frontend domain (CORS issues)
3. Backend API is down or returning errors

**Solutions**:

1. Verify `VITE_API_URL` is set correctly in your deployment platform
2. Check browser console for API connection errors
3. Verify backend CORS settings allow requests from your frontend domain
4. Check backend logs to ensure it's running and accessible

### Issue: API calls fail with CORS errors

**Solution**: Ensure your backend CORS configuration includes your frontend domain. See `backend/src/app.js` for CORS configuration.

### Issue: Environment variable not taking effect

**Solution**:

- Make sure you've redeployed after adding the environment variable
- Clear browser cache and hard refresh
- Check that the variable name is exactly `VITE_API_URL` (case-sensitive)
- Verify the variable is set for the correct environment (Production vs Preview)

## Development vs Production Behavior

### Development Mode

- If `VITE_API_URL` is not set, defaults to `http://localhost:5000/api/v1`
- Shows dummy/seed data if API is unavailable (for easier development)
- More verbose error logging

### Production Mode

- **REQUIRES** `VITE_API_URL` to be set
- Shows empty states instead of dummy data if API is unavailable
- Logs API errors to console for debugging
- More user-friendly error messages

## Related Files

- `frontend/src/config/api.js` - Centralized API configuration
- `frontend/src/services/api/baseClient.js` - Base API client with error handling
- `frontend/src/contexts/UserContext.jsx` - User context (uses API)
- `frontend/src/contexts/BlogContext.jsx` - Blog context (uses API)
