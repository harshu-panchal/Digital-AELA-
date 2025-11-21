# Speak Request Flow - Where Requests Go

## How Speak Requests Work

### When You Click "Request to Speak":

1. **Your Request is Sent:**
   - Frontend emits `request-to-speak` event to backend
   - Backend saves request in database (LiveRoom.speakRequests)
   - Backend updates your participant role to "requested"

2. **Where the Request Goes:**
   - Request is sent to **ALL hosts and speakers** currently in the voice room
   - They receive `speak-requested` socket event
   - Request appears in their "Speak Requests" section (right sidebar)

3. **Who Can See Requests:**
   - ✅ **Hosts** - Can see and approve/reject requests
   - ✅ **Speakers** - Can see and approve/reject requests  
   - ❌ **Listeners** - Cannot see requests (only their own status)

### Visual Location:

**For Hosts/Speakers:**
- Look at the **right sidebar** in the voice room
- Section titled: **"Speak Requests (X)"**
- Shows list of users who requested to speak
- Each request has Approve (✓) and Reject (✗) buttons

**For Listeners:**
- Your button shows: **"Request Pending"**
- Message below: "Waiting for host/speaker approval..."
- You'll get a notification when approved/rejected

---

## Important: Room Creator is Host

**When you create a room:**
- You are automatically the **host**
- When you join the voice room, you join as **host**
- You can see and approve all speak requests

**To see requests:**
1. Create a room (you're the host)
2. Join the voice room
3. Look at right sidebar → "Speak Requests" section
4. Requests will appear there

---

## Testing the Flow

### Test 1: As Room Creator (Host)

1. **Create a room** with "Start immediately"
2. **Join the voice room**
3. **Check right sidebar:**
   - Should see "Speak Requests" section
   - Even if empty, section should be visible

### Test 2: As Listener

1. **Join room as listener** (different user or browser)
2. **Click "Request to Speak"**
3. **You should see:**
   - Button changes to "Request Pending"
   - Message: "Waiting for host/speaker approval..."

### Test 3: Host Sees Request

1. **As host**, check right sidebar
2. **Should see:**
   - "Speak Requests (1)" section
   - Listener's name
   - Approve (✓) and Reject (✗) buttons

### Test 4: Approve Request

1. **Host clicks Approve (✓)**
2. **Listener should:**
   - See notification: "Your request to speak has been approved!"
   - Become a speaker
   - See mic controls
   - Can now speak

---

## Troubleshooting

### Issue: "No hosts/speakers in room"

**Solution:**
- Room creator must join the voice room
- They will automatically be host
- Requests will then be visible to them

### Issue: Can't see "Speak Requests" section

**Check:**
1. Are you the room creator? (You should be host)
2. Did you join the voice room?
3. Is your role showing as "host" in the header?
4. Check browser console for errors

### Issue: Request sent but host doesn't see it

**Solutions:**
1. Make sure host has joined the voice room
2. Check if host's role is correctly set to "host"
3. Refresh the page (requests are loaded when host joins)
4. Check backend console for socket events

### Issue: Request disappears

**Possible reasons:**
- Host approved/rejected it
- You left and rejoined the room
- Request was cleared

---

## Request Flow Diagram

```
Listener clicks "Request to Speak"
         ↓
Backend saves request in database
         ↓
Backend finds hosts/speakers in room
         ↓
Backend sends "speak-requested" event to hosts/speakers
         ↓
Hosts/Speakers see request in "Speak Requests" section
         ↓
Host clicks Approve (✓)
         ↓
Listener becomes speaker
         ↓
Listener can now speak
```

---

## Quick Checklist

- [ ] Room creator joins voice room (becomes host automatically)
- [ ] Host sees "Speak Requests" section in right sidebar
- [ ] Listener clicks "Request to Speak"
- [ ] Request appears in host's "Speak Requests" section
- [ ] Host can approve/reject
- [ ] Listener gets notification when approved

---

## Where to Look

**For Hosts/Speakers:**
- Right sidebar → "Speak Requests" section
- Shows all pending requests
- Can approve/reject each one

**For Listeners:**
- "Your Controls" section
- "Request to Speak" button
- Status message below button

**The requests go to the hosts and speakers who are currently in the voice room!**

