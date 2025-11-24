# How to Set Financial Password - Step by Step Guide

## Prerequisites
- You must be logged in as a **super-admin** in your browser
- Your backend server must be running
- You need your API base URL (usually `http://localhost:5000/api/v1` for local or your production URL)

---

## Method 1: Using Browser Console (Easiest - Recommended)

### Step 1: Log in as Super Admin
1. Open your application in the browser
2. Log in with your super admin credentials
3. Make sure you're authenticated

### Step 2: Open Browser Console
1. Press `F12` or `Right-click` → `Inspect`
2. Click on the **Console** tab

### Step 3: Get Your Access Token
Copy and paste this code in the console to get your access token:

```javascript
// Get access token from localStorage
const tokens = JSON.parse(localStorage.getItem('aela.auth.tokens'));
const accessToken = tokens?.accessToken;
console.log('Access Token:', accessToken);
```

### Step 4: Set the Financial Password
Copy and paste this code (replace `YOUR_PASSWORD_HERE` with your desired password):

```javascript
// Replace YOUR_PASSWORD_HERE with your actual password
const password = 'YOUR_PASSWORD_HERE';

// Get API URL (check your browser console for the logged API URL, or use default)
const API_BASE_URL = 'http://localhost:5000/api/v1'; // Change if different

// Get access token
const tokens = JSON.parse(localStorage.getItem('aela.auth.tokens'));
const accessToken = tokens?.accessToken;

if (!accessToken) {
  console.error('❌ Not logged in! Please log in first.');
} else {
  // Make the API call
  fetch(`${API_BASE_URL}/admin/settings/financial-password/set`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ password: password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Financial password set successfully!');
      console.log('Message:', data.message);
    } else {
      console.error('❌ Error:', data.error?.message || 'Failed to set password');
    }
  })
  .catch(error => {
    console.error('❌ Network error:', error);
  });
}
```

### Step 5: Verify It Worked
You should see: `✅ Financial password set successfully!`

---

## Method 2: Using cURL (Command Line)

### Step 1: Get Your Access Token
1. Log in as super admin in your browser
2. Open browser console (F12)
3. Run this to get your token:
```javascript
JSON.parse(localStorage.getItem('aela.auth.tokens'))?.accessToken
```
4. Copy the token

### Step 2: Run cURL Command
Open your terminal/command prompt and run:

**For Local Development:**
```bash
curl -X POST http://localhost:5000/api/v1/admin/settings/financial-password/set \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{"password":"YOUR_PASSWORD_HERE"}'
```

**For Production:**
```bash
curl -X POST https://your-backend-url.com/api/v1/admin/settings/financial-password/set \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{"password":"YOUR_PASSWORD_HERE"}'
```

**Replace:**
- `YOUR_ACCESS_TOKEN_HERE` with your actual access token
- `YOUR_PASSWORD_HERE` with your desired password
- `https://your-backend-url.com` with your actual backend URL

### Expected Response:
```json
{
  "success": true,
  "message": "Financial password has been set successfully"
}
```

---

## Method 3: Using Postman

### Step 1: Setup Request
1. Open Postman
2. Create a new **POST** request
3. Enter URL: `http://localhost:5000/api/v1/admin/settings/financial-password/set`
   (Replace with your production URL if needed)

### Step 2: Add Headers
1. Go to **Headers** tab
2. Add these headers:
   - **Key**: `Content-Type`, **Value**: `application/json`
   - **Key**: `Authorization`, **Value**: `Bearer YOUR_ACCESS_TOKEN_HERE`

### Step 3: Add Body
1. Go to **Body** tab
2. Select **raw** and **JSON**
3. Enter:
```json
{
  "password": "YOUR_PASSWORD_HERE"
}
```

### Step 4: Get Access Token
1. Log in as super admin in your browser
2. Open browser console (F12)
3. Run: `JSON.parse(localStorage.getItem('aela.auth.tokens'))?.accessToken`
4. Copy the token and paste it in the Authorization header

