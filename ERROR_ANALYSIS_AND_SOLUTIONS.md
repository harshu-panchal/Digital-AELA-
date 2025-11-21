# Deep Analysis: React Error #310 and RTP Capabilities Timeout

## Error Summary

You're experiencing two critical errors:

1. **React Error #310**: Minified React error indicating hooks order violation
2. **WebRTC Timeout Error**: "Timeout waiting for RTP capabilities" when setting up as listener

---

## Root Cause Analysis

### 1. React Error #310 - Hooks Order Violation

**What is React Error #310?**
React Error #310 occurs when the number or order of hooks called during a render changes between renders. React relies on hooks being called in the same order every time to maintain state correctly.

**Why it happened in your code:**

The issue was in `frontend/src/hooks/useWebRTC.js`:

1. **Conditional Hook Dependencies**: Multiple `useEffect` hooks were calling `cleanupAll()` conditionally but not including it in their dependency arrays (using `eslint-disable-next-line react-hooks/exhaustive-deps`).

2. **Inconsistent Hook Execution**: 
   - Line 722: `useEffect` for reconnection called `cleanupAll()` but didn't include it in dependencies
   - Line 730: Conditional call to `cleanupAll()` inside auto-setup effect
   - Line 759: Another conditional call to `cleanupAll()`
   - Line 801: Call to `cleanupAll()` in unmount effect without proper dependencies

3. **The Problem**: When React re-renders, if the conditions change, different code paths execute, potentially calling different numbers of hooks or in different orders, causing React to lose track of hook state.

**Solution Applied:**
- ✅ Added `cleanupAll` to all `useEffect` dependency arrays where it's used
- ✅ Removed `eslint-disable-next-line` comments that were hiding the issue
- ✅ Ensured all hooks are called unconditionally at the top level
- ✅ Made sure cleanup functions are properly included in dependencies

---

### 2. WebRTC Timeout - "Timeout waiting for RTP capabilities"

**What is this error?**
The WebRTC setup process waits for RTP (Real-time Transport Protocol) capabilities from the server to initialize the mediasoup device. If these capabilities don't arrive within 10 seconds, the setup fails.

**Why it happened:**

**Critical Race Condition:**

1. **Timeline of the bug:**
   ```
   T0: VoiceRoom.jsx calls joinVoiceRoom()
   T1: socket.emit("join-voice-room", { roomId, role }) is sent
   T2: Backend immediately processes and emits "voice-room-joined" with RTP capabilities
   T3: useWebRTC hook's auto-setup effect runs
   T4: setupAsListener() is called
   T5: waitForRtpCapabilities() sets up listener for "voice-room-joined"
   T6: Listener waits 10 seconds... but event already came at T2!
   T7: Timeout after 10 seconds → Error
   ```

2. **The Problem:**
   - Backend emits `voice-room-joined` **immediately** after receiving `join-voice-room` (line 552 in `backend/src/config/socket.js`)
   - Frontend sets up listener **after** the emit happens
   - Event arrives before listener is ready → event is lost
   - `waitForRtpCapabilities()` waits 10 seconds for an event that already came and went

3. **Additional Issues:**
   - `waitForRtpCapabilities()` checked for already-received capabilities, but the check happened AFTER setting up the listener
   - No persistent listener was set up before emitting `join-voice-room`
   - RTP capabilities weren't stored immediately when received

**Solution Applied:**
- ✅ Created a **persistent listener** for `voice-room-joined` that's set up BEFORE `join-voice-room` is emitted
- ✅ The persistent listener stores RTP capabilities immediately when received
- ✅ `waitForRtpCapabilities()` now checks for already-received capabilities FIRST (before waiting)
- ✅ Added polling mechanism as backup to check for capabilities every 100ms
- ✅ Properly reset RTP capabilities when roomId changes

---

## Complete Solutions Implemented

### Solution 1: Fixed React Hooks Order (Error #310)

**File**: `frontend/src/hooks/useWebRTC.js`

**Changes:**
1. Added `cleanupAll` to dependency arrays in all `useEffect` hooks that use it
2. Removed `eslint-disable-next-line react-hooks/exhaustive-deps` comments
3. Ensured consistent hook execution order

**Code Changes:**
```javascript
// Before (line 722):
}, [socket]); // Remove cleanupAll from dependencies

// After:
}, [socket, cleanupAll]); // Include cleanupAll to fix React hooks order
```

```javascript
// Before (line 791):
}, [socket, roomId, role]); // setupAsSpeaker, setupAsListener, cleanupAll are stable with useCallback

// After:
}, [socket, roomId, role, cleanupAll, setupAsSpeaker, setupAsListener]); // Include all dependencies
```

