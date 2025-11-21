<!-- 94ef566d-ecd5-4c2d-9341-6425fcbbcfd3 d79c0338-4e3d-4522-83d6-233390a827f4 -->
# Voice Chat Feature - Comprehensive Fix Plan

## Current Flow Analysis

### Join Flow (Current):

1. User loads VoiceRoom page → fetches room data
2. Auto-joins when socket connects → emits `join-voice-room`
3. Backend responds with `voice-room-joined` (includes RTP capabilities)
4. Frontend `useWebRTC` hook waits for `voice-room-joined` event
5. Initializes mediasoup device → creates transports → produces/consumes

### Critical Issues Identified:

#### 1. **Race Condition in useWebRTC Hook**

- **Problem**: Hook sets up listener for `voice-room-joined` AFTER emitting `join-voice-room`, but event may arrive before listener is ready
- **Location**: `frontend/src/hooks/useWebRTC.js:290-299`
- **Impact**: Users hang waiting for RTP capabilities, join fails silently

#### 2. **Missing Existing Producers Event**

- **Problem**: When listener joins, they don't receive list of existing producers
- **Location**: `backend/src/config/socket.js:join-voice-room` handler
- **Impact**: Listeners can't hear speakers who joined before them

#### 3. **No Error Event Handling**

- **Problem**: Frontend doesn't listen for `error` events from socket
- **Location**: `frontend/modules/learn-earn/pages/VoiceRoom.jsx`
- **Impact**: Users see no feedback when join fails

#### 4. **Incomplete Cleanup on Leave**

- **Problem**: `closeTransport` in mediasoupService doesn't properly clean up all resources
- **Location**: `backend/src/services/mediasoupService.js:closeTransport`
- **Impact**: Memory leaks, stale transports

#### 5. **No Timeout for Mediasoup Operations**

- **Problem**: If mediasoup fails, operations hang indefinitely
- **Location**: `frontend/src/hooks/useWebRTC.js`
- **Impact**: UI freezes, poor UX

#### 6. **Socket Reconnection Not Handled**

- **Problem**: When socket reconnects, mediasoup state is lost but not reinitialized
- **Location**: `frontend/src/hooks/useWebRTC.js`
- **Impact**: Users lose connection after reconnection

#### 7. **Missing Room Status Validation**

- **Problem**: Users can join rooms that are "ended" or not "live"
- **Location**: `backend/src/config/socket.js:join-voice-room`
- **Impact**: Users join dead rooms

#### 8. **Stale SocketId in Database**

- **Problem**: When user rejoins, old socketId remains in participants array
- **Location**: `backend/src/config/socket.js:join-voice-room`
- **Impact**: Speak requests go to wrong socket

#### 9. **No Retry Logic for Failed Operations**

- **Problem**: Failed transport creation, producer creation, etc. don't retry
- **Location**: Multiple locations
- **Impact**: Temporary failures cause permanent failures

#### 10. **Missing Error Callbacks**

- **Problem**: Socket emit callbacks don't always handle errors
- **Location**: `frontend/src/hooks/useWebRTC.js`
- **Impact**: Silent failures

## Fix Plan

### Phase 1: Critical Join Flow Fixes

#### Fix 1.1: Fix Race Condition in useWebRTC

- **File**: `frontend/src/hooks/useWebRTC.js`
- **Change**: Set up `voice-room-joined` listener BEFORE emitting `join-voice-room`, or use Promise with timeout
- **Details**: 
- Add timeout (10s) for RTP capabilities wait
- Store RTP capabilities in ref immediately when received
- Check if already received before waiting

#### Fix 1.2: Send Existing Producers to New Listeners

- **File**: `backend/src/config/socket.js`
- **Change**: In `join-voice-room` handler, after sending RTP capabilities, emit `existing-producers` event with all active producers
- **Details**:
- Get all producers from mediasoupService for the room
- Send producer IDs and metadata to new listener
- Frontend will consume these automatically

#### Fix 1.3: Add Error Event Handling

- **File**: `frontend/modules/learn-earn/pages/VoiceRoom.jsx`
- **Change**: Add socket listener for `error` events
- **Details**:
- Show toast notification
- Log error for debugging
- Handle specific error types (room not found, permission denied, etc.)

### Phase 2: Robustness Improvements

#### Fix 2.1: Add Timeout Wrapper for Mediasoup Operations

- **File**: `frontend/src/hooks/useWebRTC.js`
- **Change**: Wrap all mediasoup operations in timeout wrapper
- **Details**:
- Create `withTimeout` utility function
- Apply to device initialization, transport creation, producer/consumer creation
- Default timeout: 15 seconds

#### Fix 2.2: Handle Socket Reconnection

- **File**: `frontend/src/hooks/useWebRTC.js`
- **Change**: Listen for socket `reconnect` event and reinitialize mediasoup
- **Details**:
- Clean up existing resources
- Re-join voice room
- Re-setup transports and producers/consumers