### Step 5: Send Request
Click **Send** button. You should get a success response.

---

## Method 4: Using a Simple HTML Page

Create a file `set-financial-password.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Set Financial Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        input, button {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            border: 1px solid #333;
        }
        input {
            background: #2a2a2a;
            color: #fff;
        }
        button {
            background: #D4AF37;
            color: #000;
            font-weight: bold;
            cursor: pointer;
        }
        button:hover {
            background: #E5C158;
        }
        #result {
            margin-top: 20px;
            padding: 10px;
            border-radius: 5px;
        }
        .success {
            background: #1a5a1a;
            color: #90ee90;
        }
        .error {
            background: #5a1a1a;
            color: #ff6b6b;
        }
    </style>
</head>
<body>
    <h1>Set Financial Password</h1>
    <p>Enter your desired financial password below:</p>
    
    <input type="password" id="password" placeholder="Enter financial password" />
    <input type="text" id="apiUrl" placeholder="API URL (e.g., http://localhost:5000/api/v1)" value="http://localhost:5000/api/v1" />
    
    <button onclick="setPassword()">Set Financial Password</button>
    
    <div id="result"></div>

    <script>
        async function setPassword() {
            const password = document.getElementById('password').value;
            const apiUrl = document.getElementById('apiUrl').value;
            const resultDiv = document.getElementById('result');
            
            if (!password) {
                resultDiv.className = 'error';
                resultDiv.textContent = '❌ Please enter a password';
                return;
            }
            
            // Get access token from localStorage (you need to be logged in)
            const tokens = JSON.parse(localStorage.getItem('aela.auth.tokens'));
            const accessToken = tokens?.accessToken;
            
            if (!accessToken) {
                resultDiv.className = 'error';
                resultDiv.textContent = '❌ Not logged in! Please log in as super admin first, then open this page.';
                return;
            }
            
            try {
                const response = await fetch(`${apiUrl}/admin/settings/financial-password/set`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ password: password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.className = 'success';
                    resultDiv.textContent = '✅ ' + data.message;
                    document.getElementById('password').value = '';
                } else {
                    resultDiv.className = 'error';
                    resultDiv.textContent = '❌ ' + (data.error?.message || 'Failed to set password');
                }
            } catch (error) {
                resultDiv.className = 'error';
                resultDiv.textContent = '❌ Network error: ' + error.message;
            }
        }
    </script>
</body>
</html>
```

**To use this:**
1. Save the HTML file
2. Log in as super admin in your browser
3. Open the HTML file in the same browser
4. Enter your password and click the button

---

## Quick One-Liner (Browser Console)

If you just want to set it quickly, log in as super admin, open console, and paste this (replace the password):

```javascript
fetch('http://localhost:5000/api/v1/admin/settings/financial-password/set', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('aela.auth.tokens'))?.accessToken}`
  },
  body: JSON.stringify({ password: 'YOUR_PASSWORD_HERE' })
}).then(r => r.json()).then(console.log).catch(console.error);
```

---

## Important Notes

1. **Password Requirements:**
   - Minimum 6 characters
   - Choose a strong, secure password
   - Don't share this password with unauthorized users

2. **Security:**
   - The password is hashed with bcrypt before storage
   - Only super admins can set/change the password
   - You need to be authenticated to make this API call

3. **Testing:**
   - After setting the password, try accessing `/super-admin/payments` or `/super-admin/expenses`
   - You should be prompted for the financial password

4. **Changing Password:**
   - Use the same method to change the password
   - The new password will replace the old one

---

## Troubleshooting

**Error: "UNAUTHORIZED"**
- Make sure you're logged in as super admin
- Check that your access token is valid
- Try logging out and logging back in

**Error: "FORBIDDEN"**
- You must be a super-admin user
- Check your user role in the database

**Error: "Network error"**
- Check that your backend server is running
- Verify the API URL is correct
- Check CORS settings if using different domains

**Password not working after setting:**
- Make sure you're using the exact password you set
- Clear browser cache and try again
- Check that the password was saved successfully (check the API response)


