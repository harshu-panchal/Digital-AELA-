# How to Find Your VITE_API_URL

## Quick Steps

### Step 1: Identify Where Your Backend is Deployed

Your backend can be deployed on:
- **Render** (most common based on your setup)
- **Vercel**
- **Railway**
- **Heroku**
- **Custom server/VPS**

### Step 2: Find Your Backend URL

#### If Backend is on Render:

1. Go to https://dashboard.render.com
2. Log in to your account
3. Find your backend service (usually named `digital-aela-backend` or similar)
4. Click on the service
5. **The URL is displayed at the top** of the service page
   - Format: `https://your-service-name.onrender.com`
6. **Add `/api/v1` to the end**:
   - Example: `https://digital-aela-backend.onrender.com/api/v1`

#### If Backend is on Vercel:

1. Go to https://vercel.com/dashboard
2. Find your backend project
3. Go to **Settings** → **Domains**
4. Copy the domain (e.g., `your-backend.vercel.app`)
5. Add `/api/v1`: `https://your-backend.vercel.app/api/v1`

#### If Backend is on Railway:

1. Go to https://railway.app/dashboard
2. Select your backend service
3. Go to **Settings** → **Networking**
4. Copy the public domain
5. Add `/api/v1`: `https://your-backend.up.railway.app/api/v1`

### Step 3: Test Your Backend URL

Before using it, test if your backend is accessible:

1. **Health Check Endpoint**:
   Open in browser: `https://your-backend-url.onrender.com/health`
   
   You should see:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-..."
   }
   ```

2. **API Endpoint Test**:
   Open in browser: `https://your-backend-url.onrender.com/api/v1/public/settings`
   
   You should see JSON data (or an empty object if no settings exist)

### Step 4: Use the URL

Once you have your backend URL, use it as your `VITE_API_URL`:

**Format**: `https://your-backend-url.com/api/v1`

**Important**:
- ✅ Include `/api/v1` at the end
- ✅ Use `https://` (not `http://`)
- ✅ Do NOT include a trailing slash
- ✅ The URL should be accessible from the internet

## Examples

### Render Example:
```
Backend Service URL: https://digital-aela-backend.onrender.com
VITE_API_URL: https://digital-aela-backend.onrender.com/api/v1
```

### Vercel Example:
```
Backend Domain: my-backend.vercel.app
VITE_API_URL: https://my-backend.vercel.app/api/v1
```

### Custom Domain Example:
```
Backend Domain: api.digitalaela.com
VITE_API_URL: https://api.digitalaela.com/api/v1
```

## If You Haven't Deployed Backend Yet

If you haven't deployed your backend:

1. **Deploy to Render** (recommended):
   - Follow instructions in `backend/DEPLOY_RENDER.md`
   - Once deployed, you'll get a URL like `https://your-service.onrender.com`
   - Use that URL + `/api/v1` as your `VITE_API_URL`

2. **Or use localhost for development**:
   - For local development only: `http://localhost:5000/api/v1`
   - This won't work in production!

## Troubleshooting

### "Backend URL not found"
- Check if your backend service is actually deployed
- Verify the service is running (not paused/stopped)
- Check Render/Vercel dashboard for service status

### "Connection refused" or "Failed to fetch"
- Backend might be sleeping (Render free tier)
- Wait 30-60 seconds and try again
- Check backend logs in your deployment platform

### "CORS error"
- Backend is running but CORS is blocking requests
- Check `FRONTEND_URL` environment variable in backend
- Ensure it matches your frontend domain

## Still Can't Find It?

1. **Check your deployment platform dashboard** - The URL is always shown there
2. **Check your email** - Deployment platforms usually send the URL via email
3. **Check browser history** - If you've accessed the backend before, check your browser history
4. **Check your team/colleagues** - Someone else might have deployed it

## Quick Test Script

Once you have your URL, test it with this command (in terminal):

```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/health

# Test API endpoint
curl https://your-backend-url.onrender.com/api/v1/public/settings
```

If both return JSON, your backend URL is correct!

