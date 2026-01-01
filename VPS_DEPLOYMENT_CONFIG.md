# VPS Deployment Configuration Guide

This guide helps you configure your web server (Nginx or Apache) to properly handle file uploads and CORS for the Digital AELA application.

## Common Issues

### 1. CORS Error on File Upload
**Error**: `Access to fetch at 'https://api.digitalaela.com/api/v1/admin/gallery' from origin 'https://digitalaela.com' has been blocked by CORS policy`

### 2. 413 Request Entity Too Large
**Error**: `POST https://api.digitalaela.com/api/v1/admin/gallery net::ERR_FAILED 413 (Request Entity Too Large)`

These errors occur when:
- The web server (Nginx/Apache) rejects the request before it reaches Node.js
- The web server doesn't include CORS headers in error responses
- File size limits in the web server are too low

---

## Solution: Configure Your Web Server

### Option 1: Nginx Configuration

Edit your Nginx configuration file (usually located at `/etc/nginx/sites-available/your-site` or `/etc/nginx/nginx.conf`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.digitalaela.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.digitalaela.com;

    # SSL Configuration (adjust paths as needed)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Increase client body size limit for file uploads (1GB)
    client_max_body_size 1G;
    
    # Increase buffer sizes for large requests
    client_body_buffer_size 128k;
    
    # Increase timeouts for file uploads
    client_body_timeout 60s;
    client_header_timeout 60s;
    send_timeout 60s;

    # CORS Headers - MUST be set for all responses including errors
    add_header 'Access-Control-Allow-Origin' 'https://digitalaela.com' always;
    add_header 'Access-Control-Allow-Origin' 'https://www.digitalaela.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, CSRF-Token' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Range, X-Content-Range, X-CSRF-Token' always;

    # Handle preflight OPTIONS requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://digitalaela.com' always;
        add_header 'Access-Control-Allow-Origin' 'https://www.digitalaela.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, CSRF-Token' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }

    # Custom error pages with CORS headers (important for 413 errors)
    error_page 413 @413_error;
    location @413_error {
        add_header 'Access-Control-Allow-Origin' 'https://digitalaela.com' always;
        add_header 'Access-Control-Allow-Origin' 'https://www.digitalaela.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, CSRF-Token' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Content-Type' 'application/json' always;
        return 413 '{"error":{"code":"PAYLOAD_TOO_LARGE","message":"Request entity too large. Maximum file size is 1GB."}}';
    }

    # Proxy settings
    location / {
        proxy_pass http://localhost:YOUR_NODE_PORT;  # Replace YOUR_NODE_PORT with your Node.js port (e.g., 3000, 5000, etc.)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase proxy timeouts for file uploads (set to 1 hour for large files)
        proxy_connect_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
        
        # Don't buffer large requests
        proxy_request_buffering off;
    }
    
    # Global settings for large uploads (put these in server block)
    client_max_body_size 2G;
    client_body_buffer_size 1M;
    client_body_timeout 3600s;
    client_header_timeout 3600s;
    send_timeout 3600s;
}
```

**Important Notes for Nginx:**
- Replace `YOUR_NODE_PORT` with your actual Node.js application port
- Adjust SSL certificate paths to match your setup
- After making changes, test the configuration: `sudo nginx -t`
- Reload Nginx: `sudo systemctl reload nginx`

### Option 2: Apache Configuration

If you're using Apache, edit your VirtualHost configuration file (usually in `/etc/apache2/sites-available/`):

```apache
<VirtualHost *:443>
    ServerName api.digitalaela.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    # Increase request body size limit for file uploads (1GB)
    LimitRequestBody 52428800
    
    # CORS Headers - MUST be set for all responses including errors
    Header always set Access-Control-Allow-Origin "https://digitalaela.com"
    Header always set Access-Control-Allow-Origin "https://www.digitalaela.com"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, CSRF-Token"
    Header always set Access-Control-Allow-Credentials "true"
    Header always set Access-Control-Expose-Headers "Content-Range, X-Content-Range, X-CSRF-Token"
    
    # Handle preflight OPTIONS requests
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteCond %{REQUEST_METHOD} OPTIONS
        RewriteRule ^(.*)$ $1 [R=200,L]
    </IfModule>
    
    # Proxy settings
    ProxyPreserveHost On
    ProxyPass / http://localhost:YOUR_NODE_PORT/  # Replace YOUR_NODE_PORT
    ProxyPassReverse / http://localhost:YOUR_NODE_PORT/
    
    # Increase timeouts for file uploads
    ProxyTimeout 60
</VirtualHost>
```

**Important Notes for Apache:**
- Replace `YOUR_NODE_PORT` with your actual Node.js application port
- Enable required Apache modules:
  ```bash
  sudo a2enmod proxy
  sudo a2enmod proxy_http
  sudo a2enmod headers
  sudo a2enmod rewrite
  sudo a2enmod ssl
  ```
- Test configuration: `sudo apache2ctl configtest`
- Restart Apache: `sudo systemctl restart apache2`

---

## Additional Configuration

### Backend Environment Variables

Make sure your backend `.env` file includes:

```env
FRONTEND_URL=https://digitalaela.com
NODE_ENV=production
PORT=YOUR_NODE_PORT  # Should match the port in your web server proxy config
```

### Frontend Environment Variables

Make sure your frontend environment includes:

```env
VITE_API_URL=https://api.digitalaela.com/api/v1
```

---

## Testing the Configuration

After applying the configuration:

1. **Test file upload** - Try uploading a gallery image (under 1GB)
2. **Check CORS headers** - Use browser DevTools Network tab to verify CORS headers are present
3. **Test error handling** - Try uploading a file larger than 1GB and verify you get a proper error response with CORS headers

### Quick Test Commands

```bash
# Test Nginx configuration
sudo nginx -t

# Test Apache configuration  
sudo apache2ctl configtest

# Check if Node.js is running on the expected port
sudo netstat -tlnp | grep YOUR_NODE_PORT

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Apache error logs
sudo tail -f /var/log/apache2/error.log
```

---

## Troubleshooting

### Still getting CORS errors?
- Verify the `Access-Control-Allow-Origin` header matches your frontend domain exactly
- Check browser DevTools Network tab - if you see a 413 error, the web server is rejecting before Node.js
- Ensure CORS headers are set with `always` flag in Nginx (or `Header always set` in Apache)

### Still getting 413 errors?
- Increase `client_max_body_size` in Nginx or `LimitRequestBody` in Apache
- Check that your file size is within the limit
- Verify the limit is set in both the web server AND the backend (backend allows 5MB for images)

### Web server not starting?
- Check configuration syntax: `nginx -t` or `apache2ctl configtest`
- Check error logs for specific issues
- Verify all required modules are enabled

---

## Security Notes

- Only allow your frontend domains in CORS configuration (not `*`)
- Use HTTPS for all production traffic
- Keep SSL certificates up to date
- Regularly update your web server and Node.js dependencies

---

## Need Help?

If you're still experiencing issues after following this guide:
1. Check your web server error logs
2. Check your Node.js application logs
3. Verify all environment variables are set correctly
4. Test the backend API directly (bypassing the web server) to isolate the issue

