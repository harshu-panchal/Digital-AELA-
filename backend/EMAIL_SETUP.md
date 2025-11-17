# Email Service Setup Guide

This guide explains how to configure email service for password reset functionality.

## Supported Email Providers

The email service supports multiple providers:

1. **Gmail** (Recommended for development)
2. **SendGrid** (Recommended for production)
3. **Custom SMTP** (Any SMTP server)

---

## Environment Variables

Add these variables to your `.env` file:

### Option 1: Gmail (Development)

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:5173
```

**Note:** For Gmail, you need to:

1. Enable 2-Step Verification
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password)

### Option 2: SendGrid (Production)

```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Getting SendGrid API Key:**

1. Sign up at https://sendgrid.com
2. Go to Settings > API Keys
3. Create a new API key with "Mail Send" permissions
4. Copy the API key to your `.env` file

### Option 3: Custom SMTP

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

---

## Testing Email Configuration

You can test your email configuration by creating a simple test script:

```javascript
import { testEmailConfiguration } from "./src/utils/emailService.js";

testEmailConfiguration().then((result) => {
  if (result.success) {
    console.log("✅ Email configuration is valid!");
  } else {
    console.error("❌ Email configuration error:", result.error);
  }
});
```

---

## Email Templates

The password reset emails use HTML templates with:

- Professional styling
- Responsive design
- Clear call-to-action buttons
- Security information
- Branding

You can customize the templates in `src/utils/emailService.js`.

---

## Security Features

1. **Token Expiration:** Reset tokens expire after 1 hour
2. **Single Use:** Tokens can only be used once
3. **Auto-cleanup:** Expired tokens are automatically deleted
4. **Email Enumeration Protection:** Always returns success message (doesn't reveal if email exists)

---

## Troubleshooting

### Gmail Issues

**Error: "Invalid login"**

- Make sure you're using an App Password, not your regular password
- Enable 2-Step Verification first

**Error: "Less secure app access"**

- Gmail no longer supports "less secure apps"
- You must use App Passwords

### SendGrid Issues

**Error: "Forbidden"**

- Check that your API key has "Mail Send" permissions
- Verify your SendGrid account is activated

**Error: "Sender verification required"**

- Verify your sender email address in SendGrid dashboard
- For production, verify your domain

### SMTP Issues

**Error: "Connection timeout"**

- Check firewall settings
- Verify SMTP host and port are correct
- Try port 587 (TLS) or 465 (SSL)

**Error: "Authentication failed"**

- Verify username and password
- Check if account requires special authentication

---

## Production Recommendations

1. **Use SendGrid or AWS SES** for production
2. **Set up SPF, DKIM, and DMARC** records for your domain
3. **Monitor email delivery** rates
4. **Set up email queues** for better reliability
5. **Use environment-specific email templates**

---

## Example .env File

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=your-email@gmail.com

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:5173

# Other environment variables...
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

---

## Next Steps

1. Install nodemailer: `npm install nodemailer`
2. Configure your email provider in `.env`
3. Test the configuration
4. Deploy and test password reset flow

For questions or issues, check the main README or contact support.
