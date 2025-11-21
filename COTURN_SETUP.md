# coturn TURN Server Setup Guide

This guide explains how to set up and configure a coturn TURN server for WebRTC voice rooms. TURN servers are essential for NAT traversal when direct peer-to-peer connections fail.

## What is coturn?

coturn is an open-source TURN/STUN server that helps WebRTC applications establish connections through firewalls and NATs. It's required for reliable voice communication, especially for users behind strict NATs or corporate firewalls.

## Installation

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install coturn
```

### CentOS/RHEL

```bash
sudo yum install coturn
```

### macOS (Homebrew)

```bash
brew install coturn
```

### Docker

```bash
docker run -d \
  --name coturn \
  -p 3478:3478/tcp \
  -p 3478:3478/udp \
  -p 49152-65535:49152-65535/udp \
  -e TURN_USERNAME=your-username \
  -e TURN_PASSWORD=your-password \
  coturn/coturn
```

## Configuration

### 1. Edit coturn configuration file

Location: `/etc/turnserver.conf` (Linux) or `/usr/local/etc/turnserver.conf` (macOS)

```conf
# Listening port (default: 3478)
listening-port=3478

# External IP address (replace with your server's public IP)
external-ip=YOUR_PUBLIC_IP

# Realm (your domain or identifier)
realm=digitalaela.com

# User credentials (username:password)
# Format: username:password
# You can add multiple users
user=your-username:your-secure-password

# Enable verbose logging (optional, for debugging)
verbose

# Disable TLS/DTLS (if not using certificates)
no-tls
no-dtls

# Enable STUN (for NAT discovery)
stun-only

# Enable TURN (for relay)
no-stun

# Allowed IP ranges (optional, for security)
# allowed-peer-ip=0.0.0.0-255.255.255.255

# Min/Max port range for RTP relay
min-port=49152
max-port=65535

# Log file (optional)
log-file=/var/log/turnserver.log
```

### 2. Generate secure credentials

For production, use strong passwords:

```bash
# Generate a random password
openssl rand -base64 32
```

### 3. Start coturn service

#### Linux (systemd)

```bash
# Enable and start service
sudo systemctl enable coturn
sudo systemctl start coturn

# Check status
sudo systemctl status coturn
```

#### Manual start

```bash
turnserver -c /etc/turnserver.conf
```

## Environment Variables

Add these to your backend `.env` file:

```env
# TURN Server Configuration
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_SERVER_USERNAME=your-username
TURN_SERVER_CREDENTIAL=your-secure-password

# mediasoup Configuration
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=YOUR_PUBLIC_IP
MEDIASOUP_NUM_WORKERS=2
MEDIASOUP_RTC_MIN_PORT=40000
MEDIASOUP_RTC_MAX_PORT=49999
```

## Testing TURN Server

### Using Trickle ICE

1. Visit: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. Add TURN server:
   - TURN URI: `turn:your-turn-server.com:3478`
   - Username: `your-username`
   - Password: `your-secure-password`
3. Click "Gather candidates"
4. Verify that TURN relay candidates appear

### Using turnutils_stunclient

```bash
# Test STUN
turnutils_stunclient your-turn-server.com

# Test TURN
turnutils_rfc5769check -h your-turn-server.com -u your-username -w your-secure-password
```

## Security Considerations

1. **Firewall Rules**: Open ports 3478 (TURN/STUN) and 49152-65535 (RTP relay)
2. **Strong Passwords**: Use cryptographically secure passwords
3. **IP Restrictions**: Consider restricting allowed peer IPs
4. **TLS/DTLS**: Enable for production (requires certificates)
5. **Rate Limiting**: Configure to prevent abuse

## Firewall Configuration

### UFW (Ubuntu)

```bash
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 49152:65535/udp
```

### iptables

```bash
sudo iptables -A INPUT -p tcp --dport 3478 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 3478 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 49152:65535 -j ACCEPT
```

## Cloud Provider Setup

### AWS EC2

1. Create security group with rules:
   - Port 3478 (TCP/UDP) from 0.0.0.0/0
   - Ports 49152-65535 (UDP) from 0.0.0.0/0
2. Use Elastic IP for static public IP
3. Update `external-ip` in config

### DigitalOcean

1. Create droplet with Ubuntu
2. Configure firewall in control panel
3. Use reserved IP for static address

### Google Cloud Platform

1. Create firewall rules in VPC
2. Reserve static external IP
3. Configure load balancer if needed

## Troubleshooting

### Connection Issues

1. **Check firewall**: Ensure ports are open
2. **Verify external IP**: Use `curl ifconfig.me` to check
3. **Check logs**: `/var/log/turnserver.log`
4. **Test connectivity**: Use `turnutils_stunclient`

### Performance Issues

1. **Increase port range**: Adjust `min-port` and `max-port`
2. **Add more workers**: Increase `MEDIASOUP_NUM_WORKERS`
3. **Monitor resources**: Check CPU and bandwidth usage

### Common Errors

- **"Allocation failed"**: Port range exhausted, increase range
- **"Authentication failed"**: Check username/password
- **"Connection refused"**: Firewall blocking or service not running

## Production Recommendations

1. **Use dedicated server**: Don't run coturn on the same server as your app
2. **Enable monitoring**: Set up logging and alerts
3. **Load balancing**: Use multiple TURN servers for redundancy
4. **CDN integration**: Consider using a TURN service (Twilio, Metered, etc.)
5. **Regular updates**: Keep coturn updated for security patches

## Alternative: Managed TURN Services

If setting up your own coturn server is not feasible, consider:

- **Twilio STUN/TURN**: https://www.twilio.com/stun-turn
- **Metered TURN**: https://www.metered.ca/tools/openrelay/
- **Xirsys**: https://xirsys.com/

These services handle infrastructure and scaling automatically.

## References

- coturn GitHub: https://github.com/coturn/coturn
- coturn Documentation: https://github.com/coturn/coturn/wiki
- WebRTC TURN Server Guide: https://webrtc.org/getting-started/turn-server
