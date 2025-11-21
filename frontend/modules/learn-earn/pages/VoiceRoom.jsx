import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  HiOutlineMicrophone,
  HiOutlineSpeakerWave,
  HiOutlineXMark,
  HiOutlineHandRaised,
  HiOutlineCheck,
} from "react-icons/hi2";
import { HiOutlineX } from "react-icons/hi";
import { FaSpinner, FaVolumeUp, FaVolumeMute, FaMicrophoneSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useSocket } from "../../../src/hooks/useSocket";
import { useWebRTC } from "../../../src/hooks/useWebRTC";
import { fetchLiveRoom } from "../../../src/services/api/liveRooms";

const VoiceRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [speakRequests, setSpeakRequests] = useState([]);
  const [userRole, setUserRole] = useState("listener");
  const [isJoining, setIsJoining] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const audioElementsRef = useRef(new Map());

  const { 
    localStream, 
    remoteStreams, 
    isMicEnabled, 
    connectionState,
    initializeLocalStream, 
    stopLocalStream, 
    toggleMic,
    cleanupAll,
  } = useWebRTC(socket, roomId, user?.id, userRole);
  
  const [mutedParticipants, setMutedParticipants] = useState(new Set());

  // Load room data
  useEffect(() => {
    const loadRoom = async () => {
      try {
        setLoading(true);
        const response = await fetchLiveRoom(roomId);
        if (response?.room) {
          setRoom(response.room);
          
          // Determine user role - check if user is the host
          const roomHostId = response.room.host?.toString();
          const currentUserId = user?.id?.toString();
          const isHost = roomHostId && currentUserId && roomHostId === currentUserId;
          const isSpeaker = response.room.speakers?.some(
            (s) => {
              const speakerId = typeof s === "object" ? s._id?.toString() : s?.toString();
              return speakerId && currentUserId && speakerId === currentUserId;
            }
          );
          
          // Set initial role (will be updated when joining voice room)
          setUserRole(isHost ? "host" : isSpeaker ? "speaker" : "listener");
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load room:", error);
        toast.error("Failed to load room");
        navigate("/learn-earn/live-debates");
      } finally {
        setLoading(false);
      }
    };

    if (roomId && user) {
      loadRoom();
    }
  }, [roomId, user, navigate]);

  // Join voice room
  const joinVoiceRoom = useCallback(async () => {
    if (!socket || !isConnected || !roomId) {
      toast.error("Not connected to server");
      return;
    }

    setIsJoining(true);
    try {
      // Join via socket (mediasoup setup happens in useWebRTC hook)
      socket.emit("join-voice-room", { roomId, role: userRole });

      setIsInitialized(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to join voice room:", error);
      toast.error("Failed to join voice room");
    } finally {
      setIsJoining(false);
    }
  }, [socket, isConnected, roomId, userRole]);

  // Auto-join when connected
  useEffect(() => {
    if (socket && isConnected && roomId && !isInitialized && !loading) {
      joinVoiceRoom();
    }
  }, [socket, isConnected, roomId, isInitialized, loading, joinVoiceRoom]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleVoiceRoomJoined = (data) => {
      // eslint-disable-next-line no-console
      console.log("Voice room joined:", data);
      // Set participants if provided
      if (data.participants) {
        setParticipants(data.participants);
      }
      // Update user role from backend (backend auto-detects host/speaker)
      if (data.role) {
        setUserRole(data.role);
      }
      // mediasoup setup happens automatically in useWebRTC hook
    };

    const handleParticipantJoined = (data) => {
      setParticipants((prev) => {
        const exists = prev.find((p) => p.userId === data.userId);
        if (exists) {
          return prev.map((p) =>
            p.userId === data.userId ? { ...p, ...data } : p
          );
        }
        return [...prev, data];
      });
    };

    const handleParticipantsUpdated = (data) => {
      if (data.roomId === roomId && data.participants) {
        // eslint-disable-next-line no-console
        console.log("Participants updated:", data.participants);
        setParticipants(data.participants);
      }
    };

    const handleParticipantLeft = (data) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
      setMutedParticipants((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    const handleSpeakRequested = (data) => {
      // eslint-disable-next-line no-console
      console.log("[Frontend] Received speak-requested event:", data);
      if (data.roomId !== roomId) {
        // eslint-disable-next-line no-console
        console.log("[Frontend] Request is for different room, ignoring");
        return;
      }
      setSpeakRequests((prev) => {
        const exists = prev.find((r) => r.userId === data.userId);
        if (exists) {
          // Update existing request (in case user rejoined with new socketId)
          // eslint-disable-next-line no-console
          console.log("[Frontend] Updating existing request for user:", data.userId);
          return prev.map((r) =>
            r.userId === data.userId ? { ...r, ...data } : r
          );
        }
        // eslint-disable-next-line no-console
        console.log("[Frontend] Adding new request for user:", data.userId);
        return [...prev, data];
      });
    };

    const handleExistingSpeakRequests = (data) => {
      // eslint-disable-next-line no-console
      console.log("[Frontend] Received existing-speak-requests:", data);
      if (data.roomId === roomId && data.requests) {
        // eslint-disable-next-line no-console
        console.log("[Frontend] Setting", data.requests.length, "existing requests");
        setSpeakRequests(data.requests);
      }
    };

    const handleSpeakApproved = (data) => {
      if (data.roomId === roomId) {
        setUserRole("speaker");
        setSpeakRequests((prev) => prev.filter((r) => r.userId !== user?.id));
        toast.success("Your request to speak has been approved!");
        // mediasoup setup happens automatically in useWebRTC hook when role changes
      }
    };

    const handleSpeakRejected = (data) => {
      if (data.roomId === roomId) {
        setSpeakRequests((prev) => prev.filter((r) => r.userId !== user?.id));
        toast.info("Your request to speak was rejected");
      }
    };

    const handleSpeakerPromoted = (data) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === data.userId ? { ...p, role: "speaker" } : p
        )
      );
    };

    const handleParticipantMuted = (data) => {
      if (data.roomId === roomId) {
        setMutedParticipants((prev) => new Set(prev).add(data.userId));
      }
    };

    const handleParticipantUnmuted = (data) => {
      if (data.roomId === roomId) {
        setMutedParticipants((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    const handleError = (data) => {
      // eslint-disable-next-line no-console
      console.error("[VoiceRoom] Socket error:", data);
      const errorMessage = data.message || "An error occurred";
      
      // Handle specific error types
      if (errorMessage.includes("Room not found") || errorMessage.includes("Invalid room ID")) {
        toast.error("Room not found");
        navigate("/learn-earn/live-debates");
      } else if (errorMessage.includes("ended")) {
        toast.error("This room has ended");
        navigate("/learn-earn/live-debates");
      } else if (errorMessage.includes("not started")) {
        toast.error("Room has not started yet");
      } else if (errorMessage.includes("not live")) {
        toast.error("Room is not live");
      } else {
        toast.error(errorMessage);
      }
    };

    socket.on("voice-room-joined", handleVoiceRoomJoined);
    socket.on("participant-joined", handleParticipantJoined);
    socket.on("participant-left", handleParticipantLeft);
    socket.on("participants-updated", handleParticipantsUpdated);
    socket.on("speak-requested", handleSpeakRequested);
    socket.on("existing-speak-requests", handleExistingSpeakRequests);
    socket.on("speak-approved", handleSpeakApproved);
    socket.on("speak-rejected", handleSpeakRejected);
    socket.on("speaker-promoted", handleSpeakerPromoted);
    socket.on("participant-muted", handleParticipantMuted);
    socket.on("participant-unmuted", handleParticipantUnmuted);
    socket.on("error", handleError);

    return () => {
      socket.off("voice-room-joined", handleVoiceRoomJoined);
      socket.off("participant-joined", handleParticipantJoined);
      socket.off("participant-left", handleParticipantLeft);
      socket.off("participants-updated", handleParticipantsUpdated);
      socket.off("speak-requested", handleSpeakRequested);
      socket.off("existing-speak-requests", handleExistingSpeakRequests);
      socket.off("speak-approved", handleSpeakApproved);
      socket.off("speak-rejected", handleSpeakRejected);
      socket.off("speaker-promoted", handleSpeakerPromoted);
      socket.off("participant-muted", handleParticipantMuted);
      socket.off("participant-unmuted", handleParticipantUnmuted);
      socket.off("error", handleError);
    };
  }, [socket, isConnected, roomId, user?.id, navigate]);

  // Request to speak
  const handleRequestToSpeak = async (e) => {
    // Prevent default and stop propagation for mobile
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // eslint-disable-next-line no-console
    console.log("Request to speak clicked", { socket: !!socket, isConnected, isRequesting, hasRequested });

    if (!socket || !isConnected) {
      toast.error("Not connected to server. Please wait...");
      return;
    }

    if (isRequesting) {
      // eslint-disable-next-line no-console
      console.log("Already requesting, ignoring click");
      return;
    }

    if (hasRequested) {
      toast.info("You have already requested to speak. Please wait for approval.");
      return;
    }

    // Check if there are hosts/speakers in the room
    // Check participants list (people who have joined the voice room)
    const hasHostsOrSpeakersInVoiceRoom = participants.some(
      (p) => (p.role === "host" || p.role === "speaker") && p.userId !== user?.id
    );
    
    // Also check if room has a host assigned (even if they haven't joined voice room yet)
    let roomHasHost = false;
    if (room) {
      const roomHostId = typeof room.host === "object" ? room.host._id : room.host;
      const currentUserId = user?.id;
      if (roomHostId && roomHostId !== currentUserId) {
        roomHasHost = true;
      }
      if (!roomHasHost && room.speakers && Array.isArray(room.speakers)) {
        roomHasHost = room.speakers.some((s) => {
          const speakerId = typeof s === "object" ? s._id : s;
          return speakerId && speakerId !== currentUserId;
        });
      }
    }

    const hasHostsOrSpeakers = hasHostsOrSpeakersInVoiceRoom || roomHasHost;

    if (!hasHostsOrSpeakers) {
      toast.warning("No hosts or speakers in the room. Your request will be pending until someone joins as host.");
    }

    setIsRequesting(true);
    try {
      // eslint-disable-next-line no-console
      console.log("Emitting request-to-speak", { roomId });
      socket.emit("request-to-speak", { roomId });
      if (hasHostsOrSpeakers) {
        toast.info("Request to speak sent. Waiting for host/speaker approval...");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to request to speak:", error);
      toast.error("Failed to request to speak");
    } finally {
      setIsRequesting(false);
    }
  };

  // Approve speak request
  const handleApproveSpeak = (requesterSocketId, requesterUserId) => {
    if (!socket || !isConnected) return;
    if (userRole !== "host" && userRole !== "speaker") return;

    socket.emit("approve-speak", {
      roomId,
      requesterSocketId,
      requesterUserId,
    });
    setSpeakRequests((prev) => prev.filter((r) => r.userId !== requesterUserId));
  };

  // Reject speak request
  const handleRejectSpeak = (requesterSocketId, requesterUserId) => {
    if (!socket || !isConnected) return;
    if (userRole !== "host" && userRole !== "speaker") return;

    socket.emit("reject-speak", {
      roomId,
      requesterSocketId,
      requesterUserId,
    });
    setSpeakRequests((prev) => prev.filter((r) => r.userId !== requesterUserId));
  };

  // Host mute/unmute participant
  const handleMuteParticipant = (targetSocketId, targetUserId) => {
    if (!socket || !isConnected) return;
    if (userRole !== "host") return;

    socket.emit("mute-participant", {
      roomId,
      targetSocketId,
      targetUserId,
    });
  };

  const handleUnmuteParticipant = (targetSocketId, targetUserId) => {
    if (!socket || !isConnected) return;
    if (userRole !== "host") return;

    socket.emit("unmute-participant", {
      roomId,
      targetSocketId,
      targetUserId,
    });
  };

  // Leave room
  const handleLeaveRoom = async () => {
    try {
      if (socket && isConnected && roomId) {
        socket.emit("leave-voice-room", { roomId });
        // Small delay to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      stopLocalStream();
      cleanupAll();
      navigate("/learn-earn/live-debates");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error leaving room:", error);
      // Navigate anyway
      navigate("/learn-earn/live-debates");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket && isConnected) {
        socket.emit("leave-voice-room", { roomId });
      }
      stopLocalStream();
      cleanupAll();
    };
  }, [socket, isConnected, roomId, stopLocalStream, cleanupAll]);

  // Adjust volume for all audio elements
  useEffect(() => {
    // Find all audio elements created by WebRTC
    const audioElements = document.querySelectorAll("audio[srcObject]");
    audioElements.forEach((audio) => {
      audio.volume = isMuted ? 0 : volume;
    });
  }, [volume, isMuted]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Room not found</p>
      </div>
    );
  }

  const speakers = participants.filter((p) => p.role === "speaker" || p.role === "host");
  const listeners = participants.filter((p) => p.role === "listener");
  const canApproveRequests = userRole === "host";
  const hasRequested = speakRequests.some((r) => r.userId === user?.id);
  const hasHostsOrSpeakers = speakers.length > 0;

  // Debug logging
  useEffect(() => {
    if (userRole === "host") {
      // eslint-disable-next-line no-console
      console.log("[VoiceRoom] Host - speakRequests state:", speakRequests);
      // eslint-disable-next-line no-console
      console.log("[VoiceRoom] Host - canApproveRequests:", canApproveRequests);
      // eslint-disable-next-line no-console
      console.log("[VoiceRoom] Host - userRole:", userRole);
    }
  }, [speakRequests, canApproveRequests, userRole]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-black to-[#0a0a0a] p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-[#101010] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">{room.title || room.topic}</h1>
            <p className="mt-1 text-sm text-gray-400">{room.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span className="rounded-full border border-white/10 px-3 py-1">
                {speakers.length} {speakers.length === 1 ? "Speaker" : "Speakers"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                {listeners.length} {listeners.length === 1 ? "Listener" : "Listeners"}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 capitalize">
                {userRole}
              </span>
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20">
            <HiOutlineXMark className="h-5 w-5" />
            Leave Room
          </button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Speakers Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Speakers</h2>
              {speakers.length === 0 ? (
                <p className="text-sm text-gray-400">No active speakers</p>
              ) : (
                <div className="space-y-3">
                  {speakers.map((speaker) => {
                    const isMuted = mutedParticipants.has(speaker.userId);
                    const isCurrentUser = speaker.userId === user?.id;
                    const isHost = userRole === "host";
                    const canMute = isHost && !isCurrentUser;

                    return (
                      <div
                        key={speaker.userId}
                        className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#151515] p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#E5C158] text-sm font-semibold text-black">
                          {speaker.userName?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {speaker.userName || "Speaker"}
                            {speaker.role === "host" && (
                              <span className="ml-2 text-xs text-[#D4AF37]">(Host)</span>
                            )}
                            {isMuted && (
                              <span className="ml-2 text-xs text-red-400">(Muted)</span>
                            )}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {isMuted ? (
                              <>
                                <div className="h-2 w-2 rounded-full bg-red-400" />
                                <span className="text-xs text-gray-400">Muted</span>
                              </>
                            ) : (
                              <>
                                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs text-gray-400">Speaking</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCurrentUser && (
                            <button
                              onClick={toggleMic}
                              className={`rounded-lg p-2 transition ${
                                isMicEnabled
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}>
                              {isMicEnabled ? (
                                <HiOutlineMicrophone className="h-5 w-5" />
                              ) : (
                                <FaMicrophoneSlash className="h-5 w-5" />
                              )}
                            </button>
                          )}
                          {canMute && (
                            <button
                              onClick={() =>
                                isMuted
                                  ? handleUnmuteParticipant(speaker.socketId, speaker.userId)
                                  : handleMuteParticipant(speaker.socketId, speaker.userId)
                              }
                              className={`rounded-lg p-2 transition ${
                                isMuted
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                              title={isMuted ? "Unmute" : "Mute"}>
                              {isMuted ? (
                                <HiOutlineMicrophone className="h-5 w-5" />
                              ) : (
                                <FaMicrophoneSlash className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Listeners Section */}
            <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Listeners ({listeners.length})</h2>
              {listeners.length === 0 ? (
                <p className="text-sm text-gray-400">No listeners</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {listeners.slice(0, 8).map((listener) => (
                    <div
                      key={listener.userId}
                      className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#151515] p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-xs font-medium text-white">
                        {listener.userName?.[0]?.toUpperCase() || "L"}
                      </div>
                      <p className="flex-1 truncate text-xs text-gray-300">
                        {listener.userName || "Listener"}
                      </p>
                    </div>
                  ))}
                  {listeners.length > 8 && (
                    <div className="flex items-center justify-center rounded-lg border border-white/5 bg-[#151515] p-3 text-xs text-gray-400">
                      +{listeners.length - 8} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="rounded-3xl border border-white/5 bg-[#101010] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Connection Status
                </span>
                <div className="flex items-center gap-2">
                  {connectionState === "connected" && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400">Connected</span>
                    </>
                  )}
                  {connectionState === "connecting" && (
                    <>
                      <FaSpinner className="h-3 w-3 animate-spin text-yellow-400" />
                      <span className="text-xs text-yellow-400">Connecting...</span>
                    </>
                  )}
                  {connectionState === "reconnecting" && (
                    <>
                      <FaSpinner className="h-3 w-3 animate-spin text-orange-400" />
                      <span className="text-xs text-orange-400">Reconnecting...</span>
                    </>
                  )}
                  {connectionState === "error" && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-red-400" />
                      <span className="text-xs text-red-400">Error</span>
                      <button
                        onClick={joinVoiceRoom}
                        className="ml-2 rounded px-2 py-1 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">
                        Retry
                      </button>
                    </>
                  )}
                  {connectionState === "disconnected" && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      <span className="text-xs text-gray-400">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* User Controls */}
            <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
              <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
                Your Controls
              </h3>
              
              {userRole === "listener" && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleRequestToSpeak}
                    onTouchStart={(e) => {
                      // Prevent double-tap zoom on mobile
                      if (e.touches.length > 1) {
                        e.preventDefault();
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isRequesting && !hasRequested) {
                        handleRequestToSpeak(e);
                      }
                    }}
                    disabled={isRequesting || hasRequested}
                    className="w-full rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                      WebkitTouchCallout: 'none',
                      userSelect: 'none',
                      cursor: (isRequesting || hasRequested) ? 'not-allowed' : 'pointer'
                    }}>
                    {isRequesting ? (
                      <>
                        <FaSpinner className="mr-2 inline h-4 w-4 animate-spin" />
                        Requesting...
                      </>
                    ) : hasRequested ? (
                      <>
                        <HiOutlineHandRaised className="mr-2 inline h-4 w-4" />
                        Request Pending
                      </>
                    ) : (
                      <>
                        <HiOutlineHandRaised className="mr-2 inline h-4 w-4" />
                        Request to Speak
                      </>
                    )}
                  </button>
                  {hasRequested && (
                    <p className="text-xs text-gray-400 text-center">
                      {hasHostsOrSpeakers 
                        ? "Waiting for host/speaker approval..."
                        : "No hosts/speakers in room. Request will be visible when they join."}
                    </p>
                  )}
                </div>
              )}

              {(userRole === "speaker" || userRole === "host") && (
                <div className="space-y-3">
                  <button
                    onClick={toggleMic}
                    className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      isMicEnabled
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-gray-500/40 bg-gray-500/10 text-gray-400"
                    }`}>
                    {isMicEnabled ? (
                      <>
                        <HiOutlineMicrophone className="mr-2 inline h-4 w-4" />
                        Mic On
                      </>
                    ) : (
                      <>
                        <FaMicrophoneSlash className="mr-2 inline h-4 w-4" />
                        Mic Off
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Volume Control */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Volume</span>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-gray-400 hover:text-white">
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Speak Requests (for hosts/speakers) */}
            {canApproveRequests && (
              <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
                <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
                  Speak Requests {speakRequests.length > 0 && `(${speakRequests.length})`}
                </h3>
                {speakRequests.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No pending requests
                  </p>
                ) : (
                <div className="space-y-3">
                  {speakRequests.map((request) => (
                    <div
                      key={request.userId}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#151515] p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-medium text-black">
                        {request.userName?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white">
                          {request.userName || "User"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveSpeak(request.socketId, request.userId)}
                          className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-300 transition hover:bg-emerald-500/30">
                          <HiOutlineCheck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRejectSpeak(request.socketId, request.userId)}
                          className="rounded-lg bg-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/30">
                          <HiOutlineX className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRoom;

