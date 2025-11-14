# Super Admin Setup Guide

## Method 1: Using the Script (Recommended)

1. **Make sure your `.env` file has `MONGODB_URI` set:**
   ```
   MONGODB_URI=mongodb://localhost:27017/digital-aela
   # or your MongoDB Atlas connection string
   ```

2. **Run the script:**
   ```bash
   cd backend
   npm run create-admin
   ```

3. **Default credentials will be:**
   - Email: `admin@digitalaela.com`
   - Password: `admin123`

4. **Access the admin login:**
   - Go to: `http://localhost:5173/admin/login`
   - Login with the credentials above
   - You'll be redirected to `/super-admin` dashboard

## Method 2: Using MongoDB Compass (GUI)

1. **Open MongoDB Compass** and connect to your database

2. **Navigate to your database** (e.g., `digital-aela`)

3. **Select the `users` collection**

4. **Click "Insert Document"**

5. **Paste this document** (you'll need to hash the password first - see Method 3 for password hash):
   ```json
   {
     "email": "admin@digitalaela.com",
     "passwordHash": "YOUR_BCRYPT_HASHED_PASSWORD_HERE",
     "fullName": "Super Admin",
     "role": "super-admin",
     "isActive": true,
     "createdAt": new Date(),
     "updatedAt": new Date()
   }
   ```

## Method 3: Using MongoDB Shell (mongosh)

1. **Connect to MongoDB:**
   ```bash
   mongosh "your-mongodb-connection-string"
   ```

2. **Switch to your database:**
   ```javascript
   use digital-aela
   ```

3. **Generate password hash** (you'll need Node.js for this):
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 12).then(hash => console.log(hash));"
   ```
   Copy the hash that's printed.

4. **Insert the user:**
   ```javascript
   db.users.insertOne({
     email: "admin@digitalaela.com",
     passwordHash: "PASTE_THE_HASH_FROM_STEP_3",
     fullName: "Super Admin",
     role: "super-admin",
     isActive: true,
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

## Method 4: Using API Registration

1. **Make sure backend server is running:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Register via API:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@digitalaela.com",
       "password": "your-secure-password",
       "fullName": "Super Admin",
       "role": "super-admin"
     }'
   ```

   Or use Postman/Thunder Client:
   - URL: `POST http://localhost:5000/api/v1/auth/register`
   - Body:
     ```json
     {
       "email": "admin@digitalaela.com",
       "password": "your-secure-password",
       "fullName": "Super Admin",
       "role": "super-admin"
     }
     ```

## After Creating the Account

1. **Go to admin login page:**
   - URL: `http://localhost:5173/admin/login`

2. **Login with your credentials**

3. **You'll be redirected to:** `http://localhost:5173/super-admin`

## Security Notes

⚠️ **Important:**
- Change the default password after first login
- Use a strong password in production
- Never commit passwords or `.env` files to version control
- The script uses `admin123` as default - change it in the script or update it after creation

