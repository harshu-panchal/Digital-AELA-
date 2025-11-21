# Step-by-Step coturn Setup Guide for Beginners

This guide will walk you through setting up a coturn TURN server from scratch. Follow each step carefully.

## What You'll Need

- A server (VPS, cloud instance, or local machine) with:
  - Ubuntu/Debian, CentOS, or Windows Server
  - Root/Administrator access
  - Public IP address (for production)
  - Ports 3478 (TCP/UDP) and 49152-65535 (UDP) open in firewall

---

## Step 1: Choose Your Platform

### Option A: Ubuntu/Debian (Recommended for beginners)
- Most common and well-documented
- Easy package management

### Option B: Windows
- Use Docker (easiest) or compile from source
- More complex setup

### Option C: Docker (Any platform)
- Simplest if you have Docker installed
- Works on Windows, Mac, Linux

**For this guide, we'll use Ubuntu/Debian as it's the most straightforward.**

---

## Step 2: Install coturn

### On Ubuntu/Debian:

1. **Open a terminal** (SSH into your server if remote)

2. **Update package list:**
   ```bash
   sudo apt-get update
   ```
   *This downloads the latest list of available packages*

3. **Install coturn:**
   ```bash
   sudo apt-get install coturn -y
   ```
   *The `-y` flag automatically answers "yes" to prompts*

4. **Verify installation:**
   ```bash
   turnserver --version
   ```
   *You should see version information if installed correctly*

---

## Step 3: Find Your Server's IP Address

You need to know your server's public IP address for configuration.

1. **On your server, run:**
   ```bash
   curl ifconfig.me
   ```
   *This shows your public IP address*

2. **Write down this IP** - you'll need it in the next step
   - Example: `123.45.67.89`

---

## Step 4: Configure coturn

1. **Open the configuration file:**
   ```bash
   sudo nano /etc/turnserver.conf
   ```
   *`nano` is a simple text editor. You can also use `vim` if you prefer*

