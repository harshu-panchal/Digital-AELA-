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

  // Wait for RTP capabilities with timeout and race condition fix
  const waitForRtpCapabilities = useCallback(async () => {
    // Check if already received
    if (rtpCapabilitiesReceivedRef.current && rtpCapabilitiesRef.current) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] RTP capabilities already received");
      return rtpCapabilitiesRef.current;
    }

    // Set up listener BEFORE checking (fixes race condition)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off("voice-room-joined", handler);
        reject(new Error("Timeout waiting for RTP capabilities"));
      }, 10000);

      const handler = (data) => {
        if (data.roomId === roomId && data.rtpCapabilities) {
          clearTimeout(timeout);
          socket.off("voice-room-joined", handler);
          rtpCapabilitiesRef.current = data.rtpCapabilities;
          rtpCapabilitiesReceivedRef.current = true;
          // eslint-disable-next-line no-console
          console.log("[WebRTC] RTP capabilities received");
          resolve(data.rtpCapabilities);
        }
      };

      // Set up listener first
      socket.on("voice-room-joined", handler);

      // Check again in case event arrived before listener was set up
      if (rtpCapabilitiesReceivedRef.current && rtpCapabilitiesRef.current) {
        clearTimeout(timeout);
        socket.off("voice-room-joined", handler);
        resolve(rtpCapabilitiesRef.current);
      }
    });
  }, [socket, roomId]);

  // Setup WebRTC for speaker/host
  const setupAsSpeaker = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionState("connecting");
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Setting up as speaker/host...");

      // Wait for RTP capabilities from server (with timeout)
      const rtpCapabilities = await waitForRtpCapabilities();

      // Initialize device
      await initializeDevice(rtpCapabilities);

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
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error setting up as speaker:", error);
      setConnectionState("error");
      toast.error(error.message || "Failed to setup audio");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [waitForRtpCapabilities, initializeDevice, initializeLocalStream, createSendTransport, startProducing]);

  // Setup WebRTC for listener
  const setupAsListener = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionState("connecting");
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Setting up as listener...");

      // Wait for RTP capabilities from server (with timeout)
      const rtpCapabilities = await waitForRtpCapabilities();

      // Initialize device
      await initializeDevice(rtpCapabilities);

      // Create recv transport
      await createRecvTransport();

      setConnectionState("connected");
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Listener setup complete");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[WebRTC] Error setting up as listener:", error);
      setConnectionState("error");
      toast.error(error.message || "Failed to setup audio");
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [waitForRtpCapabilities, initializeDevice, createRecvTransport]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (producerRef.current) {
      if (isMicEnabled) {
        producerRef.current.pause();
      } else {
        producerRef.current.resume();
      }
      setIsMicEnabled(!isMicEnabled);
    } else if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMicEnabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  }, [isMicEnabled]);

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

  // Cleanup all
  const cleanupAll = useCallback(() => {
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

    // Reset device and capabilities
    deviceRef.current = null;
    rtpCapabilitiesRef.current = null;
    rtpCapabilitiesReceivedRef.current = false;

    setRemoteStreams(new Map());
    setConnectionState("disconnected");
    // eslint-disable-next-line no-console
    console.log("[WebRTC] Cleanup complete");
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
        producerRef.current.pause();
        setIsMicEnabled(false);
        toast.info("You have been muted by the host");
      }
    };

    const handleUnmutedByHost = () => {
      if (producerRef.current) {
        producerRef.current.resume();
        setIsMicEnabled(true);
        toast.info("You have been unmuted by the host");
      }
    };

    socket.on("new-producer", handleNewProducer);
    socket.on("producer-closed", handleProducerClosed);
    socket.on("existing-producers", handleExistingProducers);
    socket.on("muted-by-host", handleMutedByHost);
    socket.on("unmuted-by-host", handleUnmutedByHost);

    return () => {
      socket.off("new-producer", handleNewProducer);
      socket.off("producer-closed", handleProducerClosed);
      socket.off("existing-producers", handleExistingProducers);
      socket.off("muted-by-host", handleMutedByHost);
      socket.off("unmuted-by-host", handleUnmutedByHost);
    };
  }, [socket, roomId, role, startConsuming, cleanupConsumer]);

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
  }, [socket]); // Remove cleanupAll from dependencies

  // Auto-setup based on role
  useEffect(() => {
    if (!socket || !roomId || !role) {
      // Cleanup if we lose socket, roomId, or role
      if (setupCompleteRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        cleanupAll();
        setupCompleteRef.current = false;
      }
      lastRoleRef.current = null;
      lastRoomIdRef.current = null;
      return;
    }
    
    // Check if role or roomId actually changed
    const roleChanged = lastRoleRef.current !== null && lastRoleRef.current !== role;
    const roomIdChanged = lastRoomIdRef.current !== null && lastRoomIdRef.current !== roomId;
    
    // Don't setup if already set up and nothing changed
    if (setupCompleteRef.current && !roleChanged && !roomIdChanged) {
      return;
    }
    
    // Don't setup if we're in the middle of a reconnection
    if (reconnectAttemptRef.current) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Skipping setup during reconnection");
      return;
    }

    // Cleanup if role or room changed (before updating refs)
    if (setupCompleteRef.current && (roleChanged || roomIdChanged)) {
      // eslint-disable-next-line no-console
      console.log("[WebRTC] Cleaning up due to role/room change");
      // eslint-disable-next-line react-hooks/exhaustive-deps
      cleanupAll();
      setupCompleteRef.current = false;
    }

    // Update refs
    lastRoleRef.current = role;
    lastRoomIdRef.current = roomId;

    // eslint-disable-next-line no-console
    console.log("[WebRTC] Auto-setting up for role:", role);
    
    let setupPromise;
    if (role === "speaker" || role === "host") {
      setupPromise = setupAsSpeaker();
    } else if (role === "listener") {
      setupPromise = setupAsListener();
    } else {
      return;
    }

    setupPromise
      .then(() => {
        setupCompleteRef.current = true;
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("[WebRTC] Failed to setup:", error);
        setupCompleteRef.current = false;
      });

    // No cleanup function here - we handle cleanup in the effect body to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId, role]); // setupAsSpeaker, setupAsListener, cleanupAll are stable with useCallback

  // Separate effect for cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup when component actually unmounts
      if (setupCompleteRef.current) {
        // eslint-disable-next-line no-console
        console.log("[WebRTC] Component unmounting - cleaning up");
        // eslint-disable-next-line react-hooks/exhaustive-deps
        cleanupAll();
      }
    };
  }, []); // Empty deps - only run on mount/unmount

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
