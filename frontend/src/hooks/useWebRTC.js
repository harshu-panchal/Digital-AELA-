import { useRef, useEffect, useState, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { toast } from "react-toastify";

export const useWebRTC = (socket, roomId, userId, role) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // Map<producerId, MediaStream>
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producerRef = useRef(null);
  const consumersRef = useRef(new Map()); // Map<producerId, Consumer>
  const localStreamRef = useRef(null);
  const audioElementsRef = useRef(new Map()); // Map<producerId, HTMLAudioElement>
  const rtpCapabilitiesRef = useRef(null);

  // Initialize mediasoup device
  const initializeDevice = useCallback(
    async (rtpCapabilities) => {
      try {
        if (deviceRef.current) {
          return deviceRef.current;
        }

        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });

        deviceRef.current = device;
        rtpCapabilitiesRef.current = rtpCapabilities;

        return device;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error loading mediasoup device:", error);
        toast.error("Failed to initialize audio device");
        throw error;
      }
    },
    []
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

    return new Promise((resolve, reject) => {
      socket.emit("create-transport", { roomId, direction: "send" }, (error, data) => {
        if (error) {
          reject(new Error(error));
          return;
        }

        const { transport } = data;

        const sendTransport = deviceRef.current.createSendTransport({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
          sctpParameters: transport.sctpParameters,
        });

        sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
          socket.emit(
            "connect-transport",
            {
              roomId,
              transportId: sendTransport.id,
              dtlsParameters,
            },
            (error) => {
              if (error) {
                errback(new Error(error));
              } else {
                callback();
              }
            }
          );
        });

        sendTransport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
          try {
            socket.emit(
              "create-producer",
              {
                roomId,
                transportId: sendTransport.id,
                rtpParameters,
              },
              (error, data) => {
                if (error) {
                  errback(new Error(error));
                } else {
                  callback({ id: data.producer.id });
                }
              }
            );
          } catch (error) {
            errback(error);
          }
        });

        sendTransportRef.current = sendTransport;
        resolve(sendTransport);
      });
    });
  }, [socket, roomId]);

  // Create recv transport (for listeners)
  const createRecvTransport = useCallback(async () => {
    if (!socket || !roomId || !deviceRef.current) {
      throw new Error("Socket, roomId, or device not initialized");
    }

    return new Promise((resolve, reject) => {
      socket.emit("create-transport", { roomId, direction: "recv" }, (error, data) => {
        if (error) {
          reject(new Error(error));
          return;
        }

        const { transport } = data;

        const recvTransport = deviceRef.current.createRecvTransport({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
          sctpParameters: transport.sctpParameters,
        });

        recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
          socket.emit(
            "connect-transport",
            {
              roomId,
              transportId: recvTransport.id,
              dtlsParameters,
            },
            (error) => {
              if (error) {
                errback(new Error(error));
              } else {
                callback();
              }
            }
          );
        });

        recvTransportRef.current = recvTransport;
        resolve(recvTransport);
      });
    });
  }, [socket, roomId]);

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
        return consumersRef.current.get(producerId);
      }

      return new Promise((resolve, reject) => {
        socket.emit(
          "create-consumer",
          {
            roomId,
            transportId: recvTransportRef.current.id,
            producerId,
            rtpCapabilities: deviceRef.current.rtpCapabilities,
          },
          async (error, data) => {
            if (error) {
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
              reject(error);
            }
          }
        );
      });
    },
    [socket, roomId]
  );

  // Setup WebRTC for speaker/host
  const setupAsSpeaker = useCallback(async () => {
    try {
      setIsConnecting(true);

      // Wait for RTP capabilities from server
      await new Promise((resolve) => {
        const handler = (data) => {
          if (data.roomId === roomId && data.rtpCapabilities) {
            socket.off("voice-room-joined", handler);
            rtpCapabilitiesRef.current = data.rtpCapabilities;
            resolve();
          }
        };
        socket.on("voice-room-joined", handler);
      });

      // Initialize device
      await initializeDevice(rtpCapabilitiesRef.current);

      // Initialize local stream
      await initializeLocalStream();

      // Create send transport
      await createSendTransport();

      // Start producing
      await startProducing();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error setting up as speaker:", error);
      toast.error("Failed to setup audio");
    } finally {
      setIsConnecting(false);
    }
  }, [socket, roomId, initializeDevice, initializeLocalStream, createSendTransport, startProducing]);

  // Setup WebRTC for listener
  const setupAsListener = useCallback(async () => {
    try {
      setIsConnecting(true);

      // Wait for RTP capabilities from server
      await new Promise((resolve) => {
        const handler = (data) => {
          if (data.roomId === roomId && data.rtpCapabilities) {
            socket.off("voice-room-joined", handler);
            rtpCapabilitiesRef.current = data.rtpCapabilities;
            resolve();
          }
        };
        socket.on("voice-room-joined", handler);
      });

      // Initialize device
      await initializeDevice(rtpCapabilitiesRef.current);

      // Create recv transport
      await createRecvTransport();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error setting up as listener:", error);
      toast.error("Failed to setup audio");
    } finally {
      setIsConnecting(false);
    }
  }, [socket, roomId, initializeDevice, createRecvTransport]);

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
    // Close producer
    if (producerRef.current) {
      producerRef.current.close();
      producerRef.current = null;
    }

    // Close all consumers
    consumersRef.current.forEach((consumer) => {
      consumer.close();
    });
    consumersRef.current.clear();

    // Close transports
    if (sendTransportRef.current) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }
    if (recvTransportRef.current) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }

    // Remove audio elements
    audioElementsRef.current.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    });
    audioElementsRef.current.clear();

    // Stop local stream
    stopLocalStream();

    // Reset device
    deviceRef.current = null;
    rtpCapabilitiesRef.current = null;

    setRemoteStreams(new Map());
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

  // Auto-setup based on role
  useEffect(() => {
    if (!socket || !roomId || !role) return;

    if (role === "speaker" || role === "host") {
      setupAsSpeaker();
    } else if (role === "listener") {
      setupAsListener();
    }

    return () => {
      cleanupAll();
    };
  }, [socket, roomId, role, setupAsSpeaker, setupAsListener, cleanupAll]);

  return {
    localStream,
    remoteStreams,
    isMicEnabled,
    isConnecting,
    initializeLocalStream,
    stopLocalStream,
    toggleMic,
    cleanupConsumer,
    cleanupAll,
  };
};
