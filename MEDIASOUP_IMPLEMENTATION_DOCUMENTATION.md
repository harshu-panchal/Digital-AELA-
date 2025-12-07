# mediasoup Implementation Documentation

## Table of Contents
1. [Overview](#overview)
2. [What is mediasoup?](#what-is-mediasoup)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [Features](#features)
6. [Requirements](#requirements)
7. [Configuration](#configuration)
8. [How It Works](#how-it-works)
9. [Fallback Mechanism](#fallback-mechanism)
10. [Deployment Considerations](#deployment-considerations)
11. [Troubleshooting](#troubleshooting)
12. [Code Structure](#code-structure)

---

## Overview

This application uses **mediasoup** as a Selective Forwarding Unit (SFU) for real-time audio communication in voice rooms. mediasoup enables high-quality, scalable voice communication where multiple participants can join as either speakers (producers) or listeners (consumers).

### Key Use Case
- **Live Voice Rooms**: Real-time audio communication for debates, discussions, and live sessions
- **Role-Based Participation**: Host, Speaker, and Listener roles with different permissions
- **Scalable Architecture**: Supports multiple concurrent rooms with many participants

---

## What is mediasoup?

**mediasoup** is a cutting-edge WebRTC SFU (Selective Forwarding Unit) library for Node.js. Unlike traditional peer-to-peer (P2P) WebRTC implementations, mediasoup uses an SFU architecture where:

- **SFU (Selective Forwarding Unit)**: The server receives media streams from participants and selectively forwards them to other participants
- **Benefits**:
  - Lower bandwidth usage (each participant sends one stream, receives multiple)
  - Better scalability (server handles routing, not clients)
  - Lower latency compared to mesh P2P
  - More reliable connections

### mediasoup Components

1. **Worker**: A separate process that handles media processing (runs in C++ for performance)
2. **Router**: Manages media routing for a specific room/session
3. **Transport**: WebRTC transport (send or receive) for a participant
4. **Producer**: Audio/video stream being sent to the server
5. **Consumer**: Audio/video stream being received from the server

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         mediasoup-client (JavaScript SDK)              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │   Device     │  │  Transport   │  │  Producer/   │ │  │
│  │  │              │  │  (Send/Recv) │  │  Consumer    │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ WebRTC (DTLS/SRTP)
                        │ Socket.IO (Signaling)
┌───────────────────────┴─────────────────────────────────────┐
│                    Server (Node.js)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              mediasoup Service                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │   Workers    │  │   Routers   │  │  Transports  │ │  │
│  │  │  (C++ Proc)  │  │  (Per Room) │  │  (Per User)  │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Socket.IO (Signaling Server)                │  │
│  │  - Join/Leave Room                                     │  │
│  │  - Create Transport                                    │  │
│  │  - Create Producer/Consumer                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Relationships

1. **Workers** → Multiple workers for load balancing (round-robin distribution)
2. **Routers** → One router per voice room (created on-demand)
3. **Transports** → One send transport + one recv transport per participant
4. **Producers** → One producer per speaker/host
5. **Consumers** → Multiple consumers per listener (one per active speaker)

---

## Implementation Details

### Backend Implementation

#### 1. mediasoup Service (`backend/src/services/mediasoupService.js`)

The core service that manages all mediasoup operations:

**Key Functions:**
- `initializeWorkers()`: Creates mediasoup worker processes
- `getOrCreateRouter(roomId)`: Creates or retrieves router for a room
- `createTransport(roomId, socketId, direction)`: Creates WebRTC transport
- `createProducer(roomId, socketId, transportId, rtpParameters)`: Creates audio producer
- `createConsumer(roomId, socketId, transportId, producerId, rtpCapabilities)`: Creates audio consumer
- `closeTransport(socketId)`: Cleans up all resources for a participant
- `cleanupRoom(roomId)`: Cleans up all resources for a room

**Data Structures:**
```javascript
// Workers pool
let workers = []; // Array of Worker instances
let nextWorkerIndex = 0; // Round-robin index

// Routers per room
const routers = new Map(); // Map<roomId, Router>

// Transports per socket
const transports = new Map(); // Map<socketId, {
//   sendTransport: Transport | null,
//   recvTransport: Transport | null,
//   producer: Producer | null,
//   consumers: Map<producerId, Consumer>
// }>
```

#### 2. Socket.IO Integration (`backend/src/config/socket.js`)

Socket.IO handles all signaling between client and server:

**Key Events:**
- `join-voice-room`: Join a voice room, receive RTP capabilities
- `create-transport`: Create send or receive transport
- `connect-transport`: Connect transport with DTLS parameters
- `create-producer`: Create producer (for speakers)
- `create-consumer`: Create consumer (for listeners)
- `leave-voice-room`: Leave room and cleanup

**Flow:**
1. Client emits `join-voice-room` with `roomId` and `role`
2. Server creates/retrieves router for room
3. Server sends RTP capabilities to client
4. Client creates mediasoup Device and loads capabilities
5. Client requests transport creation
6. Client connects transport
7. Client creates producer (if speaker) or consumer (if listener)

#### 3. Server Initialization (`backend/src/server.js`)

```javascript
// Initialize mediasoup workers on server start
try {
  await initializeWorkers();
} catch (error) {
  // Server continues even if mediasoup fails
  // Falls back to native WebRTC
  console.warn("mediasoup initialization failed, continuing without voice features");
}
```

### Frontend Implementation

#### 1. WebRTC Hook (`frontend/src/hooks/useWebRTC.js`)

A comprehensive React hook that manages all WebRTC operations:

**Key Functions:**
- `initializeDevice(rtpCapabilities)`: Initialize mediasoup Device
- `createSendTransport()`: Create send transport for speakers
- `createRecvTransport()`: Create receive transport for listeners
- `startProducing()`: Start producing audio (speakers)
- `startConsuming(producerId)`: Start consuming audio from a producer
- `toggleMic()`: Mute/unmute microphone
- `cleanupAll()`: Clean up all resources

**State Management:**
- `localStream`: User's microphone stream
- `remoteStreams`: Map of remote audio streams
- `isMicEnabled`: Microphone mute state
- `connectionState`: Connection status (disconnected, connecting, connected, error)

#### 2. Voice Room Component (`frontend/modules/learn-earn/pages/VoiceRoom.jsx`)

The main UI component that uses the WebRTC hook:

- Manages room state and participants
- Handles role changes (listener → speaker)
- Displays participant list
- Manages speak requests
- Integrates with chat functionality

---

## Features

### 1. Role-Based Participation

- **Host**: Room creator, can manage speakers and listeners
- **Speaker**: Can produce audio (speak)
- **Listener**: Can only consume audio (listen)

### 2. Dynamic Role Changes

- Listeners can request to become speakers
- Host can approve/deny speak requests
- Automatic role detection (host/speaker based on room configuration)

### 3. Audio Features

- **Echo Cancellation**: Enabled by default
- **Noise Suppression**: Enabled by default
- **Auto Gain Control**: Enabled by default
- **Mute/Unmute**: Per-participant control
- **Host Controls**: Host can mute/unmute speakers

### 4. Scalability

- **Multiple Workers**: Load balancing across worker processes
- **Per-Room Routers**: Isolated routing per room
- **Efficient Resource Management**: Automatic cleanup on disconnect

### 5. Fallback Support

- **Native WebRTC**: Falls back to P2P if mediasoup unavailable
- **Graceful Degradation**: Server continues even if mediasoup fails

---

## Requirements

### System Requirements

#### Backend
- **Node.js**: v18+ (ES modules support)
- **Platform**: Linux, macOS, or Windows (Linux recommended for production)
- **Build Tools**: 
  - `python3` (for building native modules)
  - `make` or `g++` (C++ compiler for worker binary)
- **Ports**: 
  - RTC ports range (default: 40000-49999)
  - Must be accessible for WebRTC traffic

#### Frontend
- **Modern Browser**: Chrome, Firefox, Safari, Edge (latest versions)
- **WebRTC Support**: Required
- **Microphone Access**: Required for speakers

### Dependencies

#### Backend (`backend/package.json`)
```json
{
  "mediasoup": "^3.15.4"
}
```

#### Frontend (`frontend/package.json`)
```json
{
  "mediasoup-client": "^3.7.4"
}
```

### Network Requirements

- **STUN Server**: For NAT traversal (default: Google STUN)
- **TURN Server**: Recommended for restrictive NATs (optional but recommended)
- **UDP/TCP**: Both protocols supported (UDP preferred)

---

## Configuration

### Environment Variables

#### Backend Configuration

```bash
# mediasoup Worker Configuration
MEDIASOUP_NUM_WORKERS=2                    # Number of worker processes (default: 2)
MEDIASOUP_LOG_LEVEL=warn                  # Log level: debug, warn, error (default: warn)
MEDIASOUP_RTC_MIN_PORT=40000              # Minimum RTC port (default: 40000)
MEDIASOUP_RTC_MAX_PORT=49999              # Maximum RTC port (default: 49999)
MEDIASOUP_LISTEN_IP=0.0.0.0                # IP to listen on (default: 0.0.0.0)
MEDIASOUP_ANNOUNCED_IP=                    # Public IP (for NAT traversal, optional)

# TURN Server Configuration (Optional but Recommended)
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_SERVER_USERNAME=your-username
TURN_SERVER_CREDENTIAL=your-password
```

#### Configuration Object

```javascript
const mediasoupConfig = {
  numWorkers: process.env.MEDIASOUP_NUM_WORKERS || 2,
  workerSettings: {
    logLevel: process.env.MEDIASOUP_LOG_LEVEL || "warn",
    logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
    rtcMinPort: process.env.MEDIASOUP_RTC_MIN_PORT || 40000,
    rtcMaxPort: process.env.MEDIASOUP_RTC_MAX_PORT || 49999,
  },
  routerOptions: {
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
    ],
  },
};
```

### Router Configuration

**Media Codecs:**
- **Audio Codec**: Opus (48kHz, 2 channels)
- **Why Opus?**: High quality, low latency, wide browser support

**Transport Configuration:**
- **UDP**: Enabled (preferred)
- **TCP**: Enabled (fallback)
- **Initial Bitrate**: 1 Mbps (1,000,000 bps)

---

## How It Works

### Connection Flow

#### 1. Server Initialization

```
Server Start
    ↓
Initialize mediasoup Workers
    ↓
Create Worker Pool (default: 2 workers)
    ↓
Workers Ready → mediasoup Available
```

#### 2. Client Joins Room (Speaker)

```
Client: emit("join-voice-room", { roomId, role: "speaker" })
    ↓
Server: Create/Get Router for room
    ↓
Server: Send RTP Capabilities to client
    ↓
Client: Initialize mediasoup Device with capabilities
    ↓
Client: Request send transport
    ↓
Server: Create WebRTC transport (send)
    ↓
Client: Connect transport (DTLS handshake)
    ↓
Client: Get microphone stream
    ↓
Client: Create producer
    ↓
Server: Register producer, notify listeners
    ↓
Client: Start producing audio
```

#### 3. Client Joins Room (Listener)

```
Client: emit("join-voice-room", { roomId, role: "listener" })
    ↓
Server: Create/Get Router for room
    ↓
Server: Send RTP Capabilities + existing producers
    ↓
Client: Initialize mediasoup Device
    ↓
Client: Request receive transport
    ↓
Server: Create WebRTC transport (recv)
    ↓
Client: Connect transport
    ↓
For each existing producer:
    Client: Create consumer
    Server: Create consumer, send RTP parameters
    Client: Start consuming audio
```

#### 4. New Speaker Starts (Listener Perspective)

```
Speaker: Creates producer
    ↓
Server: Emits "new-producer" event
    ↓
Listener: Receives "new-producer" event
    ↓
Listener: Creates consumer for new producer
    ↓
Server: Creates consumer, sends RTP parameters
    ↓
Listener: Starts consuming audio
```

### Data Flow

```
Speaker Microphone
    ↓
MediaStream (getUserMedia)
    ↓
mediasoup-client Device
    ↓
Send Transport (WebRTC)
    ↓
Server Router
    ↓
Multiple Receive Transports (one per listener)
    ↓
mediasoup-client Consumers
    ↓
Audio Elements (HTMLAudioElement)
    ↓
Listener Speakers
```

### Signaling Flow (Socket.IO)

All signaling happens via Socket.IO events:

1. **Join Room**: Client → Server
2. **RTP Capabilities**: Server → Client
3. **Create Transport**: Client → Server → Client
4. **Connect Transport**: Client → Server
5. **Create Producer**: Client → Server → Client
6. **New Producer**: Server → All Listeners
7. **Create Consumer**: Client → Server → Client
8. **Leave Room**: Client → Server (cleanup)

---

## Fallback Mechanism

### Native WebRTC Fallback

If mediasoup is unavailable (e.g., on platforms like Render.com that restrict native modules), the system automatically falls back to native WebRTC (P2P mesh).

#### Detection

```javascript
// Backend
const useNativeWebRTC = !isMediasoupAvailable();

if (useNativeWebRTC) {
  // Send WebRTC config (STUN/TURN servers)
  socket.emit("voice-room-joined", {
    webrtcConfig: getWebRTCConfig(),
    useNativeWebRTC: true
  });
} else {
  // Send mediasoup RTP capabilities
  socket.emit("voice-room-joined", {
    rtpCapabilities: router.rtpCapabilities,
    useNativeWebRTC: false
  });
}
```

#### Native WebRTC Implementation

- **P2P Mesh**: Each speaker creates peer connections with all listeners
- **STUN/TURN**: Uses STUN for NAT traversal, TURN for restrictive NATs
- **Signaling**: Still uses Socket.IO for offer/answer exchange
- **Limitations**: Less scalable than SFU, but works on restricted platforms

#### When Fallback Activates

1. mediasoup workers fail to initialize
2. Platform doesn't support native modules (e.g., Render.com free tier)
3. Missing build tools (python, g++, make)
4. Port binding restrictions

---

## Deployment Considerations

### Platform Compatibility

#### ✅ Fully Supported
- **VPS/Dedicated Server**: Full mediasoup support
- **Docker**: Full support (ensure proper networking)
- **Kubernetes**: Full support (configure service networking)

#### ⚠️ Limited Support
- **Render.com**: Free tier may not support native modules → Falls back to native WebRTC
- **Heroku**: May require buildpacks for native modules
- **Railway**: Should work with proper configuration

### Build Process

#### Post-Install Script

The project includes a build script (`backend/scripts/build-mediasoup.js`) that:

1. Checks if mediasoup is installed
2. Verifies worker binary exists
3. Attempts to build if missing
4. Gracefully fails if build tools unavailable

```json
{
  "scripts": {
    "postinstall": "node scripts/build-mediasoup.js"
  }
}
```

### Port Configuration

#### Required Ports

- **RTC Port Range**: 40000-49999 (UDP/TCP)
- **Must be accessible** for WebRTC traffic
- **Firewall**: Allow UDP and TCP on RTC port range

#### Docker/Container Considerations

```yaml
# docker-compose.yml example
services:
  backend:
    ports:
      - "5000:5000"
      - "40000-49999:40000-49999/udp"
      - "40000-49999:40000-49999/tcp"
```

### TURN Server Setup

For production, a TURN server is **highly recommended**:

1. **Why?**: Helps with restrictive NATs and firewalls
2. **Options**:
   - Self-hosted (coturn, rfc5766-turn-server)
   - Cloud services (Twilio, Vonage)
3. **Configuration**: Set `TURN_SERVER_URL`, `TURN_SERVER_USERNAME`, `TURN_SERVER_CREDENTIAL`

### Resource Requirements

#### CPU
- **Per Worker**: ~1-2% CPU (idle)
- **Per Active Room**: ~5-10% CPU
- **Recommendation**: 2-4 workers for moderate load

#### Memory
- **Per Worker**: ~50-100 MB
- **Per Router**: ~10-20 MB
- **Per Transport**: ~5-10 MB

#### Network
- **Per Audio Stream**: ~50-100 kbps (Opus)
- **Bandwidth**: Scales with number of participants

---

## Troubleshooting

### Common Issues

#### 1. mediasoup Workers Fail to Initialize

**Symptoms:**
- Server starts but voice features unavailable
- Error: "mediasoup workers are not available"

**Solutions:**
- Check build tools: `python3`, `g++`, `make`
- Verify port range is available
- Check platform restrictions (Render.com free tier)
- Review logs for specific error messages

#### 2. Transport Creation Fails

**Symptoms:**
- "Failed to create transport" error
- Connection stuck at "connecting"

**Solutions:**
- Verify TURN server configuration
- Check firewall rules (UDP/TCP ports)
- Ensure `MEDIASOUP_ANNOUNCED_IP` is set correctly (if behind NAT)

#### 3. Audio Not Working

**Symptoms:**
- No audio from speakers
- Listeners can't hear

**Solutions:**
- Check browser microphone permissions
- Verify audio codec compatibility
- Check browser console for WebRTC errors
- Ensure TURN server is configured (for restrictive NATs)

#### 4. High CPU Usage

**Symptoms:**
- Server CPU usage spikes
- Audio quality degrades

**Solutions:**
- Reduce `MEDIASOUP_NUM_WORKERS`
- Monitor active rooms and participants
- Consider horizontal scaling

### Debugging

#### Enable Debug Logging

```bash
MEDIASOUP_LOG_LEVEL=debug
```

#### Check Worker Status

```javascript
// In mediasoupService.js
console.log(`Workers: ${workers.length}`);
console.log(`Routers: ${routers.size}`);
console.log(`Transports: ${transports.size}`);
```

#### Browser Console

Check for:
- WebRTC connection state
- ICE candidate gathering
- DTLS handshake completion
- Producer/consumer creation

---

## Code Structure

### Backend Files

```
backend/
├── src/
│   ├── services/
│   │   └── mediasoupService.js      # Core mediasoup service
│   ├── services/
│   │   └── webrtcService.js          # Native WebRTC fallback
│   ├── config/
│   │   └── socket.js                 # Socket.IO signaling
│   ├── controllers/
│   │   └── liveRoomController.js    # Room management
│   └── server.js                     # Server initialization
├── scripts/
│   └── build-mediasoup.js            # Build script
└── package.json                      # Dependencies
```

### Frontend Files

```
frontend/
├── src/
│   ├── hooks/
│   │   └── useWebRTC.js              # WebRTC hook
│   └── components/
│       └── ...
├── modules/
│   └── learn-earn/
│       └── pages/
│           └── VoiceRoom.jsx         # Voice room UI
└── package.json                      # Dependencies
```

### Key Functions Reference

#### Backend (`mediasoupService.js`)

| Function | Purpose |
|----------|---------|
| `initializeWorkers()` | Create worker processes |
| `isMediasoupAvailable()` | Check if mediasoup is ready |
| `getOrCreateRouter(roomId)` | Get or create router for room |
| `createTransport(roomId, socketId, direction)` | Create WebRTC transport |
| `connectTransport(...)` | Connect transport with DTLS |
| `createProducer(...)` | Create audio producer |
| `createConsumer(...)` | Create audio consumer |
| `pauseProducer(socketId)` | Pause producer (mute) |
| `resumeProducer(socketId)` | Resume producer (unmute) |
| `closeTransport(socketId)` | Cleanup participant resources |
| `cleanupRoom(roomId)` | Cleanup all room resources |

#### Frontend (`useWebRTC.js`)

| Function | Purpose |
|----------|---------|
| `initializeDevice(rtpCapabilities)` | Initialize mediasoup Device |
| `createSendTransport()` | Create send transport |
| `createRecvTransport()` | Create receive transport |
| `startProducing()` | Start producing audio |
| `startConsuming(producerId)` | Start consuming audio |
| `toggleMic()` | Mute/unmute microphone |
| `cleanupAll()` | Cleanup all resources |

---

## Summary

This implementation provides a robust, scalable voice communication system using mediasoup as the SFU. Key highlights:

- ✅ **Scalable**: SFU architecture supports many participants
- ✅ **Reliable**: Automatic fallback to native WebRTC
- ✅ **Feature-Rich**: Role-based participation, mute controls, dynamic role changes
- ✅ **Production-Ready**: Comprehensive error handling, cleanup, and monitoring
- ✅ **Platform-Agnostic**: Works with or without mediasoup (graceful degradation)

For questions or issues, refer to the troubleshooting section or check the mediasoup documentation: https://mediasoup.org/


