# Deployment Environment Variables Guide

This document lists all environment variables required for deploying the Digital AELA platform.

## Backend Environment Variables

### Required Variables

These variables **MUST** be set for the backend to function:

| Variable | Description | Example | Where to Get |
|----------|-------------|----------|--------------|
| `NODE_ENV` | Node environment | `production` | Set to `production` for production |
| `PORT` | Server port | `5000` | Default: 5000 |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` | MongoDB Atlas dashboard |
| `JWT_SECRET` | JWT access token secret | Random string | Generate with: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Random string | Generate with: `openssl rand -base64 32` |
| `FRONTEND_URL` | Frontend application URL | `https://yourdomain.com` | Your frontend domain |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdefghijklmnop` | Cloudinary dashboard |
| `EMAIL_SERVICE` | Email service provider | `gmail`, `sendgrid`, or `smtp` | Choose your provider |
| `EMAIL_USER` | Email address for sending | `noreply@yourdomain.com` | Your email account |
| `EMAIL_PASS` | Email password/API key | App password or API key | See email setup guide |

### Optional Variables

These variables are optional but recommended for full functionality:

| Variable | Description | Default | Required For |
|----------|-------------|---------|--------------|
| `JWT_EXPIRES_IN` | Access token expiration | `15m` | Custom token expiry |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` | Custom refresh expiry |
| `GOOGLE_CLOUD_TRANSLATE_API_KEY` | Google Translate API key | - | Translation features |
| `TURN_SERVER_URL` | TURN server URL | - | Better WebRTC connectivity |
| `TURN_SERVER_USERNAME` | TURN server username | - | Better WebRTC connectivity |
| `TURN_SERVER_CREDENTIAL` | TURN server password | - | Better WebRTC connectivity |
| `MEDIASOUP_NUM_WORKERS` | MediaSoup worker count | Auto-detect | Voice room optimization |
| `MEDIASOUP_LOG_LEVEL` | MediaSoup log level | `warn` | Voice room debugging |

### Email Configuration Options

#### Option 1: Gmail (Development)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Note:** For Gmail, you need to:
1. Enable 2-Step Verification
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password)

#### Option 2: SendGrid (Production Recommended)
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

#### Option 3: Custom SMTP
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com
```

## Frontend Environment Variables

### Required Variables

| Variable | Description | Example | Required In |
|----------|-------------|----------|-------------|
| `VITE_API_URL` | Backend API base URL | `https://api.yourdomain.com/api/v1` | **Production** |

**Important Notes:**
- `VITE_API_URL` is **REQUIRED** in production
- If not set, the app defaults to `http://localhost:5000/api/v1` which will fail in production
- Do NOT include a trailing slash
- The URL should include `/api/v1` if your backend uses that path

## Setting Environment Variables

### Render (Backend)

1. Go to your Render service dashboard
2. Navigate to **Environment** tab
3. Add each variable with its value
4. Click **Save Changes**
5. The service will automatically redeploy

**Using render.yaml:**
```yaml
envVars:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    sync: false  # Set manually in dashboard
```

### Vercel (Frontend)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Add `VITE_API_URL` with your backend URL
5. Select environment (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your application

### Other Platforms

#### Netlify
1. Go to **Site settings** → **Environment variables**
2. Add `VITE_API_URL`
3. Redeploy

#### Heroku
1. Go to **Settings** → **Config Vars**
2. Add all variables
3. Restart dynos

## Security Checklist

Before deploying, ensure:

- [ ] All secrets are in environment variables (not hardcoded)
- [ ] `.env` files are in `.gitignore`
- [ ] `.env` files are NOT committed to Git
- [ ] Strong JWT secrets are generated (use `openssl rand -base64 32`)
- [ ] MongoDB connection string uses strong password
- [ ] Cloudinary API secret is secure
- [ ] Email credentials are secure
- [ ] All environment variables are set in deployment platform
- [ ] Production URLs are correct (not localhost)

## Testing Environment Variables

### Backend
```bash
# Check if all required variables are set
node -e "require('dotenv').config(); console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING');"
```

### Frontend
```bash
# Check if VITE_API_URL is set
echo $VITE_API_URL
```

## Troubleshooting

### Backend won't start
- Check that `MONGODB_URI` is set and valid
- Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Check `FRONTEND_URL` is correct

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set in production
- Check that `VITE_API_URL` matches your backend URL
- Ensure CORS is configured correctly in backend

### Email not sending
- Verify `EMAIL_SERVICE` is set correctly
- Check `EMAIL_USER` and `EMAIL_PASS` are correct
- For Gmail, ensure you're using App Password
- For SendGrid, verify API key is correct

### File uploads not working
- Verify Cloudinary credentials are set
- Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Quick Reference

### Generate Secrets
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32
```

### Minimum Required Variables for Backend
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_SERVICE=gmail
EMAIL_USER=...
EMAIL_PASS=...
```

### Minimum Required Variables for Frontend
```env
VITE_API_URL=https://api.yourdomain.com/api/v1
```

## Additional Resources

- [Backend Email Setup Guide](./backend/EMAIL_SETUP.md)
- [Cloudinary Setup Guide](./backend/CLOUDINARY_SETUP.md)
- [Translation Setup Guide](./TRANSLATION_SETUP.md)
- [Deployment Guide](./frontend/DEPLOYMENT.md)

