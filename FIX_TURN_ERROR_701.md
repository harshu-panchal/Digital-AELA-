# Fixing TURN Server Error 701 - Host Lookup Error

Error 701 means the domain name can't be resolved. Let's fix this step by step.

---

## Problem: Error 701 - STUN/TURN host lookup received error

This means: The browser can't find the server at `digitalaela.metered.ca`

**Possible causes:**

1. Domain name is incorrect
2. TURN server not activated in Metered dashboard
3. Need to create/enable TURN server first
4. Wrong account or server URL

---

## Solution Steps

### Step 1: Verify Exact Domain in Metered Dashboard

1. **Login to Metered dashboard:** https://www.metered.ca/

2. **Go to "TURN Servers" section**

3. **Look for your server details:**

   - Check the **exact** server URL they show
   - It might be different from `digitalaela.metered.ca`
   - Common formats:
     - `turn:your-account-id.metered.ca:443`
     - `turn:your-username.metered.ca:443`
     - `turn:custom-domain.metered.ca:443`

4. **Copy the EXACT server URL** they provide

### Step 2: Check if TURN Server is Activated

1. **In Metered dashboard, check:**

   - Is there a "Status" or "Active" indicator?
   - Is the server "Enabled" or "Active"?
   - Do you see any "Activate" or "Enable" button?

2. **If server is not active:**
   - Click "Activate" or "Enable"
   - Wait a few minutes for activation

### Step 3: Try Creating New TURN Server (if needed)

1. **Look for "Create TURN Server" or "Add Server" button**

2. **If you see this option:**

   - Click it
   - Follow the setup wizard
   - Note the new server URL they provide

3. **Use the new server URL** in your `.env`

### Step 4: Verify Domain Format

The server URL from Metered should look like one of these:

**Format 1 (most common):**

```
turn:abc123xyz.metered.ca:443
```

**Format 2:**

```
turn:your-username.metered.ca:443
```

**Format 3 (with custom domain):**

```
turn:custom.metered.ca:443
```

**NOT:**

- `digitalaela.metered.ca` (missing `turn:` prefix)
- `turn://digitalaela.metered.ca:443` (double slash)
- `stun:digitalaela.metered.ca:443` (should be `turn:`)

### Step 5: Test Domain Resolution

Test if the domain resolves:

**On Windows (Command Prompt):**

```cmd
nslookup digitalaela.metered.ca
```

**On Mac/Linux:**

```bash
nslookup digitalaela.metered.ca
# Or
dig digitalaela.metered.ca
```

**Expected:** Should return an IP address

**If it fails:** The domain doesn't exist or is incorrect

### Step 6: Try Different Transport Protocol

In the browser test tool, try:

1. **TCP instead of UDP:**

   - URL: `turn:digitalaela.metered.ca:443?transport=tcp`

2. **Or without transport:**
   - URL: `turn:digitalaela.metered.ca:443`

### Step 7: Check Metered Account Status

1. **Go to Metered dashboard**

2. **Check:**

   - Account status (Active/Suspended)
   - Billing status
   - Service status

3. **If account is new:**
   - May need to wait for activation (5-10 minutes)
   - Check email for activation confirmation

---

## Alternative: Get Correct Server URL from Metered

### Method 1: Check Dashboard

1. Login to Metered
2. Go to "TURN Servers" or "My Servers"
3. Look for a section showing:
   - Server URL
   - Endpoint
   - Connection details

### Method 2: Check API/Integration Section

1. Look for "API" or "Integration" section
2. May show server endpoints there
3. Or "Quick Start" guide with server URL

### Method 3: Check Email

1. Check your email inbox
2. Look for Metered welcome email
3. Should contain server URL and credentials

### Method 4: Contact Support

If you can't find it:

- Email: support@metered.ca
- Ask: "What is my TURN server URL?"
- Provide your account email

---

## Quick Fix Checklist

- [ ] Verified exact server URL from Metered dashboard
- [ ] Confirmed server is "Active" or "Enabled"
- [ ] Tested domain resolution (nslookup)
- [ ] Tried TCP transport (`?transport=tcp`)
- [ ] Checked account status in dashboard
- [ ] Updated `.env` with correct URL
- [ ] Restarted backend after `.env` change

---

## Common Metered Server URL Formats

**Check which format your Metered account uses:**

1. **Account-based:**

   ```
   turn:your-account-id.metered.ca:443
   ```

2. **Username-based:**

   ```
   turn:your-username.metered.ca:443
   ```

3. **Custom domain:**
   ```
   turn:custom-name.metered.ca:443
   ```

**The domain part (before `.metered.ca`) should match what Metered shows in your dashboard.**

---

## Next Steps

1. **First:** Check your Metered dashboard for the EXACT server URL
2. **Second:** Verify the domain resolves (nslookup)
3. **Third:** Update `.env` with correct URL
4. **Fourth:** Restart backend and test again

**Share the exact server URL from your Metered dashboard, and I'll help you format it correctly!**
