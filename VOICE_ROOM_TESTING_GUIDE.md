# Complete Voice Room Testing Guide

Step-by-step guide to test your voice room feature with Metered TURN server.

---

## Prerequisites Checklist

Before testing, make sure:

- [ ] Metered TURN credentials added to `backend/.env`
- [ ] Backend server is running
- [ ] Frontend server is running
- [ ] You're logged into the application
- [ ] Microphone permissions enabled in browser

---

## Part 1: Verify TURN Server Connection (2 minutes)

### Step 1: Test TURN Server in Browser

1. **Open a new browser tab**

2. **Go to WebRTC Test Tool:**

   ```
   https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
   ```

3. **Click "Add Server" button**

4. **Enter your TURN credentials:**

   - **STUN or TURN URI**: Your `TURN_SERVER_URL` from `.env`
     - Example: `turn:abc123.metered.ca:443`
   - **TURN username**: Your `TURN_SERVER_USERNAME` from `.env`
   - **TURN password**: Your `TURN_SERVER_CREDENTIAL` from `.env`

5. **Click "Add"**

6. **Click "Gather candidates" button**

7. **Check the results:**
   - ✅ **SUCCESS**: You see candidates with type **"relay"** (TURN is working!)
   - ✅ **ALSO GOOD**: You see **"srflx"** (STUN reflexive) candidates
   - ❌ **FAILED**: Only **"host"** candidates (TURN not working)

**Expected successful output:**

```
host 192.168.1.100:54321 udp
srflx 123.45.67.89:54322 udp
relay 203.0.113.1:54323 udp  ← This confirms TURN is working!
```

**If you see "relay" candidates, your TURN server is working! ✅**

---

## Part 2: Start Your Application (1 minute)

### Step 1: Start Backend

1. **Open terminal/command prompt**

2. **Navigate to backend folder:**

   ```bash
   cd backend
   ```

3. **Start the server:**

   ```bash
   npm start
   # Or if using nodemon:
   npm run dev
   ```

4. **Wait for these messages:**

   ```
   [Server] Listening on port 5000
   [Socket.IO] Server initialized
   [mediasoup] Creating 2 workers...
   [mediasoup] Worker created [pid:12345]
   [mediasoup] 2 workers created
   ```

5. **If you see errors**, check:
   - `.env` file has correct TURN credentials
   - No typos in environment variables
   - Port 5000 is not already in use

### Step 2: Start Frontend

1. **Open a NEW terminal/command prompt** (keep backend running)

2. **Navigate to frontend folder:**

   ```bash
   cd frontend
   ```

3. **Start the frontend:**

   ```bash
   npm run dev
   ```

4. **Wait for:**

   ```
   VITE ready in XXX ms
   ➜  Local:   http://localhost:5173/
   ```

5. **Note the URL** (usually `http://localhost:5173`)

---

## Part 3: Test Basic Voice Room Join (3 minutes)

### Step 1: Open Application

1. **Open your browser**

2. **Go to your frontend URL:**

   - Usually: `http://localhost:5173`
   - Or whatever port Vite shows

3. **Login to your application**

### Step 2: Navigate to Voice Rooms

1. **Go to "Learn & Earn" section**

   - Click on "Learn & Earn" in navigation

2. **Click on "Live Debates"**

   - Or navigate to `/learn-earn/live-debates`

3. **You should see:**
   - List of debate rooms
   - "Open discussion rooms"
   - "Create Debate" button

### Step 3: Join a Voice Room

1. **Find a room with status "live"**

   - Look for rooms showing "Join Voice Room" button

2. **Click "Join Voice Room"**

3. **You should be redirected to:**

   - `/learn-earn/voice-room/[roomId]`

4. **Check what you see:**
   - Room title and description
   - Speakers section
   - Listeners section
   - Your controls section

### Step 4: Check Browser Console

1. **Open browser developer tools:**

   - Press `F12` or `Right-click → Inspect`

2. **Go to "Console" tab**

3. **Look for these messages:**

   ```
   [Socket.IO] Connected
   [WebRTC] Device loaded
   [WebRTC] Recv transport created (if listener)
   [WebRTC] Send transport created (if speaker)
   ```

4. **Check for errors:**
   - ❌ Red error messages = something wrong
   - ✅ No errors = good!

---

## Part 4: Test as Listener (5 minutes)

### Step 1: Join as Listener

1. **If you're not already in a room, join one**

