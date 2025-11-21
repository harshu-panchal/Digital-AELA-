# Complete Metered TURN Setup & Testing Guide

This guide will walk you through setting up Metered TURN and testing your voice room functionality step-by-step.

---

## Part 1: Sign Up for Metered TURN (5 minutes)

### Step 1: Create Account

1. **Open your browser** and go to: https://www.metered.ca/

2. **Click "Sign Up"** (top right corner)

3. **Fill in the form:**

   - Email address
   - Password (choose a strong one)
   - Confirm password

4. **Click "Create Account"**

5. **Check your email** for verification link
   - Click the verification link in the email
   - You'll be redirected to the dashboard

### Step 2: Get Your TURN Server Credentials

1. **After logging in**, you'll see the dashboard

2. **Look for "TURN Servers"** in the left sidebar (or main menu)

   - Click on it

3. **You'll see your TURN server details:**

   - **Server URL**: Something like `turn:your-domain.metered.ca:443`
   - **Username**: Auto-generated username
   - **Password**: Auto-generated password

4. **Copy these three values** - you'll need them in the next step
   - Write them down or keep the tab open

**Example of what you'll see:**

```
Server URL: turn:your-account.metered.ca:443
Username: your-username-here
Password: your-password-here
```

---

## Part 2: Configure Your Backend (2 minutes)

### Step 1: Locate Your .env File

1. **Navigate to your backend folder:**

   ```bash
   cd backend
   ```

2. **Open the `.env` file:**
   - If using VS Code: Right-click `.env` → Open
   - If using terminal: `nano .env` or `code .env`

### Step 2: Add TURN Server Configuration

1. **Add these lines to your `.env` file:**

   ```env
   # TURN Server Configuration (Metered TURN)
   TURN_SERVER_URL=turn:your-account.metered.ca:443
   TURN_SERVER_USERNAME=your-username-here
   TURN_SERVER_CREDENTIAL=your-password-here
   ```

2. **Replace the values:**

   - `turn:your-account.metered.ca:443` → Your actual Server URL from Metered dashboard
   - `your-username-here` → Your actual Username from Metered dashboard
   - `your-password-here` → Your actual Password from Metered dashboard

3. **Important:**

   - No spaces around the `=` sign
   - No quotes needed
   - Keep the `turn:` prefix in the URL

4. **Save the file**

### Step 3: Verify .env File Format

Your `.env` should look something like this:

```env
# Other existing variables...
PORT=5000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret

# TURN Server Configuration (Metered TURN)
TURN_SERVER_URL=turn:abc123.metered.ca:443
TURN_SERVER_USERNAME=user_abc123xyz
TURN_SERVER_CREDENTIAL=pass_xyz789abc
```

---

## Part 3: Restart Your Backend Server

### Step 1: Stop Your Current Server

If your backend is running, stop it:

- Press `Ctrl + C` in the terminal where it's running
- Or if using PM2: `pm2 stop all`

### Step 2: Start Your Backend Server

```bash
# Navigate to backend folder
cd backend

# Start the server
npm start

# Or if using nodemon for development
npm run dev
```

### Step 3: Verify Server Started Successfully

Look for these messages in the console:

```
[Server] Listening on port 5000
[Socket.IO] Server initialized
[mediasoup] Creating 2 workers...
[mediasoup] Worker created [pid:12345]
[mediasoup] 2 workers created
```

**If you see errors**, check:

1. `.env` file format is correct
2. No typos in the TURN server credentials
3. All required environment variables are set

---

## Part 4: Test TURN Server Connection

### Test 1: Browser-Based Test (Recommended)

1. **Open your browser** and go to:

   ```
   https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
   ```

2. **Click "Add Server"** button

3. **Fill in the form:**

   - **STUN or TURN URI**: Your `TURN_SERVER_URL` from `.env`
     - Example: `turn:abc123.metered.ca:443`
   - **TURN username**: Your `TURN_SERVER_USERNAME` from `.env`
   - **TURN password**: Your `TURN_SERVER_CREDENTIAL` from `.env`

4. **Click "Add"**

5. **Click "Gather candidates"** button

6. **Check the results:**
   - ✅ **SUCCESS**: You see candidates with type "relay" (these are TURN)
   - ✅ **ALSO GOOD**: You see "srflx" (STUN reflexive) candidates
   - ❌ **FAILED**: Only "host" candidates (TURN not working)

**Expected successful output:**

```
host 192.168.1.100:54321 (your local IP)
srflx 123.45.67.89:54322 (your public IP via STUN)
relay 203.0.113.1:54323 (TURN relay server) ← This is what we want!
```

---

## Part 5: Test Voice Room Functionality

### Step 1: Start Your Application

1. **Start backend** (if not already running):

   ```bash
   cd backend
   npm start
   ```

2. **Start frontend** (in a new terminal):

   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your application** in browser:
   - Usually: `http://localhost:5173` (Vite default)
   - Or whatever port your frontend uses

### Step 2: Test Voice Room Join

1. **Login to your application**

2. **Navigate to Learn & Earn → Live Debates**

3. **Create or join a voice room:**

   - Click "Join Voice Room" on any open room
   - Or create a new debate room

