# Where Speak Requests Appear for Hosts/Speakers

## 📍 Location: Right Sidebar (Controls Section)

The **"Speak Requests"** section appears in the **right sidebar** of the voice room, specifically in the **"Controls Sidebar"** area.

---

## 🎯 Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  Voice Room Header                                      │
│  [Room Title] [Leave Room Button]                       │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────┐
│                          │                              │
│  LEFT COLUMN             │  RIGHT COLUMN               │
│  (Main Content)          │  (Controls Sidebar)         │
│                          │                              │
│  ┌────────────────────┐  │  ┌──────────────────────┐ │
│  │ Speakers Section   │  │  │ Your Controls         │ │
│  │ - Host            │  │  │ [Mic controls]        │ │
│  │ - Speaker 1       │  │  │ [Volume slider]       │ │
│  └────────────────────┘  │  └──────────────────────┘ │
│                          │                              │
│  ┌────────────────────┐  │  ┌──────────────────────┐ │
│  │ Listeners Section  │  │  │ Speak Requests (2)   │ │ ← HERE!
│  │ - Listener 1       │  │  │ ┌──────────────────┐ │
│  │ - Listener 2       │  │  │ │ 👤 John Doe      │ │
│  └────────────────────┘  │  │ │ [✓] [✗]         │ │
│                          │  │ └──────────────────┘ │
│                          │  │ ┌──────────────────┐ │
│                          │  │ │ 👤 Jane Smith    │ │
│                          │  │ │ [✓] [✗]         │ │
│                          │  │ └──────────────────┘ │
│                          │  └──────────────────────┘ │
└──────────────────────────┴──────────────────────────────┘
```

---

## 📋 Detailed Description

### **Location:**

- **Section**: Right sidebar (Controls Sidebar)
- **Position**: Below "Your Controls" section
- **Visibility**: Only visible to **Hosts** and **Speakers**

### **What It Shows:**

1. **Section Title**: "Speak Requests (X)" where X is the number of pending requests
2. **Request Cards**: Each request shows:
   - User's avatar (first letter of name in a gold circle)
   - User's name
   - **Approve button** (✓) - Green checkmark
   - **Reject button** (✗) - Red X

### **When It Appears:**

- ✅ Visible when you are a **Host** or **Speaker**
- ✅ Shows "No pending requests" when empty
- ✅ Automatically updates when new requests come in
- ✅ Shows count in title: "Speak Requests (2)"

---

## 🎨 Visual Example

```
┌─────────────────────────────────────────┐
│ Speak Requests (2)                      │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  👤  John Doe          [✓]  [✗]    │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │  👤  Jane Smith        [✓]  [✗]    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔍 How to Find It

1. **Join the voice room** as the room creator (you're automatically the host)
2. **Look at the right side** of the screen
3. **Scroll down** if needed (below "Your Controls")
4. **You'll see**: "Speak Requests" section

---

## ✅ What You Can Do

### **As Host/Speaker:**

- ✅ **See all pending requests** from listeners
- ✅ **Approve requests** by clicking the green checkmark (✓)
- ✅ **Reject requests** by clicking the red X (✗)
- ✅ **See request count** in the section title

### **When You Approve:**

- The listener becomes a speaker
- They can now speak
- Their request is removed from the list

### **When You Reject:**

- The listener's request is removed
- They remain a listener
- They can request again later

---

## 🚨 Troubleshooting

### **Issue: Can't see "Speak Requests" section**

**Check:**

1. ✅ Are you the room creator? (You should be host)
2. ✅ Did you join the voice room? (Not just the debate page)
3. ✅ Is your role showing as "host" in the header?
4. ✅ Check the right sidebar - scroll down if needed

### **Issue: Section shows but no requests appear**

**Possible reasons:**

1. No one has requested to speak yet
2. All requests have been approved/rejected
3. Requests are being sent but not received (check console)

### **Issue: Requests appear but buttons don't work**

**Check:**

1. Are you connected to socket? (Check connection status)
2. Check browser console for errors
3. Make sure you're still in the voice room

---

## 📱 Mobile View

On mobile devices:

- The sidebar may appear below the main content
- Scroll down to find "Speak Requests"
- The layout is responsive and adapts to screen size

---

## 🎯 Quick Checklist

- [ ] I'm the room creator (host)
- [ ] I've joined the voice room
- [ ] I can see "Your Controls" section
- [ ] I scroll down to see "Speak Requests"
- [ ] The section shows "Speak Requests (X)" or "No pending requests"

---

## 💡 Tips

1. **Keep the voice room open** - Requests only appear when you're in the voice room
2. **Check regularly** - New requests appear in real-time
3. **Approve quickly** - Listeners are waiting for approval
4. **Use the count** - The number in parentheses shows how many requests are pending

---

**The "Speak Requests" section is in the RIGHT SIDEBAR, below "Your Controls", and is only visible to Hosts and Speakers!**
