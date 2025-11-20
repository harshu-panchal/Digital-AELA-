import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";

// STUN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Add TURN servers here for production
    // { urls: "turn:your-turn-server.com:3478", username: "user", credential: "pass" }
  ],
};

export const useWebRTC = (socket, roomId, userId, role) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // Map<socketId, MediaStream>
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const peerConnectionsRef = useRef(new Map()); // Map<socketId, RTCPeerConnection>
  const localStreamRef = useRef(null);
  const audioElementsRef = useRef(new Map()); // Map<socketId, HTMLAudioElement>

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

  // Create peer connection for a remote peer
  const createPeerConnection = useCallback((remoteSocketId) => {
    if (peerConnectionsRef.current.has(remoteSocketId)) {
      return peerConnectionsRef.current.get(remoteSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks if we're a speaker
    if (localStreamRef.current && (role === "speaker" || role === "host")) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(remoteSocketId, remoteStream);
          return next;
        });

        // Create audio element for remote stream
        const audio = document.createElement("audio");
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.playsInline = true;
        audio.volume = 1.0;
        audioElementsRef.current.set(remoteSocketId, audio);
        document.body.appendChild(audio);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("signal", {
          toSocketId: remoteSocketId,
          type: "ice-candidate",
          payload: event.candidate,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      // eslint-disable-next-line no-console
      console.log(`[WebRTC] Connection state with ${remoteSocketId}:`, pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        // Cleanup on failure
        cleanupPeerConnection(remoteSocketId);
      }
    };

    peerConnectionsRef.current.set(remoteSocketId, pc);
    return pc;
  }, [socket, role]);

  // Cleanup peer connection
  const cleanupPeerConnection = useCallback((remoteSocketId) => {
    const pc = peerConnectionsRef.current.get(remoteSocketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(remoteSocketId);
    }

    const audio = audioElementsRef.current.get(remoteSocketId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
      audioElementsRef.current.delete(remoteSocketId);
    }

    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(remoteSocketId);
      return next;
    });
  }, []);

  // Create offer (when we're a speaker connecting to another speaker)
  const createOffer = useCallback(async (remoteSocketId) => {
    try {
      const pc = createPeerConnection(remoteSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit("signal", {
          toSocketId: remoteSocketId,
          type: "offer",
          payload: offer,
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating offer:", error);
      toast.error("Failed to establish connection");
    }
  }, [socket, createPeerConnection]);

  // Handle incoming offer
  const handleOffer = useCallback(async (fromSocketId, offer) => {
    try {
      const pc = createPeerConnection(fromSocketId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket) {
        socket.emit("signal", {
          toSocketId: fromSocketId,
          type: "answer",
          payload: answer,
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error handling offer:", error);
      toast.error("Failed to accept connection");
    }
  }, [socket, createPeerConnection]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (fromSocketId, answer) => {
    try {
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error handling answer:", error);
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (fromSocketId, candidate) => {
    try {
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error adding ICE candidate:", error);
    }
  }, []);

  // Connect to existing speakers
  const connectToSpeakers = useCallback(async (speakers) => {
    if (role === "speaker" || role === "host") {
      // Speakers connect to each other (mesh)
      for (const speaker of speakers) {
        if (speaker.socketId && speaker.userId !== userId) {
          await createOffer(speaker.socketId);
        }
      }
    } else {
      // Listeners create connections to receive audio
      for (const speaker of speakers) {
        if (speaker.socketId) {
          createPeerConnection(speaker.socketId);
          // Wait for offer from speaker
        }
      }
    }
  }, [role, userId, createOffer, createPeerConnection]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMicEnabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  }, [isMicEnabled]);

  // Setup socket listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    const handleSignal = (data) => {
      const { from, type, payload } = data;
      
      if (type === "offer") {
        handleOffer(from, payload);
      } else if (type === "answer") {
        handleAnswer(from, payload);
      } else if (type === "ice-candidate") {
        handleIceCandidate(from, payload);
      }
    };

    socket.on("signal", handleSignal);

    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket, handleOffer, handleAnswer, handleIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup all peer connections
      peerConnectionsRef.current.forEach((pc, socketId) => {
        cleanupPeerConnection(socketId);
      });
      stopLocalStream();
    };
  }, [cleanupPeerConnection, stopLocalStream]);

  // Cleanup all peer connections
  const cleanupAll = useCallback(() => {
    peerConnectionsRef.current.forEach((pc, socketId) => {
      cleanupPeerConnection(socketId);
    });
  }, [cleanupPeerConnection]);

  return {
    localStream,
    remoteStreams,
    isMicEnabled,
    isConnecting,
    initializeLocalStream,
    stopLocalStream,
    connectToSpeakers,
    toggleMic,
    cleanupPeerConnection,
    cleanupAll,
  };
};