2. **Your role should be "listener"** (unless you're host/speaker)

3. **You should see:**
   - "Request to Speak" button in "Your Controls" section
   - List of speakers (if any)
   - List of listeners (including you)

### Step 2: Check Audio Reception

1. **If there are speakers talking:**

   - You should hear their audio
   - Check your system volume
   - Check browser volume (tab sound icon)

2. **Check console for:**

   ```
   [WebRTC] Consumer created
   [WebRTC] Remote stream received
   ```

3. **Verify:**
   - ✅ Can see speakers in the list
   - ✅ Can hear audio (if speakers are talking)
   - ✅ No console errors

### Step 3: Test Request to Speak

1. **Click "Request to Speak" button**

2. **You should see:**

   - Button changes to "Request Pending"
   - Toast notification: "Request to speak sent"

3. **Check console:**

   ```
   Speak request sent
   ```

4. **Wait for approval** (if host/speaker is online)

---

## Part 5: Test as Speaker/Host (5 minutes)

### Step 1: Create or Join as Host

**Option A: Create New Room**

1. Go to "Live Debates" page
2. Click "Create Debate"
3. Fill in:
   - Title: "Test Room"
   - Topic: "Testing Voice Feature"
   - Description: "Testing"
4. Click "Create Debate"
5. Join the room you just created

**Option B: Join Existing Room as Host**

- If you created the room, you'll automatically be host

### Step 2: Allow Microphone Permission

1. **When you join as host/speaker:**

   - Browser will ask for microphone permission
   - Click "Allow" or "Yes"

2. **If permission denied:**
   - Check browser settings
   - Go to site settings → Microphone → Allow

### Step 3: Test Speaking

1. **You should see:**

   - "Mic On/Off" button in "Your Controls"
   - Your name in "Speakers" section
   - Green indicator showing "Speaking"

2. **Click "Mic On"** (if not already on)

3. **Speak into your microphone:**

   - Say "Testing, testing, one two three"
   - Check if mic icon shows activity

4. **Check console for:**

   ```
   [WebRTC] Local stream initialized
   [WebRTC] Producer created
   [WebRTC] Send transport connected
   ```

5. **Verify:**
   - ✅ Mic button shows "Mic On"
   - ✅ Your name appears in speakers list
   - ✅ No console errors

### Step 4: Test Mute/Unmute

1. **Click "Mic Off" button**

2. **You should see:**

   - Button changes to "Mic Off"
   - Mic icon changes to muted icon

3. **Click "Mic On" again**

4. **You should see:**

   - Button changes back to "Mic On"
   - Mic icon changes back

5. **Verify:**
   - ✅ Toggle works smoothly
   - ✅ No errors in console

---

## Part 6: Test with Multiple Users (10 minutes)

### Step 1: Open Multiple Browser Windows

1. **Open a second browser window** (or use incognito/private mode)

2. **Or use a different browser:**

   - Chrome for one user
   - Firefox/Edge for another

3. **Or use a different device:**
   - Computer for one user
   - Phone/tablet for another

### Step 2: Setup Two Users

**User 1 (Host/Speaker):**

1. Login as host user
2. Join/create a voice room
3. Allow microphone
4. Start speaking

**User 2 (Listener):**

1. Login as different user (or guest)
2. Join the same room
3. Should see User 1 in speakers list
4. Should hear User 1's audio

### Step 3: Test Audio Flow

1. **User 1 (Speaker) speaks:**

   - "Can you hear me?"
   - "Testing audio"

2. **User 2 (Listener) should:**

   - ✅ Hear User 1's voice
   - ✅ See User 1 in speakers list
   - ✅ See audio activity indicator

3. **User 2 requests to speak:**

   - Click "Request to Speak"
   - User 1 should see the request

4. **User 1 approves:**

   - Click "Approve" (✓) button
   - User 2 should become speaker

5. **User 2 speaks:**
   - Should now be able to talk
   - User 1 should hear User 2

### Step 4: Test Multiple Listeners

1. **Open 3-4 browser windows**

2. **Join same room:**

   - 1 as host/speaker
   - 2-3 as listeners

3. **Verify:**
   - ✅ All listeners can hear the speaker
   - ✅ All listeners see each other in listeners list
   - ✅ Speaker count is correct
   - ✅ Listener count is correct

---

## Part 7: Test Host Controls (5 minutes)

### Step 1: Test Mute Participant

1. **As host, you should see:**

   - Mute button (microphone with slash) next to each speaker
   - Except yourself

2. **Click mute button** on a speaker

3. **You should see:**

   - Speaker's status changes to "Muted"
   - Red indicator appears
   - Speaker receives notification: "You have been muted by the host"

4. **Verify:**
   - ✅ Speaker can't speak (even if their mic is on)
   - ✅ Status updates in real-time
   - ✅ Other participants see the mute status

### Step 2: Test Unmute Participant

1. **Click unmute button** (same button, now shows unmute icon)

2. **You should see:**

   - Speaker's status changes back to "Speaking"
   - Green indicator appears
   - Speaker receives notification: "You have been unmuted by the host"

3. **Verify:**
   - ✅ Speaker can speak again
   - ✅ Status updates correctly

### Step 3: Test Speak Request Approval

1. **As listener, request to speak**

2. **As host, you should see:**

   - Request appears in "Speak Requests" section
   - Shows requester's name
   - Approve (✓) and Reject (✗) buttons

3. **Click Approve (✓)**

4. **Verify:**
   - ✅ Listener becomes speaker
   - ✅ Request disappears from list
   - ✅ New speaker appears in speakers section
   - ✅ New speaker can now talk

### Step 4: Test Speak Request Rejection

1. **As listener, request to speak again**

2. **As host, click Reject (✗)**

3. **Verify:**
   - ✅ Request disappears
   - ✅ Listener remains as listener
   - ✅ Listener receives notification: "Your request to speak was rejected"

---

## Part 8: Test Edge Cases (5 minutes)

### Test 1: Leave and Rejoin

1. **Join a room**

2. **Click "Leave Room"**

3. **Verify:**

   - ✅ Redirected to Live Debates page
   - ✅ No console errors
   - ✅ Transport cleaned up

4. **Rejoin the same room**

5. **Verify:**
   - ✅ Can join again
   - ✅ Audio works again

### Test 2: Network Disconnection

1. **Join a room**

2. **Disconnect internet** (turn off WiFi for 5 seconds)

3. **Reconnect internet**

4. **Verify:**
   - ✅ Socket reconnects automatically
   - ✅ Audio reconnects
   - ✅ No errors

### Test 3: Multiple Rooms

1. **Join Room 1**

2. **Open new tab, join Room 2**

3. **Verify:**
   - ✅ Can be in multiple rooms
   - ✅ Audio works in both
   - ✅ No conflicts

### Test 4: Browser Refresh

1. **Join a room and start speaking**

2. **Refresh the page** (F5)

3. **Verify:**
   - ✅ Rejoins automatically
   - ✅ Audio reconnects
   - ✅ No memory leaks

---

## Part 9: Verify Backend Logs

### Check Backend Console

1. **Look at your backend terminal**

2. **You should see:**

   ```
   [Socket.IO] User connected: userId (UserName)
   [mediasoup] Router created for room abc123
   [mediasoup] Transport created for socket xyz789
   [mediasoup] Producer created for socket xyz789
   [mediasoup] Consumer created for socket abc456
   ```

3. **Check for errors:**
   - ❌ Red error messages = investigate
   - ✅ Normal logs = working correctly

---

## Part 10: Success Checklist

After testing, verify all these work:

### Basic Functionality

- [ ] Can join voice room
- [ ] Can see room participants
- [ ] Socket connection works
- [ ] No console errors

### As Listener

- [ ] Can hear speakers
- [ ] Can request to speak
- [ ] See request status updates
- [ ] Audio quality is good

### As Speaker

- [ ] Microphone permission works
- [ ] Can speak and be heard
- [ ] Mute/unmute works
- [ ] Audio quality is good

### As Host

- [ ] Can mute/unmute participants
- [ ] Can approve/reject speak requests
- [ ] See all participants
- [ ] Controls work correctly

### Multi-User

- [ ] Multiple listeners can hear speaker
- [ ] Multiple speakers can talk
- [ ] Real-time updates work
- [ ] No audio conflicts

### Edge Cases

- [ ] Leave/rejoin works
- [ ] Network reconnection works
- [ ] Browser refresh works
- [ ] No memory leaks

---

## Troubleshooting Common Issues

### Issue: Can't hear audio

**Solutions:**

1. Check system volume
2. Check browser tab volume (click speaker icon on tab)
3. Check microphone permissions
4. Verify speakers/headphones are connected
5. Check console for errors

### Issue: Microphone not working

**Solutions:**

1. Check browser permissions (Settings → Privacy → Microphone)
2. Check if mic is being used by another app
3. Test mic in other applications
4. Check console for permission errors

### Issue: Can't join room

**Solutions:**

1. Check backend is running
2. Check socket connection (console should show "Connected")
3. Check room exists and is "live"
4. Check network connection

### Issue: TURN server not working

**Solutions:**

1. Verify `.env` credentials are correct
2. Test TURN server in browser (Part 1)
3. Check Metered dashboard for usage/errors
4. Verify no typos in credentials

### Issue: Console errors

**Solutions:**

1. Check error message details
2. Verify all environment variables are set
3. Check backend logs for more details
4. Restart both frontend and backend

---

## Next Steps After Testing

If everything works:

1. ✅ **You're done!** Voice rooms are working with TURN server
2. Monitor Metered dashboard for usage
3. Test with real users
4. Monitor for any issues

If something doesn't work:

1. Check troubleshooting section
2. Review console errors
3. Check backend logs
4. Verify TURN server connection
5. Test TURN server separately (Part 1)

---

## Quick Test Summary

**Minimum test (5 minutes):**

1. Test TURN server in browser
2. Join voice room
3. Test as listener (hear audio)
4. Test as speaker (speak)

**Full test (20 minutes):**

1. All of above
2. Test with multiple users
3. Test host controls
4. Test edge cases

**Ready to start testing? Begin with Part 1!** 🚀