4. **Check browser console** (F12 → Console tab):
   - Look for WebRTC connection messages
   - Should see mediasoup device initialization
   - Should see transport creation

### Step 3: Test as Speaker

1. **Join a room as host or speaker**

2. **Allow microphone permission** when prompted

3. **Check console for:**

   ```
   [WebRTC] Device loaded
   [WebRTC] Send transport created
   [WebRTC] Producer created
   ```

4. **Speak into your microphone**
   - You should see audio levels (if UI shows them)
   - Other participants should hear you

### Step 4: Test as Listener

1. **Join a room as listener** (or have another user join)

2. **Check console for:**

   ```
   [WebRTC] Device loaded
   [WebRTC] Recv transport created
   [WebRTC] Consumer created
   ```

3. **You should hear speakers** if they're talking

### Step 5: Test Multiple Users

1. **Open multiple browser windows/tabs**

   - Or use different devices
   - Or have friends join

2. **Join the same room:**

   - One as host/speaker
   - Others as listeners

3. **Verify:**
   - ✅ Speakers can talk
   - ✅ Listeners can hear
   - ✅ Multiple listeners can hear the same speaker
   - ✅ Request to speak works
   - ✅ Host mute/unmute works

---

## Part 6: Verify TURN Server is Being Used

### Check Backend Logs

1. **Look at your backend console** for messages like:

   ```
   [mediasoup] Transport created for room abc123
   [mediasoup] Producer created for socket xyz789
   ```

2. **Check for TURN server usage:**
   - If users are behind NATs, TURN will be used automatically
   - mediasoup handles this transparently

### Check Metered Dashboard

1. **Go back to Metered dashboard**

2. **Check "Usage" or "Statistics" section**

3. **You should see:**
   - Data usage increasing as people use voice rooms
   - Connection attempts
   - Active connections

---

## Part 7: Troubleshooting

### Issue: "Authentication failed" in browser test

**Solution:**

1. Double-check username and password in `.env`
2. Make sure no extra spaces
3. Verify credentials in Metered dashboard
4. Restart backend after changing `.env`

### Issue: No "relay" candidates in browser test

**Solution:**

1. Check TURN server URL format: `turn:domain.com:443` (not `turn://`)
2. Verify port is correct (usually 443 for Metered)
3. Check firewall isn't blocking (shouldn't be issue with managed service)
4. Try different browser

### Issue: Voice room not connecting

**Solution:**

1. Check browser console for errors
2. Check backend console for errors
3. Verify `.env` variables are loaded:
   ```bash
   # In backend folder
   node -e "require('dotenv').config(); console.log(process.env.TURN_SERVER_URL)"
   ```
4. Verify socket connection is working
5. Check microphone permissions in browser

### Issue: Can't hear audio

**Solution:**

1. Check browser audio permissions
2. Check system volume
3. Verify microphone is working (test in other apps)
4. Check if producer/consumer are created (console logs)
5. Try different browser

### Issue: Backend errors on startup

**Solution:**

1. Check `.env` file syntax (no quotes, no spaces around `=`)
2. Verify all required variables are set
3. Check Node.js version (should be 18+)
4. Reinstall dependencies: `npm install`

---

## Part 8: Success Checklist

After setup, verify these work:

- [ ] Metered TURN account created
- [ ] Credentials added to `.env` file
- [ ] Backend server starts without errors
- [ ] Browser test shows "relay" candidates
- [ ] Can join voice room
- [ ] Microphone permission works
- [ ] Can speak as host/speaker
- [ ] Can hear audio as listener
- [ ] Multiple users can join same room
- [ ] Request to speak works
- [ ] Host mute/unmute works
- [ ] Metered dashboard shows usage

---

## Part 9: Next Steps After Testing

### If Everything Works:

1. ✅ **You're done!** Your voice rooms now work with TURN server
2. Monitor usage in Metered dashboard
3. Set up billing alerts if needed
4. Consider upgrading plan if you exceed free tier

### If Something Doesn't Work:

1. Check the troubleshooting section above
2. Review browser console errors
3. Review backend console errors
4. Check Metered dashboard for connection issues
5. Verify `.env` file one more time

---

## Quick Reference Commands

```bash
# Check if .env variables are loaded
cd backend
node -e "require('dotenv').config(); console.log('TURN URL:', process.env.TURN_SERVER_URL)"

# Restart backend
npm restart
# Or
pm2 restart all

# Check backend logs
# Look at terminal where backend is running
# Or if using PM2: pm2 logs

# Test TURN server (browser)
# Go to: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
```

---

## Support Resources

- **Metered Support**: support@metered.ca
- **Metered Docs**: https://www.metered.ca/docs
- **Browser Test Tool**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- **Your Backend Logs**: Check terminal where server is running

---

## Ready to Start?

1. ✅ Sign up at https://www.metered.ca/
2. ✅ Get credentials from dashboard
3. ✅ Add to `.env` file
4. ✅ Restart backend
5. ✅ Test in browser
6. ✅ Test voice room functionality

**Let me know when you've completed these steps and we'll test together!** 🚀
