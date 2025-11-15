# Deploying Backend to Render

This guide will help you deploy the Digital AELA backend to Render.

## Prerequisites

1. A GitHub account with this repository pushed
2. A Render account (sign up at [render.com](https://render.com))
3. A MongoDB database (MongoDB Atlas recommended for production)

## Step 1: Prepare MongoDB Database

1. **MongoDB Atlas Setup** (Recommended):

   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Create a database user
   - Whitelist IP `0.0.0.0/0` (allows all IPs) or your Render service IP
   - Copy the connection string (MONGODB_URI)

   Example connection string format:

   ```
   mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
   ```

## Step 2: Generate JWT Secrets

Generate secure random strings for your JWT secrets. You can use:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64

# Using PowerShell (Windows)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Generate **two different secrets**:

- One for `JWT_SECRET`
- One for `JWT_REFRESH_SECRET`

## Step 3: Deploy to Render

### Option A: Using Render Dashboard (Recommended for First Time)

1. **Create a New Web Service**:

   - Log in to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing this backend

2. **Configure the Service**:

   - **Name**: `digital-aela-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Set Environment Variables**:
   Click on "Environment" tab and add:

   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-generated-jwt-secret>
   JWT_REFRESH_SECRET=<your-generated-refresh-secret>
   FRONTEND_URL=<your-frontend-url>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ```

   **Important Notes**:

   - Replace `<your-mongodb-connection-string>` with your actual MongoDB URI
   - Replace `<your-generated-jwt-secret>` and `<your-generated-refresh-secret>` with your generated secrets
   - Replace `<your-frontend-url>` with your frontend URL (e.g., `https://your-frontend.onrender.com` or your Vercel URL)

4. **Deploy**:

   - Click "Create Web Service"
   - Render will start building and deploying your service
   - Wait for deployment to complete (usually 2-5 minutes)

5. **Get Your Backend URL**:
   - Once deployed, Render will provide a URL like: `https://digital-aela-backend.onrender.com`
   - Update your frontend to use this URL for API calls

### Option B: Using render.yaml (Blueprints)

If you prefer infrastructure as code:

1. The `render.yaml` file is already created in the backend directory
2. In Render Dashboard:
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect `render.yaml`
   - You'll need to provide the environment variables marked with `sync: false`:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `JWT_REFRESH_SECRET`
     - `FRONTEND_URL`

## Step 4: Verify Deployment

1. **Check Health Endpoint**:
   Visit: `https://your-service-name.onrender.com/health`

   You should see:

   ```json
   {
     "status": "ok",
     "timestamp": "2024-..."
   }
   ```

2. **Check Logs**:
   - Go to your service in Render Dashboard
   - Click on "Logs" tab
   - Look for:
     - `[Database] Connected to MongoDB`
     - `[Server] Listening on port 10000`
     - `[Socket.IO] Server initialized`

## Step 5: Update Frontend Configuration

Update your frontend to point to the Render backend URL:

```javascript
// In your frontend API configuration
const API_BASE_URL = "https://your-service-name.onrender.com";
```

## Important Notes

### Free Tier Limitations

- **Spinning down**: Free tier services spin down after 15 minutes of inactivity
- **Cold starts**: First request after spin-down may take 30-60 seconds
- **Upgrade**: Consider upgrading for production use

### CORS Configuration

Make sure your `FRONTEND_URL` environment variable matches your frontend domain exactly (including protocol and port if applicable).

### Database Connection

- Ensure MongoDB Atlas allows connections from Render's IPs (use `0.0.0.0/0` for all IPs)
- For production, consider using MongoDB Atlas IP whitelisting with Render's static IPs

### Socket.IO on Render

Socket.IO works on Render, but you may need to:

- Ensure your frontend WebSocket URL points to your Render service
- Consider using Render's paid plan for better WebSocket support

## Troubleshooting

### Service Fails to Start

1. Check logs in Render Dashboard
2. Verify all environment variables are set correctly
3. Ensure MongoDB connection string is valid
4. Check that `npm start` command works locally

### Database Connection Errors

1. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` or Render IPs
2. Check database user credentials in connection string
3. Ensure cluster is not paused (free tier may pause after inactivity)

### CORS Errors

1. Verify `FRONTEND_URL` environment variable matches your frontend domain
2. Check that CORS is properly configured in `app.js`

### Socket.IO Not Working

1. Ensure WebSocket connections are enabled (they work on Render free tier)
2. Check that frontend uses `wss://` (secure WebSocket) for production
3. Verify Socket.IO client version matches server version

## Next Steps

1. Set up automated deployments from your main branch
2. Consider setting up monitoring and alerts
3. Configure custom domain (paid plans)
4. Set up database backups
5. Implement health checks and monitoring

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- Check service logs in Render Dashboard for detailed error messages
