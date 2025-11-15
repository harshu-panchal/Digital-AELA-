# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image uploads in the Digital AELA backend.

## Prerequisites

1. A Cloudinary account (sign up at [cloudinary.com](https://cloudinary.com))
2. Node.js backend with the required packages installed

## Step 1: Create a Cloudinary Account

1. Go to [Cloudinary Sign Up](https://cloudinary.com/users/register_free)
2. Sign up for a free account (you can use Google/GitHub/email)
3. Verify your email if required

## Step 2: Get Your Cloudinary Credentials

1. Log in to your [Cloudinary Dashboard](https://cloudinary.com/console)
2. Go to the **Dashboard** tab
3. You'll find your credentials:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

⚠️ **Keep your API Secret safe!** Never commit it to public repositories.

## Step 3: Set Environment Variables

Add these environment variables to your `.env` file in the `backend` directory:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### For Render Deployment

Add these environment variables in your Render dashboard:

1. Go to your service in [Render Dashboard](https://dashboard.render.com)
2. Click on your service
3. Go to **Environment** tab
4. Add the following variables:
   - `CLOUDINARY_CLOUD_NAME` = `your-cloud-name`
   - `CLOUDINARY_API_KEY` = `your-api-key`
   - `CLOUDINARY_API_SECRET` = `your-api-secret`

## Step 4: Verify Installation

The required packages are already installed:
- `cloudinary` - Cloudinary SDK for Node.js
- `multer` - Middleware for handling `multipart/form-data` file uploads

If you need to reinstall:
```bash
cd backend
npm install cloudinary multer
```

## Step 5: Test the Upload API

### Upload Single Image

**Endpoint:** `POST /api/v1/upload/single`

**Request:**
```bash
curl -X POST https://your-backend.onrender.com/api/v1/upload/single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "folder=digital-aela"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/digital-aela/image.jpg",
    "public_id": "digital-aela/1234567890-123456789",
    "format": "jpg",
    "width": 1920,
    "height": 1080,
    "bytes": 245678
  }
}
```

### Upload Multiple Images

**Endpoint:** `POST /api/v1/upload/multiple`

**Request:**
```bash
curl -X POST https://your-backend.onrender.com/api/v1/upload/multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "folder=digital-aela"
```

### Delete Image

**Endpoint:** `DELETE /api/v1/upload/:public_id`

**Request:**
```bash
curl -X DELETE https://your-backend.onrender.com/api/v1/upload/digital-aela/1234567890-123456789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Using in Frontend

### Example: Upload Image with JavaScript/Fetch

```javascript
const uploadImage = async (file, authToken) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'digital-aela'); // Optional

  const response = await fetch('https://your-backend.onrender.com/api/v1/upload/single', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result.data.url; // Use this URL in your database
};
```

### Example: React Component

```jsx
import { useState } from 'react';

function ImageUpload({ onUpload }) {
  const [uploading, setUploading] = useState(false);
  const token = localStorage.getItem('authToken'); // Get your auth token

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'digital-aela');

    try {
      const response = await fetch('https://your-backend.onrender.com/api/v1/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        onUpload(result.data.url); // Pass URL to parent component
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

## API Reference

### POST `/api/v1/upload/single`

Upload a single image file.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Body (multipart/form-data):**
- `image` (file, required) - Image file to upload
- `folder` (string, optional) - Cloudinary folder name (default: "digital-aela")

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "public_id": "...",
    "format": "jpg",
    "width": 1920,
    "height": 1080,
    "bytes": 245678
  }
}
```

### POST `/api/v1/upload/multiple`

Upload multiple image files (up to 10).

**Headers:**
- `Authorization: Bearer <token>` (required)

**Body (multipart/form-data):**
- `images` (files[], required) - Array of image files to upload
- `folder` (string, optional) - Cloudinary folder name (default: "digital-aela")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "url": "https://...",
      "public_id": "...",
      "format": "jpg",
      "width": 1920,
      "height": 1080,
      "bytes": 245678
    },
    // ... more images
  ]
}
```

### DELETE `/api/v1/upload/:public_id`

Delete an image from Cloudinary.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Params:**
- `public_id` (string, required) - Cloudinary public ID of the image

**Response:**
```json
{
  "success": true,
  "data": {
    "result": "ok"
  }
}
```

## Configuration

### File Limits

- **Max file size:** 5MB per file
- **Max files:** 10 files per request (multiple upload)
- **Allowed formats:** jpg, jpeg, png, gif, webp, svg

To change limits, edit `backend/src/middleware/uploadMiddleware.js`:

```javascript
limits: {
  fileSize: 10 * 1024 * 1024, // Change to 10MB
},
```

### Cloudinary Folder Structure

Images are organized in folders:
- Default folder: `digital-aela`
- You can specify a folder in the upload request

Example folder structure:
```
digital-aela/
  ├── avatars/
  ├── cover-images/
  ├── thumbnails/
  └── blog-images/
```

## Free Tier Limits

Cloudinary Free Tier includes:
- **25 credits/month**
- Each credit = 1GB storage OR 1GB bandwidth OR 1,000 transformations
- Unlimited time (not expiring)

**Best Practices:**
- Optimize images before upload (compress, resize)
- Use Cloudinary transformations for responsive images
- Monitor usage in Cloudinary Dashboard

## Troubleshooting

### "Missing CLOUDINARY_CLOUD_NAME"

**Solution:** Ensure environment variables are set in `.env` file or Render dashboard.

### "Upload failed: Invalid file type"

**Solution:** Only image files are allowed. Check file extension and MIME type.

### "File size exceeds the limit"

**Solution:** 
- Compress images before upload
- Increase limit in `uploadMiddleware.js` (not recommended for free tier)
- Use Cloudinary transformations to resize images

### "Authentication error"

**Solution:** 
- Ensure you're sending the `Authorization` header with a valid token
- All upload endpoints require authentication

### Images not appearing

**Solution:**
- Check Cloudinary Dashboard to see if images are uploaded
- Verify the URL format is correct
- Check CORS settings if loading from frontend

## Security Best Practices

1. ✅ **Never commit API secrets** to Git
2. ✅ **Use environment variables** for all credentials
3. ✅ **Authenticate all uploads** (already implemented)
4. ✅ **Validate file types** (already implemented)
5. ✅ **Set file size limits** (already implemented - 5MB)
6. ✅ **Use HTTPS** for all API calls

## Next Steps

1. Update your controllers to use the upload URLs
2. Replace existing image URL fields with Cloudinary URLs
3. Implement image deletion when records are deleted
4. Add image optimization/transformation endpoints if needed

## Support

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Multer Documentation](https://github.com/expressjs/multer)
- Check Cloudinary Dashboard for usage and analytics

