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
    if (peerConnectionsRef.current.has(speakerSocketId)) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Peer connection already exists for:", speakerSocketId);
      return;
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
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(speakerSocketId, remoteStream);
            return next;
          });

          // Create audio element and play
          const audio = document.createElement("audio");
          audio.autoplay = true;
          audio.playsInline = true;
          audio.volume = 1.0;
          audio.srcObject = remoteStream;
          
          // Append to DOM (hidden) and play
          audio.style.display = "none";
          document.body.appendChild(audio);
          
          // Explicitly play the audio
          audio.play().catch((error) => {
            // eslint-disable-next-line no-console
            console.error("[WebRTC] Error playing audio:", error);
          });
          
          audioElementsRef.current.set(speakerSocketId, audio);
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Audio element created and playing for speaker:", speakerSocketId);
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

      // Track connection state changes
      peerConnection.onconnectionstatechange = () => {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Peer connection state changed:", peerConnection.connectionState, "for:", speakerSocketId);
        if (peerConnection.connectionState === "connected") {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] ✅ Peer connection established with:", speakerSocketId);
        } else if (peerConnection.connectionState === "failed" || peerConnection.connectionState === "disconnected") {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] ⚠️ Peer connection failed/disconnected with:", speakerSocketId);
        }
      };

      // Track ICE connection state
      peerConnection.oniceconnectionstatechange = () => {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] ICE connection state:", peerConnection.iceConnectionState, "for:", speakerSocketId);
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to speaker
      socket.emit("webrtc-offer", {
        roomId,
        targetSocketId: speakerSocketId,
        offer,
      });

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
      } else {
        // Connection already exists - check if we should handle this offer
        // If connection is in "stable" state, it's already established
        // If in "have-local-offer", we're waiting for an answer, so we can't handle a new offer
        if (peerConnection.signalingState === "stable") {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Peer connection already established (stable) for:", fromSocketId, "- ignoring duplicate offer");
          return;
        } else if (peerConnection.signalingState === "have-local-offer") {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Already waiting for answer from:", fromSocketId, "- ignoring duplicate offer");
          return;
        } else if (peerConnection.signalingState === "have-remote-offer") {
          // We already have a remote offer, this is a duplicate
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Already processing offer from:", fromSocketId, "- ignoring duplicate");
          return;
        }
      }

      // Add local stream tracks
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });

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
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer
      socket.emit("webrtc-answer", {
        roomId,
        targetSocketId: fromSocketId,
        answer,
      });

      // eslint-disable-next-line no-console
      console.log("[WebRTC] Handled offer from:", fromSocketId, "Connection state:", peerConnection.connectionState, "Signaling state:", peerConnection.signalingState);
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
        // Check signaling state before setting remote description
        // We can only set remote answer if we're in "have-local-offer" state
        if (peerConnection.signalingState === "have-local-offer") {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Handled answer from:", fromSocketId, "Connection state:", peerConnection.connectionState, "Signaling state:", peerConnection.signalingState);
        } else if (peerConnection.signalingState === "stable") {
          // Connection is already established
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Connection already stable for:", fromSocketId, "- answer is duplicate, connection already established");
          // Check if connection is actually working
          if (peerConnection.connectionState === "connected" || peerConnection.connectionState === "connecting") {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Connection is active:", peerConnection.connectionState);
          }
          return;
        } else {
          // eslint-disable-next-line no-console
          console.warn("[WebRTC] Cannot set remote answer - wrong signaling state:", peerConnection.signalingState, "for:", fromSocketId);
          return;
        }
        
        // Check connection state
        peerConnection.onconnectionstatechange = () => {
          // eslint-disable-next-line no-console
          console.log("[WebRTC] Peer connection state changed:", peerConnection.connectionState, "for:", fromSocketId);
          if (peerConnection.connectionState === "connected") {
            // eslint-disable-next-line no-console
            console.log("[WebRTC] Peer connection established with:", fromSocketId);
          } else if (peerConnection.connectionState === "failed" || peerConnection.connectionState === "disconnected") {
            // eslint-disable-next-line no-console
            console.warn("[WebRTC] Peer connection failed/disconnected with:", fromSocketId);
          }
        };
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
  const handleWebRTCIceCandidate = useCallback(async (data) => {
    if (data.roomId !== roomId) {
      return;
    }

    try {
      const { fromSocketId, candidate } = data;
      const peerConnection = peerConnectionsRef.current.get(fromSocketId);
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error handling ICE candidate:", error);
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
