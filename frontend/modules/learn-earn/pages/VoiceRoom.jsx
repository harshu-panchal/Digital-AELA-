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
    initializeLocalStream, 
    stopLocalStream, 
    connectToSpeakers, 
    toggleMic,
    cleanupPeerConnection,
    cleanupAll,
  } = useWebRTC(socket, roomId, user?.id, userRole);

  // Load room data
  useEffect(() => {
    const loadRoom = async () => {
      try {
        setLoading(true);
        const response = await fetchLiveRoom(roomId);
        if (response?.room) {
          setRoom(response.room);
          
          // Determine user role
          const isHost = response.room.host === user?.id || 
                       (typeof response.room.host === "object" && response.room.host._id === user?.id);
          const isSpeaker = response.room.speakers?.some(
            (s) => s === user?.id || (typeof s === "object" && s._id === user?.id)
          );
          
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
      // Initialize local stream if speaker/host
      if (userRole === "speaker" || userRole === "host") {
        await initializeLocalStream();
      }

      // Join via socket
      socket.emit("join-voice-room", { roomId, role: userRole });

      setIsInitialized(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to join voice room:", error);
      toast.error("Failed to join voice room");
    } finally {
      setIsJoining(false);
    }
  }, [socket, isConnected, roomId, userRole, initializeLocalStream]);

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
      setParticipants(data.participants || []);
      
      // Connect to existing speakers
      if (data.participants) {
        const speakers = data.participants.filter(
          (p) => (p.role === "speaker" || p.role === "host") && p.socketId
        );
        if (speakers.length > 0) {
          connectToSpeakers(speakers);
        }
      }
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

      // If we're a speaker/host and a new participant joined, send them an offer
      if ((userRole === "speaker" || userRole === "host") && data.socketId && data.userId !== user?.id) {
        // Small delay to ensure peer connection is ready
        setTimeout(() => {
          connectToSpeakers([{ userId: data.userId, socketId: data.socketId }]);
        }, 500);
      }
      
      // If we're a listener and a new speaker joined, create peer connection to receive their audio
      if (userRole === "listener" && (data.role === "speaker" || data.role === "host") && data.socketId) {
        setTimeout(() => {
          connectToSpeakers([{ userId: data.userId, socketId: data.socketId }]);
        }, 500);
      }
    };

    const handleParticipantLeft = (data) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
      cleanupPeerConnection(data.socketId);
    };

    const handleExistingSpeakers = (data) => {
      if (data.speakers && data.speakers.length > 0) {
        connectToSpeakers(data.speakers);
      }
    };

    const handleSpeakRequested = (data) => {
      setSpeakRequests((prev) => {
        const exists = prev.find((r) => r.userId === data.userId);
        if (exists) return prev;
        return [...prev, data];
      });
    };

    const handleSpeakApproved = (data) => {
      if (data.roomId === roomId) {
        setUserRole("speaker");
        setSpeakRequests((prev) => prev.filter((r) => r.userId !== user?.id));
        toast.success("Your request to speak has been approved!");
        
        // Initialize mic and connect to other speakers
        initializeLocalStream().then(() => {
          const currentSpeakers = participants.filter(
            (p) => (p.role === "speaker" || p.role === "host") && p.socketId
          );
          connectToSpeakers(currentSpeakers);
        });
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

    socket.on("voice-room-joined", handleVoiceRoomJoined);
    socket.on("participant-joined", handleParticipantJoined);
    socket.on("participant-left", handleParticipantLeft);
    socket.on("existing-speakers", handleExistingSpeakers);
    socket.on("speak-requested", handleSpeakRequested);
    socket.on("speak-approved", handleSpeakApproved);
    socket.on("speak-rejected", handleSpeakRejected);
    socket.on("speaker-promoted", handleSpeakerPromoted);

    return () => {
      socket.off("voice-room-joined", handleVoiceRoomJoined);
      socket.off("participant-joined", handleParticipantJoined);
      socket.off("participant-left", handleParticipantLeft);
      socket.off("existing-speakers", handleExistingSpeakers);
      socket.off("speak-requested", handleSpeakRequested);
      socket.off("speak-approved", handleSpeakApproved);
      socket.off("speak-rejected", handleSpeakRejected);
      socket.off("speaker-promoted", handleSpeakerPromoted);
    };
  }, [
    socket,
    isConnected,
    roomId,
    user?.id,
    participants,
    connectToSpeakers,
    cleanupPeerConnection,
    initializeLocalStream,
  ]);

  // Request to speak
  const handleRequestToSpeak = async () => {
    if (!socket || !isConnected || isRequesting) return;

    setIsRequesting(true);
    try {
      socket.emit("request-to-speak", { roomId });
      toast.info("Request to speak sent");
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

  // Leave room
  const handleLeaveRoom = () => {
    if (socket && isConnected) {
      socket.emit("leave-voice-room", { roomId });
      stopLocalStream();
      cleanupAll();
    }
    navigate("/learn-earn/live-debates");
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
  const canApproveRequests = userRole === "host" || userRole === "speaker";
  const hasRequested = speakRequests.some((r) => r.userId === user?.id);

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
                  {speakers.map((speaker) => (
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
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs text-gray-400">Speaking</span>
                        </div>
                      </div>
                      {speaker.userId === user?.id && (
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
                    </div>
                  ))}
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
            {/* User Controls */}
            <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
              <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
                Your Controls
              </h3>
              
              {userRole === "listener" && (
                <button
                  onClick={handleRequestToSpeak}
                  disabled={isRequesting || hasRequested}
                  className="w-full rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
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
            {canApproveRequests && speakRequests.length > 0 && (
              <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
                <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">
                  Speak Requests ({speakRequests.length})
                </h3>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRoom;

