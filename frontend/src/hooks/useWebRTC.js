import { useRef, useEffect, useState, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { toast } from "react-toastify";

export const useWebRTC = (socket, roomId, userId, role) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // Map<producerId, MediaStream>
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected"); // disconnected, connecting, connected, reconnecting, error

  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producerRef = useRef(null);
  const consumersRef = useRef(new Map()); // Map<producerId, Consumer>
  const localStreamRef = useRef(null);
  const audioElementsRef = useRef(new Map()); // Map<producerId, HTMLAudioElement>
  const rtpCapabilitiesRef = useRef(null);
  const rtpCapabilitiesReceivedRef = useRef(false);
  const reconnectAttemptRef = useRef(false);
  const setupCompleteRef = useRef(false);
  const lastRoleRef = useRef(null);
  const lastRoomIdRef = useRef(null);
  const rtpCapabilitiesListenerRef = useRef(null); // Persistent listener for RTP capabilities
  const isCleaningUpRef = useRef(false); // Prevent concurrent cleanup calls
  const isSettingUpRef = useRef(false); // Prevent concurrent setup calls
  const lastSetupKeyRef = useRef(null); // Track last setup key to prevent duplicate runs
  const effectRunCountRef = useRef(0); // Track how many times effect has run to detect loops
  const lastEffectDepsRef = useRef(null); // Track last effect dependencies to detect actual changes
  const mediasoupUnavailableRef = useRef(false); // Track if mediasoup is unavailable to prevent setup attempts
  const useNativeWebRTCRef = useRef(false); // Track if we should use native WebRTC
  const webrtcConfigRef = useRef(null); // Store WebRTC configuration (STUN/TURN servers)
  const peerConnectionsRef = useRef(new Map()); // Map<socketId, RTCPeerConnection> for native WebRTC
  const queuedIceCandidatesRef = useRef(new Map()); // Map<socketId, RTCIceCandidate[]> - queue ICE candidates until remote description is set

  // Utility: Timeout wrapper for async operations
  const withTimeout = useCallback(async (promise, timeoutMs = 15000, errorMessage = "Operation timed out") => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  }, []);

  // Utility: Retry wrapper with exponential backoff
  const withRetry = useCallback(async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        // Don't retry on permission errors or validation errors
        if (error.message?.includes("permission") || error.message?.includes("not found") || error.message?.includes("Invalid")) {
          throw error;
        }
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          // eslint-disable-next-line no-console
          console.log(`[WebRTC] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }, []);

  // Initialize mediasoup device
  const initializeDevice = useCallback(
    async (rtpCapabilities) => {
      try {
        if (deviceRef.current) {
          return deviceRef.current;
        }

        // eslint-disable-next-line no-console
        console.log("[WebRTC] Initializing mediasoup device...");
        const device = new mediasoupClient.Device();
        await withTimeout(
          device.load({ routerRtpCapabilities: rtpCapabilities }),
          15000,
          "Device initialization timed out"
        );

        deviceRef.current = device;
        rtpCapabilitiesRef.current = rtpCapabilities;
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Device initialized successfully");

        return device;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Error loading mediasoup device:", error);
        toast.error("Failed to initialize audio device");
        throw error;
      }
    },
    [withTimeout]
  );

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      if (role !== "speaker" && role !== "host") {
        return; // Only speakers need local stream
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error accessing microphone:", error);
      toast.error("Failed to access microphone. Please check permissions.");
      throw error;
    }
  }, [role]);

  // Stop local stream
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  // Create send transport (for speakers)
  const createSendTransport = useCallback(async () => {
    if (!socket || !roomId || !deviceRef.current) {
      throw new Error("Socket, roomId, or device not initialized");
    }

    return withRetry(async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Transport creation timed out"));
        }, 15000);

        socket.emit("create-transport", { roomId, direction: "send" }, (error, data) => {
          clearTimeout(timeout);
          if (error) {
            // eslint-disable-next-line no-console
            console.error("[WebRTC] Error creating send transport:", error);
            reject(new Error(error));
            return;
          }

          try {
            const { transport } = data;
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Creating send transport:", transport.id);

            const sendTransport = deviceRef.current.createSendTransport({
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
              sctpParameters: transport.sctpParameters,
            });

            sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Connecting send transport...");
              socket.emit(
                "connect-transport",
                {
                  roomId,
                  transportId: sendTransport.id,
                  dtlsParameters,
                },
                (error) => {
                  if (error) {
                    // eslint-disable-next-line no-console
                    console.error("[WebRTC] Error connecting send transport:", error);
                    errback(new Error(error));
                  } else {
                    // eslint-disable-next-line no-console
                    console.log("[WebRTC] Send transport connected");
                    callback();
                  }
                }
              );
            });

            sendTransport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
              try {
                // eslint-disable-next-line no-console
                console.log("[WebRTC] Producing audio track...");
                socket.emit(
                  "create-producer",
                  {
                    roomId,
                    transportId: sendTransport.id,
                    rtpParameters,
                  },
                  (error, data) => {
                    if (error) {
                      // eslint-disable-next-line no-console
                      console.error("[WebRTC] Error creating producer:", error);
                      errback(new Error(error));
                    } else {
                      // eslint-disable-next-line no-console
                      console.log("[WebRTC] Producer created:", data.producer.id);
                      callback({ id: data.producer.id });
                    }
                  }
                );
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error("[WebRTC] Error in produce handler:", error);
                errback(error);
              }
            });

            sendTransportRef.current = sendTransport;
            resolve(sendTransport);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[WebRTC] Error setting up send transport:", error);
            reject(error);
          }
        });
      });
    }, 3, 1000);
  }, [socket, roomId, withRetry]);

  // Create recv transport (for listeners)
  const createRecvTransport = useCallback(async () => {
    if (!socket || !roomId || !deviceRef.current) {
      throw new Error("Socket, roomId, or device not initialized");
    }

    return withRetry(async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Transport creation timed out"));
        }, 15000);

        socket.emit("create-transport", { roomId, direction: "recv" }, (error, data) => {
          clearTimeout(timeout);
          if (error) {
            // eslint-disable-next-line no-console
            console.error("[WebRTC] Error creating recv transport:", error);
            reject(new Error(error));
            return;
          }

          try {
            const { transport } = data;
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Creating recv transport:", transport.id);

            const recvTransport = deviceRef.current.createRecvTransport({
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
              sctpParameters: transport.sctpParameters,
            });

            recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Connecting recv transport...");
              socket.emit(
                "connect-transport",
                {
                  roomId,
                  transportId: recvTransport.id,
                  dtlsParameters,
                },
                (error) => {
                  if (error) {
                    // eslint-disable-next-line no-console
                    console.error("[WebRTC] Error connecting recv transport:", error);
                    errback(new Error(error));
                  } else {
                    // eslint-disable-next-line no-console
                    console.log("[WebRTC] Recv transport connected");
                    callback();
                  }
                }
              );
            });

            recvTransportRef.current = recvTransport;
            resolve(recvTransport);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[WebRTC] Error setting up recv transport:", error);
            reject(error);
          }
        });
      });
    }, 3, 1000);
  }, [socket, roomId, withRetry]);

  // Start producing (for speakers)
  const startProducing = useCallback(async () => {
    if (!sendTransportRef.current || !localStreamRef.current) {
      throw new Error("Transport or stream not initialized");
    }

    const track = localStreamRef.current.getAudioTracks()[0];
    if (!track) {
      throw new Error("No audio track available");
    }

    const producer = await sendTransportRef.current.produce({ track });
    producerRef.current = producer;

    // Handle producer events
    producer.on("transportclose", () => {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Producer transport closed");
    });

    return producer;
  }, []);

  // Start consuming (for listeners)
  const startConsuming = useCallback(
    async (producerId) => {
      if (!recvTransportRef.current || !deviceRef.current) {
        throw new Error("Transport or device not initialized");
      }

      if (consumersRef.current.has(producerId)) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Consumer already exists for producer:", producerId);
        return consumersRef.current.get(producerId);
      }

      return withRetry(async () => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Consumer creation timed out"));
          }, 15000);

          // eslint-disable-next-line no-console
          console.log("[WebRTC] Creating consumer for producer:", producerId);
          socket.emit(
            "create-consumer",
            {
              roomId,
              transportId: recvTransportRef.current.id,
              producerId,
              rtpCapabilities: deviceRef.current.rtpCapabilities,
            },
            async (error, data) => {
              clearTimeout(timeout);
              if (error) {
                // eslint-disable-next-line no-console
                console.error("[WebRTC] Error creating consumer:", error);
                reject(new Error(error));
                return;
              }

              try {
                const { consumer: consumerData } = data;
                const consumer = await recvTransportRef.current.consume({
                  id: consumerData.id,
                  producerId: consumerData.producerId,
                  kind: consumerData.kind,
                  rtpParameters: consumerData.rtpParameters,
                });

                consumersRef.current.set(producerId, consumer);
                // eslint-disable-next-line no-console
                console.log("[WebRTC] Consumer created:", consumer.id);

                // Create audio element for remote stream
                const stream = new MediaStream([consumer.track]);
                const audio = document.createElement("audio");
                audio.srcObject = stream;
                audio.autoplay = true;
                audio.playsInline = true;
                audio.volume = 1.0;
                audioElementsRef.current.set(producerId, audio);
                document.body.appendChild(audio);

                setRemoteStreams((prev) => {
                  const next = new Map(prev);
                  next.set(producerId, stream);
                  return next;
                });

                resolve(consumer);
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error("[WebRTC] Error consuming track:", error);
                reject(error);
              }
            }
          );
        });
      }, 3, 1000);
    },
    [socket, roomId, withRetry]
  );

  // Set up persistent listener for RTP capabilities (fixes race condition)
  // This listener is set up BEFORE join-voice-room is emitted, ensuring we never miss the event
  useEffect(() => {
    if (!socket || !roomId) {
      // Reset capabilities when socket or roomId is lost
      rtpCapabilitiesRef.current = null;
      rtpCapabilitiesReceivedRef.current = false;
      return;
    }

    // Only reset capabilities if roomId actually changed (not on every render)
    const currentRoomId = roomId;
    if (lastRoomIdRef.current !== currentRoomId) {
      rtpCapabilitiesRef.current = null;
      rtpCapabilitiesReceivedRef.current = false;
      // Reset mediasoup unavailable flag when changing rooms (new room might have mediasoup available)
      mediasoupUnavailableRef.current = false;
      useNativeWebRTCRef.current = false;
      webrtcConfigRef.current = null;
    }

    const handler = (data) => {
      // Store RTP capabilities or WebRTC config immediately when received
      // This fixes the race condition where backend emits before waitForRtpCapabilities sets up listener
      if (data.roomId === currentRoomId) {
        if (data.useNativeWebRTC && data.webrtcConfig) {
          // Native WebRTC mode
          useNativeWebRTCRef.current = true;
          webrtcConfigRef.current = data.webrtcConfig;
          rtpCapabilitiesReceivedRef.current = true; // Mark as received so setup can proceed
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Native WebRTC config received for room:", currentRoomId);
          // Verify TURN server configuration
          if (data.webrtcConfig.iceServers) {
            const hasTurn = data.webrtcConfig.iceServers.some(server => 
              server.urls && (server.urls.includes("turn:") || server.urls.includes("turns:"))
            );
            // eslint-disable-next-line no-console
            console.log("[WebRTC] WebRTC config verification:", {
              iceServersCount: data.webrtcConfig.iceServers.length,
              hasTurnServer: hasTurn,
              servers: data.webrtcConfig.iceServers.map(s => s.urls || s.url),
            });
            if (!hasTurn) {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] ⚠️ No TURN server in config - P2P may fail behind NATs");
            }
          }
        } else if (data.rtpCapabilities) {
          // Mediasoup mode
          useNativeWebRTCRef.current = false;
          rtpCapabilitiesRef.current = data.rtpCapabilities;
          rtpCapabilitiesReceivedRef.current = true;
          // eslint-disable-next-line no-console
          console.log("[WebRTC] RTP capabilities received via persistent listener for room:", currentRoomId);
        }
      }
    };

    // Remove old listener if it exists
    if (rtpCapabilitiesListenerRef.current) {
      socket.off("voice-room-joined", rtpCapabilitiesListenerRef.current);
    }

    // Set up persistent listener that's always ready
    // This runs BEFORE join-voice-room is emitted, so we never miss the event
    socket.on("voice-room-joined", handler);
    rtpCapabilitiesListenerRef.current = handler;

    return () => {
      // Only remove listener if socket or roomId actually changed
      if (rtpCapabilitiesListenerRef.current && socket) {
        socket.off("voice-room-joined", rtpCapabilitiesListenerRef.current);
        rtpCapabilitiesListenerRef.current = null;
      }
    };
  }, [socket, roomId]);

  // Wait for RTP capabilities or WebRTC config with timeout and race condition fix
  const waitForRtpCapabilities = useCallback(async () => {
    // CRITICAL: Check if already received FIRST (before waiting)
    // The persistent listener above ensures we catch events even if they arrive early
    if (rtpCapabilitiesReceivedRef.current) {
      if (useNativeWebRTCRef.current && webrtcConfigRef.current) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Native WebRTC config already received");
        return { useNativeWebRTC: true, config: webrtcConfigRef.current };
      } else if (rtpCapabilitiesRef.current) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] RTP capabilities already received");
        return { useNativeWebRTC: false, rtpCapabilities: rtpCapabilitiesRef.current };
      }
    }

    // CRITICAL: Check if mediasoup is unavailable and no native WebRTC - reject immediately
    if (mediasoupUnavailableRef.current && !useNativeWebRTCRef.current) {
      // eslint-disable-next-line no-console
      console.warn("[WebRTC] Skipping RTP capabilities wait - mediasoup unavailable and no native WebRTC");
      throw new Error("Media server is unavailable");
    }

    // Wait for capabilities/config with timeout (listener is already set up by persistent effect above)
    return new Promise((resolve, reject) => {
      // Check immediately first
      if (rtpCapabilitiesReceivedRef.current) {
        if (useNativeWebRTCRef.current && webrtcConfigRef.current) {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Native WebRTC config already available");
          resolve({ useNativeWebRTC: true, config: webrtcConfigRef.current });
          return;
        } else if (rtpCapabilitiesRef.current) {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] RTP capabilities already available");
          resolve({ useNativeWebRTC: false, rtpCapabilities: rtpCapabilitiesRef.current });
          return;
        }
      }

      // Check if mediasoup becomes unavailable and no native WebRTC during wait
      if (mediasoupUnavailableRef.current && !useNativeWebRTCRef.current) {
        // eslint-disable-next-line no-console
        console.warn("[WebRTC] Mediasoup unavailable - aborting wait");
        reject(new Error("Media server is unavailable"));
        return;
      }

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Timeout waiting for RTP capabilities/config. RoomId:", roomId);
        reject(new Error("Timeout waiting for RTP capabilities"));
      }, 10000);

      // Poll for capabilities/config (they might arrive via persistent listener)
      const checkInterval = setInterval(() => {
        // Check if mediasoup became unavailable and no native WebRTC during polling
        if (mediasoupUnavailableRef.current && !useNativeWebRTCRef.current) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] Mediasoup unavailable during wait - aborting");
          reject(new Error("Media server is unavailable"));
          return;
        }

        if (rtpCapabilitiesReceivedRef.current) {
          if (useNativeWebRTCRef.current && webrtcConfigRef.current) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Native WebRTC config received during wait");
            resolve({ useNativeWebRTC: true, config: webrtcConfigRef.current });
          } else if (rtpCapabilitiesRef.current) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            // eslint-disable-next-line no-console
            console.log("[WebRTC] RTP capabilities received during wait");
            resolve({ useNativeWebRTC: false, rtpCapabilities: rtpCapabilitiesRef.current });
          }
        }
      }, 100); // Check every 100ms
    });
  }, [roomId]);

  // Setup native WebRTC for speaker (P2P mesh)
  const setupNativeWebRTCAsSpeaker = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionState("connecting");
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Requesting microphone access...");
      
      // Get local stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Verify microphone is actually working
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error("No audio tracks found in stream");
      }
      
      // Ensure all tracks are enabled by default
      let allEnabled = true;
      audioTracks.forEach((track) => {
        if (!track.enabled) {
          track.enabled = true;
          allEnabled = false;
        }
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Audio track:", {
          id: track.id,
          enabled: track.enabled,
          kind: track.kind,
          label: track.label,
          muted: track.muted,
          readyState: track.readyState,
        });
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMicEnabled(true); // Ensure mic is marked as enabled
      
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Microphone status:", {
        tracksCount: audioTracks.length,
        allEnabled,
        tracks: audioTracks.map(t => ({
          id: t.id,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
        })),
      });

      // Notify server that speaker started
      if (socket && roomId) {
        socket.emit("webrtc-speaker-started", { roomId });
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Notified server that speaker started");
      }

      setConnectionState("connected");
      setIsConnecting(false);
      setupCompleteRef.current = true;
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Native WebRTC speaker setup complete. Microphone is ON.");
    } catch (error) {
      setIsConnecting(false);
      setConnectionState("error");
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error setting up native WebRTC as speaker:", error);
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error details:", {
        name: error.name,
        message: error.message,
        constraint: error.constraint,
      });
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Microphone permission denied. Please allow microphone access and try again.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        toast.error("No microphone found. Please connect a microphone and try again.");
      } else {
        toast.error(`Failed to access microphone: ${error.message}`);
      }
      throw error;
    }
  }, [socket, roomId]);

  // Setup WebRTC for speaker/host
  const setupAsSpeaker = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionState("connecting");
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Setting up as speaker/host...");

      // Wait for RTP capabilities or WebRTC config
      const capabilities = await waitForRtpCapabilities();

      // Check if we should use native WebRTC
      if (capabilities.useNativeWebRTC) {
        // Use native WebRTC
        await setupNativeWebRTCAsSpeaker();
        return;
      }

      // Use mediasoup
      // Initialize device
      await initializeDevice(capabilities.rtpCapabilities);

      // Initialize local stream
      await initializeLocalStream();

      // Create send transport
      await createSendTransport();

      // Start producing
      await startProducing();

      setConnectionState("connected");
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Speaker setup complete");
    } catch (error) {
      // Don't show toast for mediasoup unavailable errors (already shown by VoiceRoom component)
      if (error.message?.includes("Media server is unavailable") || mediasoupUnavailableRef.current) {
        // eslint-disable-next-line no-console
        console.warn("[WebRTC] Setup cancelled - mediasoup unavailable");
        setConnectionState("error");
        // Don't throw - just return silently
        return;
      }
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error setting up as speaker:", error);
      setConnectionState("error");
      toast.error(error.message || "Failed to setup audio");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [waitForRtpCapabilities, initializeDevice, initializeLocalStream, createSendTransport, startProducing, setupNativeWebRTCAsSpeaker]);

  // Create peer connection to a speaker (for listeners)
  const createPeerConnectionToSpeaker = useCallback(async (speakerSocketId) => {
    if (!webrtcConfigRef.current || !socket || !roomId) {
      return;
    }

    // Check if peer connection already exists to avoid duplicates
    const existingConnection = peerConnectionsRef.current.get(speakerSocketId);
    if (existingConnection) {
      // Check if connection is already established or in progress
      if (existingConnection.signalingState === "stable" && 
          (existingConnection.connectionState === "connected" || existingConnection.connectionState === "connecting")) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Peer connection already established for:", speakerSocketId);
        return;
      }
      // If connection exists but not established, check if we should create offer or wait
      if (existingConnection.signalingState === "have-local-offer" || existingConnection.signalingState === "have-remote-offer") {
        // Connection is in progress, don't create duplicate
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Peer connection already in progress for:", speakerSocketId, "state:", existingConnection.signalingState);
        return;
      }
      // Connection exists but in bad state, close it and recreate
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Peer connection exists but in bad state, recreating for:", speakerSocketId);
      try {
        existingConnection.close();
      } catch (e) {
        // Ignore errors
      }
      peerConnectionsRef.current.delete(speakerSocketId);
    }

    try {
      // Create peer connection
      const peerConnection = new RTCPeerConnection(webrtcConfigRef.current);
      
      // Store immediately to prevent duplicate creation
      peerConnectionsRef.current.set(speakerSocketId, peerConnection);

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Received remote stream from speaker:", speakerSocketId, event);
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        
        if (remoteStream && remoteStream.getAudioTracks().length > 0) {
          // VERIFICATION: Check track state
          const audioTracks = remoteStream.getAudioTracks();
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Received audio tracks:", audioTracks.length, "from speaker:", speakerSocketId);
          
          audioTracks.forEach((track) => {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Remote track state:", {
              trackId: track.id,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              kind: track.kind,
              from: speakerSocketId,
            });
            
            // Monitor track state changes
            track.onended = () => {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] Remote track ended:", track.id, "from speaker:", speakerSocketId);
            };
            
            track.onmute = () => {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] Remote track muted:", track.id, "from speaker:", speakerSocketId);
            };
            
            track.onunmute = () => {
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Remote track unmuted:", track.id, "from speaker:", speakerSocketId);
            };
          });
          
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(speakerSocketId, remoteStream);
            return next;
          });

          // Check if audio element already exists, reuse it or create new one
          let audio = audioElementsRef.current.get(speakerSocketId);
          if (audio) {
            // Update existing audio element with new stream
            audio.srcObject = remoteStream;
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Updated existing audio element for speaker:", speakerSocketId);
          } else {
            // Create new audio element and play
            audio = document.createElement("audio");
            audio.autoplay = true;
            audio.playsInline = true;
            audio.volume = 1.0;
            audio.srcObject = remoteStream;
            
            // Append to DOM (hidden) and play
            audio.style.display = "none";
            document.body.appendChild(audio);
            
            audioElementsRef.current.set(speakerSocketId, audio);
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Audio element created for speaker:", speakerSocketId);
          }
          
          // IMPROVED: Play audio with better error handling and user interaction fallback
          const playAudio = async () => {
            try {
              await audio.play();
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Audio playing successfully for speaker:", speakerSocketId);
              
              // Verify audio is actually playing
              if (audio.paused) {
                // eslint-disable-next-line no-console
                console.warn("[WebRTC] Audio element is paused after play() call for speaker:", speakerSocketId);
              } else {
                // eslint-disable-next-line no-console
                console.log("[WebRTC] ✅ Audio element is playing for speaker:", speakerSocketId);
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error("[WebRTC] Error playing audio:", error, "for speaker:", speakerSocketId);
              
              // Handle autoplay restrictions - try to play on user interaction
              if (error.name === "NotAllowedError" || error.name === "NotSupportedError") {
                // eslint-disable-next-line no-console
                console.warn("[WebRTC] Autoplay blocked, will play on user interaction for speaker:", speakerSocketId);
                
                // Track if we've already set up the interaction handler
                if (audio.dataset.autoplayHandlerSet === "true") {
                  return; // Already set up, don't add duplicate listeners
                }
                audio.dataset.autoplayHandlerSet = "true";
                
                // Try to play on next user interaction (multiple event types for better compatibility)
                const playOnInteraction = async () => {
                  try {
                    await audio.play();
                    // eslint-disable-next-line no-console
                    console.log("[WebRTC] ✅ Audio started playing after user interaction for speaker:", speakerSocketId);
                    // Clean up listeners after successful play
                    cleanupInteractionListeners();
                  } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn("[WebRTC] Still cannot play audio after interaction:", e);
                    // Keep listeners active for retry
                  }
                };
                
                // Cleanup function
                const cleanupInteractionListeners = () => {
                  document.removeEventListener("click", playOnInteraction);
                  document.removeEventListener("touchstart", playOnInteraction);
                  document.removeEventListener("keydown", playOnInteraction);
                  window.removeEventListener("focus", playOnInteraction);
                  audio.dataset.autoplayHandlerSet = "false";
                };
                
                // Add multiple interaction listeners for better compatibility
                document.addEventListener("click", playOnInteraction, { once: false, passive: true });
                document.addEventListener("touchstart", playOnInteraction, { once: false, passive: true });
                document.addEventListener("keydown", playOnInteraction, { once: false, passive: true });
                window.addEventListener("focus", playOnInteraction, { once: false, passive: true });
                
                // Also try to play when audio element gets focus or becomes interactive
                audio.addEventListener("play", () => {
                  cleanupInteractionListeners();
                }, { once: true });
              }
            }
          };
          
          // Play audio immediately
          playAudio();
          
          // Also try to play when audio element becomes ready
          audio.addEventListener("loadedmetadata", () => {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Audio metadata loaded for speaker:", speakerSocketId);
            playAudio();
          });
        } else {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] Received stream but no audio tracks from speaker:", speakerSocketId);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc-ice-candidate", {
            roomId,
            targetSocketId: speakerSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Track connection state changes with quality monitoring
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Peer connection state changed:", state, "for:", speakerSocketId);
        
        if (state === "connected") {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] ✅ Peer connection established with:", speakerSocketId);
          
          // Monitor connection quality
          if (peerConnection.getStats) {
            peerConnection.getStats().then((stats) => {
              stats.forEach((report) => {
                if (report.type === "candidate-pair" && report.selected) {
                  // eslint-disable-next-line no-console
                  console.log("[WebRTC] Connection quality for:", speakerSocketId, {
                    localCandidateType: report.localCandidateType,
                    remoteCandidateType: report.remoteCandidateType,
                    bytesReceived: report.bytesReceived,
                    bytesSent: report.bytesSent,
                  });
                }
              });
            }).catch((err) => {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] Error getting stats:", err);
            });
          }
        } else if (state === "failed" || state === "disconnected") {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] ⚠️ Peer connection failed/disconnected with:", speakerSocketId);
          
          // Attempt to reconnect if connection failed
          if (state === "failed" && socket && roomId) {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Attempting to reconnect to:", speakerSocketId);
            // Close the failed connection
            try {
              peerConnection.close();
              peerConnectionsRef.current.delete(speakerSocketId);
            } catch (e) {
              // Ignore errors
            }
            
            // Retry connection after a short delay
            setTimeout(() => {
              if (socket && roomId && webrtcConfigRef.current) {
                // eslint-disable-next-line no-console
                console.log("[WebRTC] Retrying connection to:", speakerSocketId);
                createPeerConnectionToSpeaker(speakerSocketId).catch((err) => {
                  // eslint-disable-next-line no-console
                  console.error("[WebRTC] Reconnection failed:", err);
                });
              }
            }, 2000);
          }
        } else if (state === "connecting") {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Connecting to:", speakerSocketId);
        }
      };

      // Track ICE connection state with detailed monitoring
      peerConnection.oniceconnectionstatechange = () => {
        const iceState = peerConnection.iceConnectionState;
        // eslint-disable-next-line no-console
        console.log("[WebRTC] ICE connection state:", iceState, "for:", speakerSocketId);
        
        if (iceState === "connected" || iceState === "completed") {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] ✅ ICE connection established with:", speakerSocketId);
          
          // Log connection method (direct/TURN/relay)
          if (peerConnection.getStats) {
            peerConnection.getStats().then((stats) => {
              stats.forEach((report) => {
                if (report.type === "candidate-pair" && report.selected) {
                  const connectionType = report.localCandidateType === "relay" || report.remoteCandidateType === "relay"
                    ? "TURN/Relay"
                    : report.localCandidateType === "srflx" || report.remoteCandidateType === "srflx"
                    ? "STUN"
                    : "Direct";
                  // eslint-disable-next-line no-console
                  console.log("[WebRTC] Connection method:", connectionType, "for:", speakerSocketId);
                }
              });
            }).catch((err) => {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] Error getting ICE stats:", err);
            });
          }
        } else if (iceState === "failed") {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] ⚠️ ICE connection failed with:", speakerSocketId);
          
          // ICE failure might indicate TURN server issues
          if (webrtcConfigRef.current?.iceServers) {
            const hasTurn = webrtcConfigRef.current.iceServers.some(server => 
              server.urls && (server.urls.includes("turn:") || server.urls.includes("turns:"))
            );
            if (!hasTurn) {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] ⚠️ ICE failed and no TURN server configured - connection may fail behind NAT");
            }
          }
        } else if (iceState === "checking") {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] ICE connection checking for:", speakerSocketId);
        }
      };

      // CRITICAL FIX: Add local audio tracks BEFORE creating offer
      // This ensures tracks are included in the SDP offer
      if (localStreamRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks();
        if (audioTracks.length === 0) {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] No audio tracks in local stream for:", speakerSocketId);
        } else {
          // Add all audio tracks to the peer connection
          audioTracks.forEach((track) => {
            // Verify track is enabled before adding
            if (!track.enabled) {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] Track is disabled, enabling it:", track.id);
              track.enabled = true;
            }
            peerConnection.addTrack(track, localStreamRef.current);
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Added local track to peer connection:", {
              trackId: track.id,
              kind: track.kind,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              for: speakerSocketId,
            });
          });
          
          // Verify tracks were added by checking senders
          const senders = peerConnection.getSenders();
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Peer connection senders after adding tracks:", senders.length, "for:", speakerSocketId);
          
          // Monitor track transmission
          senders.forEach((sender) => {
            if (sender.track) {
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Sender track state:", {
                trackId: sender.track.id,
                enabled: sender.track.enabled,
                muted: sender.track.muted,
                readyState: sender.track.readyState,
                for: speakerSocketId,
              });
              
              // Monitor track state changes
              sender.track.onended = () => {
                // eslint-disable-next-line no-console
                console.warn("[WebRTC] Local track ended:", sender.track.id, "for:", speakerSocketId);
              };
              
              sender.track.onmute = () => {
                // eslint-disable-next-line no-console
                console.warn("[WebRTC] Local track muted:", sender.track.id, "for:", speakerSocketId);
              };
              
              sender.track.onunmute = () => {
                // eslint-disable-next-line no-console
                console.log("[WebRTC] Local track unmuted:", sender.track.id, "for:", speakerSocketId);
              };
              
              // Monitor transmission stats after connection is established
              setTimeout(() => {
                if (peerConnection.connectionState === "connected" && peerConnection.getStats) {
                  peerConnection.getStats(sender).then((stats) => {
                    stats.forEach((report) => {
                      if (report.type === "outbound-rtp" && report.mediaType === "audio") {
                        // eslint-disable-next-line no-console
                        console.log("[WebRTC] Track transmission stats for:", speakerSocketId, {
                          bytesSent: report.bytesSent,
                          packetsSent: report.packetsSent,
                          packetsLost: report.packetsLost,
                          jitter: report.jitter,
                        });
                      }
                    });
                  }).catch((err) => {
                    // eslint-disable-next-line no-console
                    console.warn("[WebRTC] Error getting sender stats:", err);
                  });
                }
              }, 3000); // Check after 3 seconds
            }
          });
        }
      } else {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] No local stream available (listener mode) for:", speakerSocketId);
      }

      // CRITICAL FIX: Use deterministic offerer selection to avoid simultaneous offers
      // Compare socket IDs - the peer with "lower" socket ID becomes the offerer
      // This ensures only one peer creates an offer, preventing conflicts
      const ourSocketId = socket.id;
      const theirSocketId = speakerSocketId;
      const weShouldBeOfferer = ourSocketId < theirSocketId;
      
      if (weShouldBeOfferer) {
        // We should create the offer
        // eslint-disable-next-line no-console
        console.log("[WebRTC] We are offerer (socketId comparison), creating offer for:", speakerSocketId);
        
        // Create offer AFTER tracks are added
        // This ensures the SDP includes the audio tracks
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        
        // Verify offer includes audio tracks
        if (offer.sdp) {
          const hasAudio = offer.sdp.includes("m=audio");
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Offer created with audio:", hasAudio, "for:", speakerSocketId);
          if (!hasAudio && localStreamRef.current) {
            // eslint-disable-next-line no-console
            console.warn("[WebRTC] ⚠️ Offer created but no audio in SDP for:", speakerSocketId);
          }
        }
        
        await peerConnection.setLocalDescription(offer);

        // Send offer to speaker
        socket.emit("webrtc-offer", {
          roomId,
          targetSocketId: speakerSocketId,
          offer,
        });
        
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Offer sent to:", speakerSocketId);
      } else {
        // They should create the offer - we'll wait for their offer
        // eslint-disable-next-line no-console
        console.log("[WebRTC] They are offerer (socketId comparison), waiting for offer from:", speakerSocketId);
        // Don't create offer - just wait for them to send us one
        // The connection is already set up with tracks, so when we receive their offer,
        // we can respond with an answer
        // Set up ICE candidate handler for when we receive their offer
        peerConnection.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit("webrtc-ice-candidate", {
              roomId,
              targetSocketId: speakerSocketId,
              candidate: event.candidate,
            });
          }
        };
      }

      // eslint-disable-next-line no-console
      console.log("[WebRTC] Created peer connection to speaker:", speakerSocketId, "Connection state:", peerConnection.connectionState);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error creating peer connection to speaker:", error);
    }
  }, [socket, roomId]);

  // Handle WebRTC offer (for speakers)
  const handleWebRTCOffer = useCallback(async (data) => {
    if (!webrtcConfigRef.current || !localStreamRef.current || data.roomId !== roomId) {
      return;
    }

    try {
      const { fromSocketId, offer } = data;
      
      // Check if peer connection already exists
      let peerConnection = peerConnectionsRef.current.get(fromSocketId);
      
      if (!peerConnection) {
        // Create new peer connection
        peerConnection = new RTCPeerConnection(webrtcConfigRef.current);
        peerConnectionsRef.current.set(fromSocketId, peerConnection);
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Created new peer connection for offer from:", fromSocketId);
      } else {
        // Connection already exists - handle bidirectional connection case
        const currentState = peerConnection.signalingState;
        const connectionState = peerConnection.connectionState;
        
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Existing connection state:", {
          signalingState: currentState,
          connectionState: connectionState,
          from: fromSocketId,
        });
        
        // If connection is fully established, ignore duplicate offer
        if (currentState === "stable" && 
            (connectionState === "connected" || connectionState === "connecting")) {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Peer connection already established for:", fromSocketId, "- ignoring duplicate offer");
          return;
        }
        
        // CRITICAL FIX: Handle simultaneous offer case (both peers create offers)
        // When both peers create offers simultaneously, we need to ensure bidirectional connection works
        // Strategy: Use deterministic offerer selection based on socket ID comparison
        // The peer with the "lower" socket ID becomes the offerer, the other becomes the answerer
        if (currentState === "have-local-offer") {
          // We sent an offer, but they also sent us an offer (simultaneous)
          // Determine which peer should be the offerer based on socket ID comparison
          const ourSocketId = socket.id;
          const theirSocketId = fromSocketId;
          const weShouldBeOfferer = ourSocketId < theirSocketId;
          
          if (weShouldBeOfferer) {
            // We should be the offerer - ignore their offer, wait for their answer to our offer
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Simultaneous offers - we are offerer (socketId comparison), ignoring remote offer from:", fromSocketId);
            return;
          } else {
            // They should be the offerer - cancel our offer and accept theirs
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Simultaneous offers - they are offerer (socketId comparison), canceling our offer and accepting theirs from:", fromSocketId);
            // Close current connection and create new one to accept their offer
            try {
              peerConnection.close();
            } catch (e) {
              // Ignore errors when closing
            }
            peerConnection = new RTCPeerConnection(webrtcConfigRef.current);
            peerConnectionsRef.current.set(fromSocketId, peerConnection);
          }
        } else if (currentState === "have-remote-offer") {
          // We're already processing an offer from this peer
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Already processing offer from:", fromSocketId, "- ignoring duplicate");
          return;
        } else if (currentState === "stable") {
          // Connection is in stable state - this means we were waiting for an offer
          // Check if we have tracks already added (we were waiting)
          const hasTracks = peerConnection.getSenders().length > 0;
          if (hasTracks && connectionState === "new") {
            // We were waiting for their offer - process it now
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Connection in stable state waiting for offer - processing offer from:", fromSocketId);
            // Continue to process the offer below
          } else if (connectionState === "new" && !hasTracks) {
            // Connection exists but never established and no tracks - reset
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Connection exists but never established (stable/new) - resetting for:", fromSocketId);
            try {
              peerConnection.close();
            } catch (e) {
              // Ignore errors when closing
            }
            peerConnection = new RTCPeerConnection(webrtcConfigRef.current);
            peerConnectionsRef.current.set(fromSocketId, peerConnection);
          } else if (connectionState === "connected" || connectionState === "connecting") {
            // Connection is already established - ignore duplicate offer
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Connection already established (stable/connected) - ignoring duplicate offer from:", fromSocketId);
            return;
          }
        } else if (currentState === "closed") {
          // Connection was closed, create new one
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Connection was closed, creating new one for:", fromSocketId);
          peerConnection = new RTCPeerConnection(webrtcConfigRef.current);
          peerConnectionsRef.current.set(fromSocketId, peerConnection);
        }
      }

      // Add local stream tracks (check if already added to avoid duplicates)
      const existingTracks = peerConnection.getSenders()
        .map(sender => sender.track)
        .filter(track => track !== null && track !== undefined);
      const tracksToAdd = localStreamRef.current.getTracks().filter(track => !existingTracks.includes(track));
      
      if (tracksToAdd.length > 0) {
        tracksToAdd.forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current);
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Added local track to peer connection:", track.kind, track.id, "for:", fromSocketId);
        });
      } else if (localStreamRef.current.getTracks().length > 0) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Local tracks already added to peer connection for:", fromSocketId);
      }

      // Handle remote stream (receive audio from the peer who sent the offer)
      if (!peerConnection.ontrack) {
        peerConnection.ontrack = (event) => {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Received remote stream from peer:", fromSocketId, event);
          const remoteStream = event.streams[0] || new MediaStream([event.track]);
          
          if (remoteStream && remoteStream.getAudioTracks().length > 0) {
            // VERIFICATION: Check track state
            const audioTracks = remoteStream.getAudioTracks();
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Received audio tracks:", audioTracks.length, "from:", fromSocketId);
            
            audioTracks.forEach((track) => {
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Remote track state:", {
                trackId: track.id,
                enabled: track.enabled,
                muted: track.muted,
                readyState: track.readyState,
                kind: track.kind,
                from: fromSocketId,
              });
              
              // Monitor track state changes
              track.onended = () => {
                // eslint-disable-next-line no-console
                console.warn("[WebRTC] Remote track ended:", track.id, "from:", fromSocketId);
              };
              
              track.onmute = () => {
                // eslint-disable-next-line no-console
                console.warn("[WebRTC] Remote track muted:", track.id, "from:", fromSocketId);
              };
              
              track.onunmute = () => {
                // eslint-disable-next-line no-console
                console.log("[WebRTC] Remote track unmuted:", track.id, "from:", fromSocketId);
              };
            });
            
            setRemoteStreams((prev) => {
              const next = new Map(prev);
              next.set(fromSocketId, remoteStream);
              return next;
            });

            // Check if audio element already exists, reuse it or create new one
            let audio = audioElementsRef.current.get(fromSocketId);
            if (audio) {
              // Update existing audio element with new stream
              audio.srcObject = remoteStream;
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Updated existing audio element for peer:", fromSocketId);
            } else {
              // Create new audio element and play
              audio = document.createElement("audio");
              audio.autoplay = true;
              audio.playsInline = true;
              audio.volume = 1.0;
              audio.srcObject = remoteStream;
              
              // Append to DOM (hidden) and play
              audio.style.display = "none";
              document.body.appendChild(audio);
              
              audioElementsRef.current.set(fromSocketId, audio);
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Audio element created for peer:", fromSocketId);
            }
            
            // IMPROVED: Play audio with better error handling and user interaction fallback
            const playAudio = async () => {
              try {
                await audio.play();
                // eslint-disable-next-line no-console
                console.log("[WebRTC] Audio playing successfully for:", fromSocketId);
                
                // Verify audio is actually playing
                if (audio.paused) {
                  // eslint-disable-next-line no-console
                  console.warn("[WebRTC] Audio element is paused after play() call for:", fromSocketId);
                } else {
                  // eslint-disable-next-line no-console
                  console.log("[WebRTC] ✅ Audio element is playing for:", fromSocketId);
                }
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error("[WebRTC] Error playing audio:", error, "for:", fromSocketId);
                
                // Handle autoplay restrictions - try to play on user interaction
                if (error.name === "NotAllowedError") {
                  // eslint-disable-next-line no-console
                  console.warn("[WebRTC] Autoplay blocked, will play on user interaction for:", fromSocketId);
                  
                  // Try to play on next user interaction
                  const playOnInteraction = () => {
                    audio.play().catch((e) => {
                      // eslint-disable-next-line no-console
                      console.error("[WebRTC] Still cannot play audio:", e);
                    });
                    document.removeEventListener("click", playOnInteraction);
                    document.removeEventListener("touchstart", playOnInteraction);
                  };
                  
                  document.addEventListener("click", playOnInteraction, { once: true });
                  document.addEventListener("touchstart", playOnInteraction, { once: true });
                }
              }
            };
            
            // Play audio immediately
            playAudio();
            
            // Also try to play when audio element becomes ready
            audio.addEventListener("loadedmetadata", () => {
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Audio metadata loaded for:", fromSocketId);
              playAudio();
            });
          } else {
            // eslint-disable-next-line no-console
            console.warn("[WebRTC] Received stream but no audio tracks from:", fromSocketId);
          }
        };
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc-ice-candidate", {
            roomId,
            targetSocketId: fromSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Track connection state changes
      peerConnection.onconnectionstatechange = () => {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Peer connection state changed:", peerConnection.connectionState, "for:", fromSocketId);
        if (peerConnection.connectionState === "connected") {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] ✅ Peer connection established with:", fromSocketId);
        } else if (peerConnection.connectionState === "failed" || peerConnection.connectionState === "disconnected") {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] ⚠️ Peer connection failed/disconnected with:", fromSocketId);
        }
      };

      // Track ICE connection state
      peerConnection.oniceconnectionstatechange = () => {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] ICE connection state:", peerConnection.iceConnectionState, "for:", fromSocketId);
      };

      // Set remote description and create answer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Set remote description, signaling state:", peerConnection.signalingState);
      
      // Process any queued ICE candidates now that remote description is set
      await processQueuedIceCandidates(peerConnection, fromSocketId);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Created and set local answer, signaling state:", peerConnection.signalingState);

      // Send answer
      socket.emit("webrtc-answer", {
        roomId,
        targetSocketId: fromSocketId,
        answer,
      });

      // eslint-disable-next-line no-console
      console.log("[WebRTC] Handled offer from:", fromSocketId, "Connection state:", peerConnection.connectionState, "Signaling state:", peerConnection.signalingState, "ICE state:", peerConnection.iceConnectionState);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error handling WebRTC offer:", error);
    }
  }, [socket, roomId]);

  // Handle WebRTC answer (for listeners and speakers)
  const handleWebRTCAnswer = useCallback(async (data) => {
    if (data.roomId !== roomId) {
      return;
    }

    try {
      const { fromSocketId, answer } = data;
      const peerConnection = peerConnectionsRef.current.get(fromSocketId);
      if (peerConnection) {
        // Always set up connection state listeners (even if answer is duplicate)
        // This ensures we track connection progress
        if (!peerConnection.onconnectionstatechange) {
          peerConnection.onconnectionstatechange = () => {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Peer connection state changed:", peerConnection.connectionState, "for:", fromSocketId);
            if (peerConnection.connectionState === "connected") {
              // eslint-disable-next-line no-console
              console.log("[WebRTC] ✅ Peer connection established with:", fromSocketId);
            } else if (peerConnection.connectionState === "failed" || peerConnection.connectionState === "disconnected") {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] ⚠️ Peer connection failed/disconnected with:", fromSocketId);
            }
          };
        }
        
        if (!peerConnection.oniceconnectionstatechange) {
          peerConnection.oniceconnectionstatechange = () => {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] ICE connection state:", peerConnection.iceConnectionState, "for:", fromSocketId);
            if (peerConnection.iceConnectionState === "connected" || peerConnection.iceConnectionState === "completed") {
              // eslint-disable-next-line no-console
              console.log("[WebRTC] ✅ ICE connection established with:", fromSocketId);
            } else if (peerConnection.iceConnectionState === "failed") {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] ⚠️ ICE connection failed with:", fromSocketId);
            }
          };
        }
        
        // Check signaling state before setting remote description
        // We can only set remote answer if we're in "have-local-offer" state
        if (peerConnection.signalingState === "have-local-offer") {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Handled answer from:", fromSocketId, "Connection state:", peerConnection.connectionState, "Signaling state:", peerConnection.signalingState);
          
          // Process any queued ICE candidates now that remote description is set
          await processQueuedIceCandidates(peerConnection, fromSocketId);
        } else if (peerConnection.signalingState === "stable") {
          // Signaling is stable, but check if connection is actually established
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Signaling stable for:", fromSocketId, "Connection state:", peerConnection.connectionState, "ICE state:", peerConnection.iceConnectionState);
          
          // If connection state is still "new", the answer might not have been properly set
          // or the connection was reset. Try to set the remote description again.
          if (peerConnection.connectionState === "new" && !peerConnection.remoteDescription) {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Connection state is 'new' but no remote description - setting answer");
            try {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
              // eslint-disable-next-line no-console
              console.log("[WebRTC] Successfully set remote description, new signaling state:", peerConnection.signalingState);
              
              // Process any queued ICE candidates now that remote description is set
              await processQueuedIceCandidates(peerConnection, fromSocketId);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn("[WebRTC] Error setting remote description (may already be set):", error);
            }
          } else if (peerConnection.connectionState === "connected") {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] ✅ Connection already active:", fromSocketId);
          } else if (peerConnection.connectionState === "new" || peerConnection.connectionState === "connecting") {
            // Connection is still establishing - this is normal, ICE candidates need to be exchanged
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Connection still establishing:", peerConnection.connectionState, "- waiting for ICE candidates");
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] Cannot set remote answer - wrong signaling state:", peerConnection.signalingState, "for:", fromSocketId);
          return;
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn("[WebRTC] No peer connection found for answer from:", fromSocketId);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error handling WebRTC answer:", error);
    }
  }, [roomId]);

  // Handle ICE candidate
  // Process queued ICE candidates for a peer connection
  const processQueuedIceCandidates = useCallback(async (peerConnection, fromSocketId) => {
    const queue = queuedIceCandidatesRef.current.get(fromSocketId);
    if (queue && queue.length > 0) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Processing", queue.length, "queued ICE candidates for:", fromSocketId);
      
      // Verify remote description is set before processing
      if (!peerConnection.remoteDescription) {
        // eslint-disable-next-line no-console
        console.warn("[WebRTC] Cannot process queued ICE candidates - remote description not set for:", fromSocketId);
        return;
      }
      
      for (const candidate of queue) {
        try {
          // Verify candidate is valid before adding
          if (!candidate || !candidate.candidate) {
            // eslint-disable-next-line no-console
            console.warn("[WebRTC] Invalid ICE candidate in queue for:", fromSocketId);
            continue;
          }
          
          await peerConnection.addIceCandidate(candidate);
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Added queued ICE candidate from:", fromSocketId, "Type:", candidate.type);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] Error adding queued ICE candidate:", error, "for:", fromSocketId);
          
          // If candidate is invalid or duplicate, continue with next candidate
          if (error.message?.includes("Invalid") || error.message?.includes("duplicate")) {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Skipping invalid/duplicate candidate");
            continue;
          }
        }
      }
      queuedIceCandidatesRef.current.delete(fromSocketId);
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Finished processing queued ICE candidates for:", fromSocketId);
    }
  }, []);

  const handleWebRTCIceCandidate = useCallback(async (data) => {
    if (data.roomId !== roomId) {
      return;
    }

    try {
      const { fromSocketId, candidate } = data;
      const peerConnection = peerConnectionsRef.current.get(fromSocketId);
      if (!peerConnection) {
        // eslint-disable-next-line no-console
        console.warn("[WebRTC] No peer connection found for ICE candidate from:", fromSocketId);
        return;
      }

      if (!candidate) {
        return;
      }

      const iceCandidate = new RTCIceCandidate(candidate);

      // Check if remote description is set - if not, queue the candidate
      if (!peerConnection.remoteDescription) {
        // Queue the candidate
        if (!queuedIceCandidatesRef.current.has(fromSocketId)) {
          queuedIceCandidatesRef.current.set(fromSocketId, []);
        }
        queuedIceCandidatesRef.current.get(fromSocketId).push(iceCandidate);
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Queued ICE candidate from:", fromSocketId, "(remote description not set yet)");
        return;
      }

      // Remote description is set, add the candidate immediately
      try {
        // Verify candidate is valid
        if (!iceCandidate || !iceCandidate.candidate) {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] Invalid ICE candidate from:", fromSocketId);
          return;
        }
        
        await peerConnection.addIceCandidate(iceCandidate);
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Added ICE candidate from:", fromSocketId, {
          type: iceCandidate.type,
          protocol: iceCandidate.protocol,
          address: iceCandidate.address,
          port: iceCandidate.port,
          ICEState: peerConnection.iceConnectionState,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Error adding ICE candidate:", error, "from:", fromSocketId);
        
        // If it's a duplicate or invalid candidate, that's okay - just log it
        if (error.message?.includes("Invalid") || error.message?.includes("duplicate")) {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] ICE candidate is invalid/duplicate (this is normal)");
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error handling ICE candidate:", error, "from:", data?.fromSocketId);
    }
  }, [roomId]);

  // Setup native WebRTC for listener (wait for speakers)
  const setupNativeWebRTCAsListener = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionState("connected");
      setIsConnecting(false);
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Native WebRTC listener setup complete - waiting for speakers");
      // Listeners will connect to speakers when they start (handled by socket events)
    } catch (error) {
      setIsConnecting(false);
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error setting up native WebRTC as listener:", error);
      setConnectionState("error");
      throw error;
    }
  }, []);

  // Setup WebRTC for listener
  const setupAsListener = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionState("connecting");
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Setting up as listener...");

      // Wait for RTP capabilities or WebRTC config
      const capabilities = await waitForRtpCapabilities();

      // Check if we should use native WebRTC
      if (capabilities.useNativeWebRTC) {
        // Use native WebRTC
        await setupNativeWebRTCAsListener();
        return;
      }

      // Use mediasoup
      // Initialize device
      await initializeDevice(capabilities.rtpCapabilities);

      // Create recv transport
      await createRecvTransport();

      setConnectionState("connected");
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Listener setup complete");
    } catch (error) {
      // Don't show toast for mediasoup unavailable errors (already shown by VoiceRoom component)
      if (error.message?.includes("Media server is unavailable") || mediasoupUnavailableRef.current) {
        // eslint-disable-next-line no-console
        console.warn("[WebRTC] Setup cancelled - mediasoup unavailable");
        setConnectionState("error");
        // Don't throw - just return silently
        return;
      }
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error setting up as listener:", error);
      setConnectionState("error");
      toast.error(error.message || "Failed to setup audio");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [waitForRtpCapabilities, initializeDevice, createRecvTransport, setupNativeWebRTCAsListener]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    // Use functional state update to avoid stale closure issues
    setIsMicEnabled((prevEnabled) => {
      const newState = !prevEnabled;
      
      if (producerRef.current) {
        // Mediasoup mode
        if (newState) {
          producerRef.current.resume();
        } else {
          producerRef.current.pause();
        }
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Microphone toggled (mediasoup):", newState ? "ON" : "OFF");
      } else if (localStreamRef.current) {
        // Native WebRTC mode
        const audioTracks = localStreamRef.current.getAudioTracks();
        if (audioTracks.length === 0) {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] No audio tracks found in local stream");
          toast.warning("Microphone not available");
          return prevEnabled; // Don't change state if no tracks
        }
        
        audioTracks.forEach((track) => {
          track.enabled = newState;
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Audio track enabled set to:", newState, {
            trackId: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
          });
        });
        
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Microphone toggled (native WebRTC):", newState ? "ON" : "OFF", {
          tracksCount: audioTracks.length,
          allTracksEnabled: audioTracks.every(t => t.enabled === newState),
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn("[WebRTC] Cannot toggle mic - no local stream or producer available");
        // Defer toast to avoid React render warnings
        setTimeout(() => {
          toast.warning("Microphone not available. Please wait for setup to complete.");
        }, 0);
        return prevEnabled; // Don't change state if no stream
      }
      
      return newState;
    });
  }, []);

  // Cleanup consumer
  const cleanupConsumer = useCallback((producerId) => {
    const consumer = consumersRef.current.get(producerId);
    if (consumer) {
      consumer.close();
      consumersRef.current.delete(producerId);
    }

    const audio = audioElementsRef.current.get(producerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
      audioElementsRef.current.delete(producerId);
    }

    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(producerId);
      return next;
    });
  }, []);

  // Cleanup all - NO STATE UPDATES to prevent infinite loops
  // State will be updated separately when needed
  const cleanupAll = useCallback(() => {
    // Prevent concurrent cleanup calls
    if (isCleaningUpRef.current) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Cleanup already in progress, skipping");
      return;
    }
    
    isCleaningUpRef.current = true;
    // eslint-disable-next-line no-console
    console.log("[WebRTC] Cleaning up all resources...");
    
    // Close producer
    if (producerRef.current) {
      try {
        producerRef.current.close();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Error closing producer:", error);
      }
      producerRef.current = null;
    }

    // Close all consumers
    consumersRef.current.forEach((consumer) => {
      try {
        consumer.close();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Error closing consumer:", error);
      }
    });
    consumersRef.current.clear();

    // Close transports
    if (sendTransportRef.current) {
      try {
        sendTransportRef.current.close();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Error closing send transport:", error);
      }
      sendTransportRef.current = null;
    }
    if (recvTransportRef.current) {
      try {
        recvTransportRef.current.close();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Error closing recv transport:", error);
      }
      recvTransportRef.current = null;
    }

    // Remove audio elements
    audioElementsRef.current.forEach((audio) => {
      try {
        audio.pause();
        audio.srcObject = null;
        if (audio.parentNode) {
          audio.parentNode.removeChild(audio);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Error removing audio element:", error);
      }
    });
    audioElementsRef.current.clear();

    // Stop local stream
    stopLocalStream();

    // Clean up native WebRTC peer connections
    peerConnectionsRef.current.forEach((peerConnection) => {
      try {
        peerConnection.close();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Error closing peer connection:", error);
      }
    });
    peerConnectionsRef.current.clear();
    
    // Clear queued ICE candidates
    queuedIceCandidatesRef.current.clear();

    // Notify server if speaker stopped (native WebRTC)
    if (useNativeWebRTCRef.current && socket && roomId && (role === "speaker" || role === "host")) {
      socket.emit("webrtc-speaker-stopped", { roomId });
    }

    // Reset device and capabilities
    deviceRef.current = null;
    rtpCapabilitiesRef.current = null;
    rtpCapabilitiesReceivedRef.current = false;
    useNativeWebRTCRef.current = false;
    webrtcConfigRef.current = null;

    // CRITICAL: Don't update state here - it causes re-renders which trigger the effect again
    // State will be updated separately when setup starts or component unmounts
    // Use a ref to track that cleanup happened, and update state in a separate effect
    
    // Reset cleanup flag immediately (no state updates means no re-render)
    isCleaningUpRef.current = false;
    
    // eslint-disable-next-line no-console
    console.log("[WebRTC] Cleanup complete (state not updated to prevent loops)");
  }, [stopLocalStream]);

  // Setup socket listeners for mediasoup events
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleNewProducer = async (data) => {
      if (data.roomId === roomId && role === "listener") {
        try {
          await startConsuming(data.producerId);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error consuming new producer:", error);
        }
      }
    };

    const handleProducerClosed = (data) => {
      if (data.roomId === roomId) {
        cleanupConsumer(data.producerId);
      }
    };

    const handleExistingProducers = async (data) => {
      if (data.roomId === roomId && role === "listener" && data.producers) {
        for (const producer of data.producers) {
          try {
            await startConsuming(producer.producerId);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Error consuming existing producer:", error);
          }
        }
      }
    };

    const handleMutedByHost = () => {
      if (producerRef.current) {
        // Mediasoup mode
        producerRef.current.pause();
        setIsMicEnabled(false);
        toast.info("You have been muted by the host");
      } else if (localStreamRef.current) {
        // Native WebRTC mode
        const audioTracks = localStreamRef.current.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = false;
        });
        setIsMicEnabled(false);
        toast.info("You have been muted by the host");
      }
    };

    const handleUnmutedByHost = () => {
      if (producerRef.current) {
        // Mediasoup mode
        producerRef.current.resume();
        setIsMicEnabled(true);
        toast.info("You have been unmuted by the host");
      } else if (localStreamRef.current) {
        // Native WebRTC mode
        const audioTracks = localStreamRef.current.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = true;
        });
        setIsMicEnabled(true);
        toast.info("You have been unmuted by the host");
      }
    };

    const handleMediaServerError = (data) => {
      // Check if this is a mediasoup unavailable error
      // But don't block if we're using native WebRTC
      if ((data.code === "MEDIASOUP_UNAVAILABLE" || 
          data.message?.includes("media server") || 
          data.message?.includes("media capabilities")) &&
          !useNativeWebRTCRef.current) {
        // Only handle if we haven't already marked it as unavailable
        if (!mediasoupUnavailableRef.current) {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] Media server unavailable - stopping WebRTC setup");
          mediasoupUnavailableRef.current = true;
          setConnectionState("error");
          setIsConnecting(false);
          setupCompleteRef.current = false;
          // Don't show toast here - VoiceRoom component will handle it
        }
      }
    };

    // Native WebRTC handlers
    const handleExistingSpeakers = async (data) => {
      if (data.roomId === roomId && data.speakers && useNativeWebRTCRef.current) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Existing speakers for native WebRTC:", data.speakers, "My role:", role);
        // Connect to all existing speakers
        // Listeners connect to speakers, and speakers also connect to other speakers
        for (const speaker of data.speakers) {
          if (speaker.socketId && speaker.socketId !== socket.id) {
            if (role === "listener") {
              // Listener connects to speaker
              await createPeerConnectionToSpeaker(speaker.socketId);
            } else if (role === "speaker" || role === "host") {
              // Speaker/host also connects to other speakers/hosts (bidirectional)
              await createPeerConnectionToSpeaker(speaker.socketId);
            }
          }
        }
      }
    };

    const handleSpeakerStarted = async (data) => {
      if (data.roomId === roomId && useNativeWebRTCRef.current) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Speaker started (native WebRTC):", data.socketId, "My role:", role);
        // Connect to the new speaker
        // Listeners connect to speakers, and speakers also connect to other speakers
        if (data.socketId && data.socketId !== socket.id) {
          if (role === "listener") {
            // Listener connects to speaker
            await createPeerConnectionToSpeaker(data.socketId);
          } else if (role === "speaker" || role === "host") {
            // Speaker/host also connects to other speakers/hosts (bidirectional)
            await createPeerConnectionToSpeaker(data.socketId);
          }
        }
      }
    };

    const handleSpeakerStopped = (data) => {
      if (data.roomId === roomId && useNativeWebRTCRef.current) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Speaker stopped (native WebRTC):", data.socketId);
        // Clean up peer connection
        const peerConnection = peerConnectionsRef.current.get(data.socketId);
        if (peerConnection) {
          peerConnection.close();
          peerConnectionsRef.current.delete(data.socketId);
        }
        // Clear queued ICE candidates for this peer
        queuedIceCandidatesRef.current.delete(data.socketId);
        // Remove remote stream
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(data.socketId);
          return next;
        });
      }
    };

    // Native WebRTC signaling handlers
    const handleWebRTCOfferEvent = (data) => {
      if (data.roomId === roomId && useNativeWebRTCRef.current) {
        // Speakers/hosts handle offers from listeners, and also from other speakers/hosts
        if (role === "speaker" || role === "host") {
          handleWebRTCOffer(data);
        }
      }
    };

    const handleWebRTCAnswerEvent = (data) => {
      if (data.roomId === roomId && useNativeWebRTCRef.current) {
        // Both listeners and speakers can receive answers
        handleWebRTCAnswer(data);
      }
    };

    const handleWebRTCIceCandidateEvent = (data) => {
      if (data.roomId === roomId && useNativeWebRTCRef.current) {
        handleWebRTCIceCandidate(data);
      }
    };

    socket.on("new-producer", handleNewProducer);
    socket.on("producer-closed", handleProducerClosed);
    socket.on("existing-producers", handleExistingProducers);
    socket.on("existing-speakers", handleExistingSpeakers);
    socket.on("webrtc-speaker-started", handleSpeakerStarted);
    socket.on("webrtc-speaker-stopped", handleSpeakerStopped);
    socket.on("webrtc-offer", handleWebRTCOfferEvent);
    socket.on("webrtc-answer", handleWebRTCAnswerEvent);
    socket.on("webrtc-ice-candidate", handleWebRTCIceCandidateEvent);
    socket.on("muted-by-host", handleMutedByHost);
    socket.on("unmuted-by-host", handleUnmutedByHost);
    socket.on("error", handleMediaServerError);

    return () => {
      socket.off("new-producer", handleNewProducer);
      socket.off("producer-closed", handleProducerClosed);
      socket.off("existing-producers", handleExistingProducers);
      socket.off("existing-speakers", handleExistingSpeakers);
      socket.off("webrtc-speaker-started", handleSpeakerStarted);
      socket.off("webrtc-speaker-stopped", handleSpeakerStopped);
      socket.off("webrtc-offer", handleWebRTCOfferEvent);
      socket.off("webrtc-answer", handleWebRTCAnswerEvent);
      socket.off("webrtc-ice-candidate", handleWebRTCIceCandidateEvent);
      socket.off("muted-by-host", handleMutedByHost);
      socket.off("unmuted-by-host", handleUnmutedByHost);
      socket.off("error", handleMediaServerError);
    };
  }, [socket, roomId, role, startConsuming, cleanupConsumer, createPeerConnectionToSpeaker, handleWebRTCOffer, handleWebRTCAnswer, handleWebRTCIceCandidate]);

  // Handle socket reconnection
  useEffect(() => {
    if (!socket) return;

    const handleReconnect = () => {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Socket reconnected, reinitializing...");
      setConnectionState("reconnecting");
      reconnectAttemptRef.current = true;
      setupCompleteRef.current = false;
      
      // Cleanup existing resources
      // eslint-disable-next-line react-hooks/exhaustive-deps
      cleanupAll();
      
      // Reset flags
      rtpCapabilitiesReceivedRef.current = false;
      
      // Re-setup will happen automatically when role is still set
      setTimeout(() => {
        reconnectAttemptRef.current = false;
      }, 1000);
    };

    socket.on("reconnect", handleReconnect);

    return () => {
      socket.off("reconnect", handleReconnect);
    };
  }, [socket]); // Don't include cleanupAll - it's stable and causes infinite loops

  // Auto-setup based on role
  useEffect(() => {
    // Create a stable dependency key to detect actual changes
    const depsKey = socket && roomId && role 
      ? `${socket.id || 'no-socket'}-${roomId}-${role}`
      : null;
    
    // CRITICAL: Prevent infinite loops by checking if we've already processed these exact dependencies
    // Check BEFORE updating the ref
    if (depsKey && lastEffectDepsRef.current === depsKey) {
      // Same dependencies as last run - this is a duplicate run, skip it completely
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Duplicate effect run detected with same deps, skipping to prevent infinite loop");
      return;
    }
    
    // Track this run only if dependencies actually changed
    if (depsKey) {
      lastEffectDepsRef.current = depsKey;
      effectRunCountRef.current = 1; // Reset to 1 for new dependency set
    } else {
      lastEffectDepsRef.current = null;
      effectRunCountRef.current = 0;
    }
    
    // Early return if dependencies are missing
    if (!socket || !roomId || !role) {
      // Reset refs when dependencies are missing
      lastRoleRef.current = null;
      lastRoomIdRef.current = null;
      lastSetupKeyRef.current = null;
      effectRunCountRef.current = 0;
      // Don't cleanup here - cleanup will happen in cleanup function
      return;
    }
    
    // Create a stable key to track this specific setup attempt
    const setupKey = `${socket?.id || 'no-socket'}-${roomId}-${role}`;
    
    // Check if role or roomId actually changed
    const roleChanged = lastRoleRef.current !== null && lastRoleRef.current !== role;
    const roomIdChanged = lastRoomIdRef.current !== null && lastRoomIdRef.current !== roomId;
    const setupKeyChanged = lastSetupKeyRef.current !== setupKey;
    
    // Don't setup if already set up and nothing changed
    // BUT: Always allow setup if role changed to speaker/host (they need mic access)
    const roleChangedToSpeaker = roleChanged && (role === "speaker" || role === "host");
    if (setupCompleteRef.current && !roleChanged && !roomIdChanged && !setupKeyChanged && !roleChangedToSpeaker) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Skipping setup - already complete and nothing changed");
      return;
    }
    
    // If role changed to speaker/host, reset setup complete flag to allow new setup
    // CRITICAL: Reset flags BEFORE any blocking checks
    if (roleChangedToSpeaker) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Role changed to speaker/host - resetting setup to enable microphone");
      setupCompleteRef.current = false;
      // Reset setting up flag to allow new setup
      isSettingUpRef.current = false;
      reconnectAttemptRef.current = false;
      // Also reset cleanup flag if it's set
      isCleaningUpRef.current = false;
    }

    // Don't setup if mediasoup is unavailable AND we're not using native WebRTC
    // BUT: If we're a speaker/host and native WebRTC config might be coming, wait a bit
    if (mediasoupUnavailableRef.current && !useNativeWebRTCRef.current) {
      // If we're a speaker/host, the native WebRTC config might arrive via voice-room-joined
      // Give it a moment before giving up
      if (role === "speaker" || role === "host") {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Mediasoup unavailable, but waiting for native WebRTC config (role:", role, ")");
        // Don't return - let it proceed and waitForRtpCapabilities will handle it
      } else {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Skipping setup - mediasoup unavailable and native WebRTC not available");
        setConnectionState("error");
        return;
      }
    }

    // Don't setup if we're already setting up, reconnecting, or cleaning up
    // BUT: Allow setup if role changed to speaker/host (they need mic access)
    // Note: roleChangedToSpeaker already reset the flags above, so this check should pass
    if (isSettingUpRef.current || reconnectAttemptRef.current) {
      if (roleChangedToSpeaker) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Role changed to speaker/host - forcing setup despite flags being set");
        // Flags were already reset above, but double-check
        isSettingUpRef.current = false;
        reconnectAttemptRef.current = false;
      } else {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Skipping setup - already in progress or reconnecting");
        return;
      }
    }
    
    // Only skip if cleanup is actively happening (not just completed)
    if (isCleaningUpRef.current) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Skipping setup - cleanup in progress");
      return;
    }

    // If role or room changed and we had a previous setup, cleanup first
    if (setupCompleteRef.current && (roleChanged || roomIdChanged || setupKeyChanged)) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Role/room changed, cleaning up before new setup");
      setupCompleteRef.current = false;
      isSettingUpRef.current = false;
      // Cleanup immediately (no state updates, so no re-render)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      cleanupAll();
      // Update state to reflect disconnected state (but do it after cleanup)
      setRemoteStreams(new Map());
      setConnectionState("disconnected");
      // Update refs
      lastRoleRef.current = role;
      lastRoomIdRef.current = roomId;
      lastSetupKeyRef.current = setupKey;
      // Reset effect run count when dependencies actually change
      effectRunCountRef.current = 0;
      // Continue to setup after cleanup
    }

    // Update refs BEFORE starting setup to prevent duplicate runs
    lastRoleRef.current = role;
    lastRoomIdRef.current = roomId;
    lastSetupKeyRef.current = setupKey;

    // Mark as setting up to prevent concurrent calls
    isSettingUpRef.current = true;
    
    // Update connection state to "connecting" before starting setup
    setConnectionState("connecting");

    // eslint-disable-next-line no-console
    console.log("[WebRTC] Auto-setting up for role:", role, {
      roomId,
      socketId: socket?.id,
      mediasoupUnavailable: mediasoupUnavailableRef.current,
      useNativeWebRTC: useNativeWebRTCRef.current,
      hasWebRTCConfig: !!webrtcConfigRef.current,
      setupComplete: setupCompleteRef.current,
      roleChanged,
      roomIdChanged,
      setupKeyChanged,
    });
    
    let setupPromise;
    if (role === "speaker" || role === "host") {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Starting speaker/host setup - microphone will be requested");
      setupPromise = setupAsSpeaker();
    } else if (role === "listener") {
      setupPromise = setupAsListener();
    } else {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Unknown role, skipping setup:", role);
      isSettingUpRef.current = false;
      return;
    }

    setupPromise
      .then(() => {
        setupCompleteRef.current = true;
        isSettingUpRef.current = false;
        // Reset effect run count on successful setup
        effectRunCountRef.current = 0;
        // Update connection state on successful setup
        setConnectionState("connected");
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Failed to setup:", error);
        setupCompleteRef.current = false;
        isSettingUpRef.current = false;
        // Reset effect run count on error
        effectRunCountRef.current = 0;
        // Update connection state on error
        setConnectionState("error");
      });

    // Cleanup function - only runs when dependencies actually change or component unmounts
    // Store the current setup key in a closure to compare against in cleanup
    const currentSetupKeyForCleanup = setupKey;
    const currentDepsKeyForCleanup = depsKey;
    
    return () => {
      // Only cleanup if dependencies actually changed (not just re-running)
      if (lastEffectDepsRef.current !== currentDepsKeyForCleanup) {
        // Dependencies changed, cleanup is needed
        if (setupCompleteRef.current) {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Effect cleanup - dependencies changed, cleaning up");
          setupCompleteRef.current = false;
          isSettingUpRef.current = false;
          // Reset effect run count
          effectRunCountRef.current = 0;
          // Cleanup without state updates (prevents re-render loop)
          // eslint-disable-next-line react-hooks/exhaustive-deps
          cleanupAll();
          // Update state separately after cleanup completes
          setRemoteStreams(new Map());
          setConnectionState("disconnected");
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId, role]); // Don't include function dependencies - they cause infinite loops

  // Separate effect for cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup when component actually unmounts
      if (setupCompleteRef.current) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Component unmounting - cleaning up");
        // Cleanup without state updates (component is unmounting anyway)
        // eslint-disable-next-line react-hooks/exhaustive-deps
        cleanupAll();
        // Update state one final time
        setRemoteStreams(new Map());
        setConnectionState("disconnected");
      }
    };
  }, []); // Empty deps - only run on unmount

  return {
    localStream,
    remoteStreams,
    isMicEnabled,
    isConnecting,
    connectionState,
    initializeLocalStream,
    stopLocalStream,
    toggleMic,
    cleanupConsumer,
    cleanupAll,
  };
};