### Solution 2: Fixed RTP Capabilities Race Condition

**File**: `frontend/src/hooks/useWebRTC.js`

**Changes:**
1. Added persistent listener effect that runs BEFORE join-voice-room is emitted
2. Listener stores RTP capabilities immediately when received
3. Improved `waitForRtpCapabilities()` to check for already-received capabilities first
4. Added polling mechanism as backup

**New Code:**
```javascript
// Persistent listener (runs early, before join-voice-room)
useEffect(() => {
  if (!socket || !roomId) return;
  
  const handler = (data) => {
    if (data.roomId === roomId && data.rtpCapabilities) {
      rtpCapabilitiesRef.current = data.rtpCapabilities;
      rtpCapabilitiesReceivedRef.current = true;
      console.log("[WebRTC] RTP capabilities received via persistent listener");
    }
  };
  
  socket.on("voice-room-joined", handler);
  return () => socket.off("voice-room-joined", handler);
}, [socket, roomId]);

// Improved waitForRtpCapabilities
const waitForRtpCapabilities = useCallback(async () => {
  // Check FIRST (before waiting)
  if (rtpCapabilitiesReceivedRef.current && rtpCapabilitiesRef.current) {
    return rtpCapabilitiesRef.current;
  }
  
  // Wait with polling backup
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout...")), 10000);
    const checkInterval = setInterval(() => {
      if (rtpCapabilitiesReceivedRef.current && rtpCapabilitiesRef.current) {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        resolve(rtpCapabilitiesRef.current);
      }
    }, 100);
    // ... cleanup
  });
}, [roomId]);
```

---

## Testing the Fixes

### Test 1: React Error #310
1. Open browser console
2. Navigate to a voice room
3. Check console - should NOT see React Error #310
4. Try leaving and rejoining the room multiple times
5. Verify no hooks order errors

### Test 2: RTP Capabilities Timeout
1. Open browser console
2. Navigate to a voice room as a listener
3. Check console logs:
   - Should see: `[WebRTC] RTP capabilities received via persistent listener`
   - Should NOT see: `Timeout waiting for RTP capabilities`
4. Verify connection state shows "Connected" (not "Error")

### Test 3: Race Condition Prevention
1. Open browser console
2. Navigate to a voice room
3. Check timing in logs:
   - Persistent listener should be set up BEFORE join-voice-room is emitted
   - RTP capabilities should be received immediately
   - No 10-second wait

---

## Additional Recommendations

### 1. Backend Optimization (Optional)
Consider adding a small delay before emitting `voice-room-joined` to ensure frontend listeners are ready:
```javascript
// In backend/src/config/socket.js
await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
socket.emit("voice-room-joined", { ... });
```
**Note**: This is not necessary with the persistent listener fix, but could be a backup.

### 2. Error Handling
Add retry logic for RTP capabilities timeout:
```javascript
// In waitForRtpCapabilities, add retry:
let retries = 0;
while (retries < 3) {
  try {
    return await waitForRtpCapabilities();
  } catch (error) {
    if (retries === 2) throw error;
    retries++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### 3. Monitoring
Add metrics to track:
- How often RTP capabilities timeout occurs
- Average time to receive RTP capabilities
- Connection success rate

---

## Summary

**Fixed Issues:**
1. ✅ React Error #310 - Fixed hooks order violation by including all dependencies
2. ✅ RTP Capabilities Timeout - Fixed race condition with persistent listener

**Key Improvements:**
- Persistent listener ensures we never miss the `voice-room-joined` event
- Proper dependency arrays prevent React hooks order violations
- Better error handling and logging
- Proper cleanup and state management

**Files Modified:**
- `frontend/src/hooks/useWebRTC.js` - Fixed hooks order and race condition

The fixes ensure that:
1. React hooks are always called in the same order
2. RTP capabilities are captured immediately when received
3. No race conditions between backend emission and frontend listener setup
4. Proper cleanup and state management

---

## If Issues Persist

If you still see these errors after the fixes:

1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Check backend logs** to ensure `voice-room-joined` is being emitted
3. **Verify socket connection** - ensure socket is connected before joining
4. **Check network tab** - verify WebSocket connection is stable
5. **Review console logs** - look for timing issues in the logs

For React Error #310 specifically:
- Check if any other components are conditionally calling hooks
- Verify all custom hooks follow React hooks rules
- Check for any third-party libraries that might be causing issues

For RTP Capabilities timeout:
- Verify backend is running and accessible
- Check if mediasoup router is being created correctly
- Verify TURN/STUN server configuration if using WebRTC
- Check network connectivity and firewall settings