2. **The file might be empty or have commented lines (starting with #). Add or uncomment these settings:**

   ```conf
   # Listening port (default: 3478)
   listening-port=3478

   # YOUR PUBLIC IP ADDRESS (replace with the IP from Step 3)
   external-ip=123.45.67.89

   # Your domain or identifier
   realm=digitalaela.com

   # Username and password (CHANGE THESE!)
   # Format: username:password
   user=turnuser:SecurePassword123!

   # Enable verbose logging (helps with debugging)
   verbose

   # Disable TLS/DTLS (simpler setup, enable later for production)
   no-tls
   no-dtls

   # Enable both STUN and TURN
   # STUN helps discover your IP, TURN relays traffic
   no-stun
   no-cli

   # Port range for RTP relay (audio/video data)
   min-port=49152
   max-port=65535

   # Log file location
   log-file=/var/log/turnserver.log
   ```

3. **Important: Replace these values:**
   - `external-ip=123.45.67.89` → Your actual public IP
   - `user=turnuser:SecurePassword123!` → Choose a strong username and password
   - `realm=digitalaela.com` → Your domain or any identifier

4. **Save and exit:**
   - In `nano`: Press `Ctrl + X`, then `Y`, then `Enter`
   - In `vim`: Press `Esc`, type `:wq`, press `Enter`

---

## Step 5: Generate a Secure Password (Optional but Recommended)

Instead of typing a password manually, generate a secure one:

```bash
openssl rand -base64 32
```

**Copy the output** and use it as your password in the config file.

Example output: `aB3xK9mP2qR7sT4uV6wY8zA1bC5dE0fG`

Use it like: `user=turnuser:aB3xK9mP2qR7sT4uV6wY8zA1bC5dE0fG`

---

## Step 6: Configure Firewall

Your server needs to allow traffic on specific ports.

### For UFW (Ubuntu Firewall):

1. **Check if UFW is active:**
   ```bash
   sudo ufw status
   ```

2. **Allow TURN/STUN port:**
   ```bash
   sudo ufw allow 3478/tcp
   sudo ufw allow 3478/udp
   ```

3. **Allow RTP relay port range:**
   ```bash
   sudo ufw allow 49152:65535/udp
   ```

4. **If UFW was inactive, enable it:**
   ```bash
   sudo ufw enable
   ```

### For iptables (if not using UFW):

```bash
sudo iptables -A INPUT -p tcp --dport 3478 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 3478 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 49152:65535 -j ACCEPT
sudo iptables-save
```

### For Cloud Providers (AWS, DigitalOcean, etc.):

1. **AWS EC2:**
   - Go to Security Groups
   - Add inbound rules:
     - Port 3478, TCP, from 0.0.0.0/0
     - Port 3478, UDP, from 0.0.0.0/0
     - Ports 49152-65535, UDP, from 0.0.0.0/0

2. **DigitalOcean:**
   - Go to Networking → Firewalls
   - Create rules for the same ports

---

## Step 7: Start coturn Service

1. **Enable coturn to start on boot:**
   ```bash
   sudo systemctl enable coturn
   ```
   *This makes coturn start automatically when server reboots*

2. **Start coturn:**
   ```bash
   sudo systemctl start coturn
   ```

3. **Check if it's running:**
   ```bash
   sudo systemctl status coturn
   ```
   *You should see "active (running)" in green*

4. **If there are errors, check the logs:**
   ```bash
   sudo tail -f /var/log/turnserver.log
   ```
   *Press `Ctrl + C` to exit log viewing*

---

## Step 8: Test Your TURN Server

### Method 1: Using turnutils_stunclient (Built-in test)

1. **Test STUN (basic connectivity):**
   ```bash
   turnutils_stunclient your-server-ip-or-domain
   ```
   *Replace with your actual IP or domain*

   **Expected output:**
   ```
   0: IPv4. Public IP: 123.45.67.89:54321
   ```
   *This confirms STUN is working*

2. **Test TURN (full relay):**
   ```bash
   turnutils_rfc5769check -h your-server-ip -u turnuser -w SecurePassword123!
   ```
   *Replace with your actual IP, username, and password*

   **Expected output:**
   ```
   test 1: IPv4. Public IP: 123.45.67.89:54321
   test 2: IPv4. Public IP: 123.45.67.89:54322
   ...
   ```
   *Multiple tests passing means TURN is working*

### Method 2: Using WebRTC Trickle ICE (Browser-based test)

1. **Open your browser** and go to:
   ```
   https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
   ```

2. **Click "Add Server"**

3. **Enter your TURN server details:**
   - **STUN or TURN URI:** `turn:your-server-ip:3478`
     - Example: `turn:123.45.67.89:3478`
   - **TURN username:** `turnuser` (your username from config)
   - **TURN password:** `SecurePassword123!` (your password from config)

4. **Click "Add"**

5. **Click "Gather candidates"**

6. **Look for results:**
   - ✅ **Good:** You see candidates with type "relay" (these are TURN)
   - ✅ **Also good:** You see "srflx" (STUN reflexive) candidates
   - ❌ **Bad:** Only "host" candidates (TURN not working)

---

## Step 9: Configure Your Backend Application

Now that coturn is running, connect it to your application.

1. **Open your backend `.env` file:**
   ```bash
   nano .env
   ```
   *Or use your preferred editor*

2. **Add these lines:**
   ```env
   # TURN Server Configuration
   TURN_SERVER_URL=turn:123.45.67.89:3478
   TURN_SERVER_USERNAME=turnuser
   TURN_SERVER_CREDENTIAL=SecurePassword123!
   ```
   *Replace with your actual values*

3. **Save the file**

4. **Restart your backend server:**
   ```bash
   # If using PM2
   pm2 restart all

   # If using npm
   npm restart

   # Or stop and start manually
   ```

---

## Step 10: Verify Everything Works

1. **Check coturn is still running:**
   ```bash
   sudo systemctl status coturn
   ```

2. **Check logs for activity:**
   ```bash
   sudo tail -20 /var/log/turnserver.log
   ```
   *You should see connection attempts when users join voice rooms*

3. **Test from your application:**
   - Join a voice room
   - Check browser console for WebRTC connection status
   - Verify audio is working

---

## Troubleshooting Common Issues

### Issue: "Connection refused" or can't connect

**Solutions:**
1. Check firewall rules are applied:
   ```bash
   sudo ufw status
   ```

2. Verify coturn is running:
   ```bash
   sudo systemctl status coturn
   ```

3. Check if port is listening:
   ```bash
   sudo netstat -tulpn | grep 3478
   ```
   *Should show coturn listening on port 3478*

### Issue: "Authentication failed"

**Solutions:**
1. Verify username and password in config match what you're using
2. Check config file syntax (no extra spaces):
   ```bash
   sudo cat /etc/turnserver.conf | grep user
   ```

3. Restart coturn after config changes:
   ```bash
   sudo systemctl restart coturn
   ```

### Issue: "No relay candidates" in browser test

**Solutions:**
1. Check external IP is correct:
   ```bash
   curl ifconfig.me
   ```
   Compare with `external-ip` in config

2. Verify firewall allows UDP ports 49152-65535

3. Check logs for errors:
   ```bash
   sudo tail -50 /var/log/turnserver.log
   ```

### Issue: coturn won't start

**Solutions:**
1. Check config file for syntax errors:
   ```bash
   sudo turnserver -c /etc/turnserver.conf --log-file=/tmp/test.log
   ```
   *This will show errors if config is invalid*

2. Check if port 3478 is already in use:
   ```bash
   sudo lsof -i :3478
   ```

3. Try running manually to see errors:
   ```bash
   sudo turnserver -c /etc/turnserver.conf -v
   ```

---

## Quick Reference Commands

```bash
# Start coturn
sudo systemctl start coturn

# Stop coturn
sudo systemctl stop coturn

# Restart coturn (after config changes)
sudo systemctl restart coturn

# Check status
sudo systemctl status coturn

# View logs
sudo tail -f /var/log/turnserver.log

# Test STUN
turnutils_stunclient your-ip

# Test TURN
turnutils_rfc5769check -h your-ip -u username -w password
```

---

## Security Checklist

Before going to production:

- [ ] Changed default username/password
- [ ] Used strong password (at least 16 characters)
- [ ] Firewall configured correctly
- [ ] Only necessary ports are open
- [ ] Logs are being monitored
- [ ] Consider enabling TLS/DTLS for production
- [ ] Regular security updates applied

---

## Next Steps

1. ✅ coturn is installed and running
2. ✅ Configuration is set up
3. ✅ Firewall rules are in place
4. ✅ TURN server is tested and working
5. ✅ Backend is configured with TURN credentials

**Your voice rooms should now work reliably even for users behind firewalls and NATs!**

---

## Need Help?

- Check coturn logs: `/var/log/turnserver.log`
- Test connectivity: Use the browser test tool
- Verify config: `sudo cat /etc/turnserver.conf`
- Check system status: `sudo systemctl status coturn`