#### Fix 2.3: Validate Room Status Before Join

- **File**: `backend/src/config/socket.js`
- **Change**: Check room status in `join-voice-room` handler
- **Details**:
- Reject join if room status is "ended"
- Reject if room status is "scheduled" and start time hasn't arrived
- Only allow join if status is "live"

### Phase 3: Cleanup and Resource Management

#### Fix 3.1: Complete Transport Cleanup

- **File**: `backend/src/services/mediasoupService.js`
- **Change**: Improve `closeTransport` and `removeSocketFromRoom` functions
- **Details**:
- Close all producers before closing transport
- Close all consumers before closing transport
- Remove from transports Map
- Handle errors gracefully

#### Fix 3.2: Fix Stale SocketId Issue

- **File**: `backend/src/config/socket.js`
- **Change**: Always update socketId in participants array when user rejoins
- **Details**:
- In `join-voice-room`, find participant by userId (not socketId)
- Update socketId even if participant already exists
- Update speakRequests socketId if user has pending request

### Phase 4: Error Handling and Retry Logic

#### Fix 4.1: Add Retry Logic for Critical Operations

- **File**: `frontend/src/hooks/useWebRTC.js`
- **Change**: Add retry wrapper for transport creation, producer creation
- **Details**:
- Retry up to 3 times with exponential backoff
- Only retry on network errors, not permission errors
- Show progress to user

#### Fix 4.2: Improve Error Callbacks

- **File**: `frontend/src/hooks/useWebRTC.js`
- **Change**: Ensure all socket.emit calls have error callbacks
- **Details**:
- Handle errors in create-transport, connect-transport, create-producer, create-consumer
- Show user-friendly error messages
- Log detailed errors for debugging

### Phase 5: Testing and Validation

#### Fix 5.1: Add Comprehensive Logging

- **Files**: All voice room related files
- **Change**: Add structured logging at key points
- **Details**:
- Log join attempts, successes, failures
- Log mediasoup operations
- Log socket events
- Use consistent log format: `[VoiceRoom] [Action] [Details]`

#### Fix 5.2: Add Connection State Indicators

- **File**: `frontend/modules/learn-earn/pages/VoiceRoom.jsx`
- **Change**: Show connection status to users
- **Details**:
- "Connecting..." when joining
- "Connected" when ready
- "Reconnecting..." on socket reconnect
- "Error" with retry button on failure

## Implementation Order

1. **Fix 1.1, 1.2, 1.3** (Critical join flow) - Must fix first
2. **Fix 2.1, 2.2, 2.3** (Robustness) - Prevents common failures
3. **Fix 3.1, 3.2** (Cleanup) - Prevents memory leaks
4. **Fix 4.1, 4.2** (Error handling) - Improves UX
5. **Fix 5.1, 5.2** (Logging/UI) - Helps debugging

## Files to Modify

1. `frontend/src/hooks/useWebRTC.js` - Major refactor for race conditions, timeouts, reconnection
2. `backend/src/config/socket.js` - Add existing-producers, room validation, socketId updates
3. `frontend/modules/learn-earn/pages/VoiceRoom.jsx` - Add error handling, connection status
4. `backend/src/services/mediasoupService.js` - Improve cleanup functions
5. `frontend/src/hooks/useSocket.js` - May need reconnection handling improvements

## Testing Checklist

- [ ] New user can join existing room with active speakers
- [ ] New user receives audio from existing speakers
- [ ] User can rejoin after disconnect
- [ ] Host receives speak requests correctly
- [ ] Room creator automatically becomes host
- [ ] Error messages show when join fails
- [ ] Connection status is visible to user
- [ ] No memory leaks after leaving room
- [ ] Socket reconnection works correctly
- [ ] Timeout errors are handled gracefully

### To-dos

- [ ] Fix race condition in useWebRTC hook - set up voice-room-joined listener before emitting join-voice-room, add timeout
- [ ] Send existing-producers event to new listeners when they join voice room
- [ ] Add socket error event listener in VoiceRoom.jsx with user-friendly error messages
- [ ] Add timeout wrapper for all mediasoup operations (15s default) to prevent hanging
- [ ] Handle socket reconnection - cleanup and reinitialize mediasoup when socket reconnects
- [ ] Validate room status before allowing join - reject if ended or not yet live
- [ ] Complete transport cleanup - close producers/consumers before closing transports
- [ ] Fix stale socketId issue - always update socketId in participants when user rejoins
- [ ] Add retry logic for critical mediasoup operations (transport creation, producer creation) with exponential backoff
- [ ] Ensure all socket.emit calls have proper error callbacks with user-friendly messages
- [ ] Add comprehensive structured logging at key points in voice room flow
- [ ] Add connection state indicators in UI (Connecting, Connected, Reconnecting, Error)