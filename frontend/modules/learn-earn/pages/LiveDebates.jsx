import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { useTimer } from "react-timer-hook";
import {
  HiOutlineMicrophone,
  HiOutlineNoSymbol,
  HiOutlineSpeakerWave,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineTrash,
} from "react-icons/hi2";
import { FaVoteYea, FaSpinner, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useSocket } from "../../../src/hooks/useSocket";
import {
  fetchLiveRooms,
  voteOnDebate,
  joinRoom,
  leaveRoom,
  createLiveRoom,
  deleteLiveRoom,
} from "../../../src/services/api/liveRooms";

const DebateCard = ({ room, onVote, onDelete, socket, isConnected, isVoting, currentUserId }) => {
  const navigate = useNavigate();
  const [micEnabled, setMicEnabled] = useState(true);
  const isHost = currentUserId && room.host && currentUserId.toString() === room.host.toString();
  const [localVotes, setLocalVotes] = useState({
    for: room.forVotes || 0,
    against: room.againstVotes || 0,
  });

  // Update local votes when room data changes
  useEffect(() => {
    setLocalVotes({
      for: room.forVotes || 0,
      against: room.againstVotes || 0,
    });
  }, [room.forVotes, room.againstVotes]);

  // Listen for real-time vote updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleVoteUpdate = (data) => {
      if (data.roomId === room.id) {
        setLocalVotes({
          for: data.forVotes,
          against: data.againstVotes,
        });
      }
    };

    socket.on("vote_update", handleVoteUpdate);

    return () => {
      socket.off("vote_update", handleVoteUpdate);
    };
  }, [socket, isConnected, room.id]);

  const expiry = useMemo(() => {
    if (room.status === "live") {
      // Room is already live, show as live
      return new Date(Date.now() - 1000); // Past time so timer shows 00:00
    }
    if (room.scheduledStart) {
      const scheduled = new Date(room.scheduledStart);
      const now = new Date();
      // If scheduled time has passed, room should be live
      if (scheduled <= now) {
        return new Date(Date.now() - 1000); // Past time so timer shows 00:00
      }
      return scheduled;
    }
    const end = new Date();
    end.setMinutes(end.getMinutes() + (room.startInMinutes || 0));
    return end;
  }, [room.startInMinutes, room.scheduledStart, room.status]);

  const { minutes, seconds } = useTimer({
    expiryTimestamp: expiry,
    autoStart: true,
  });

  const isLive = room.status === "live" || (room.scheduledStart && new Date(room.scheduledStart) <= new Date());

  const totalVotes = localVotes.for + localVotes.against || 1;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.28 }}
      className="space-y-4 rounded-3xl border border-[#D4AF37]/20 bg-[#101010] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Featured debate</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{room.topic}</h3>
          <p className="mt-1 text-xs text-gray-400">Speakers: {room.speakers?.join(" · ") || "TBD"}</p>
          {room.description && (
            <p className="mt-2 text-sm text-gray-300 truncate">{room.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-white/10 px-4 py-2 text-xs text-gray-300">
            {isLive ? (
              <span className="font-semibold text-green-400">● Live</span>
            ) : (
              <>
            Starts in <span className="font-semibold text-white">{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}</span>
              </>
            )}
          </div>
          {isHost && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
                  onDelete(room.id);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400/60 hover:bg-red-500/20"
              title="Delete room">
              <HiOutlineTrash className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>


      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMicEnabled((prev) => !prev)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${
            micEnabled
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              : "border-white/10 bg-[#151515] text-gray-300"
          }`}>
          {micEnabled ? <HiOutlineMicrophone className="h-4 w-4" /> : <HiOutlineNoSymbol className="h-4 w-4" />}
          Mic {micEnabled ? "on" : "off"}
        </button>
        <span className="rounded-full border border-white/10 px-4 py-2 text-gray-300">Audience votes: {totalVotes}</span>
      </div>

      {room.status === "live" && (
        <button
          type="button"
          onClick={() => navigate(`/learn-earn/live-debate-room/voice-room/${room.id}`)}
          className="mt-4 w-full rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110">
          <HiOutlineArrowRight className="mr-2 inline h-4 w-4" />
          Join Voice Room
        </button>
      )}
    </Motion.div>
  );
};

const LiveDebates = () => {
  const { user: authUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [liveDebates, setLiveDebates] = useState([]);
  const [openRooms, setOpenRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingRooms, setVotingRooms] = useState(new Set());
  const joinedRoomsRef = useRef(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    description: "",
    scheduledStart: "",
    type: "debate",
    startImmediately: false,
  });

  // Load live rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        const response = await fetchLiveRooms();
        if (response?.rooms) {
          const debates = response.rooms.filter((r) => r.type === "debate");
          const open = response.rooms.filter((r) => r.type === "open-room");
          setLiveDebates(debates);
          setOpenRooms(open);

          // Note: We don't join rooms here to avoid inflating listener counts.
          // Listener counts should only increment when users actually enter voice rooms.
          // Socket updates for room changes will still work via global events or when needed.
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load live rooms:", error);
        toast.error("Failed to load live debates");
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [socket, isConnected]);

  // Listen for real-time room updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRoomUpdate = (data) => {
      setLiveDebates((prev) =>
        prev.map((room) =>
          room.id === data.roomId
            ? { ...room, listeners: data.listeners, status: data.status || room.status }
            : room
        )
      );
      setOpenRooms((prev) =>
        prev.map((room) =>
          room.id === data.roomId
            ? { ...room, listeners: data.listeners, status: data.status || room.status }
            : room
        )
      );
    };

    const handleVoteUpdate = (data) => {
      setLiveDebates((prev) =>
        prev.map((room) =>
          room.id === data.roomId
            ? {
                ...room,
                forVotes: data.forVotes,
                againstVotes: data.againstVotes,
              }
            : room
        )
      );
    };

    socket.on("room_update", handleRoomUpdate);
    socket.on("vote_update", handleVoteUpdate);

    return () => {
      socket.off("room_update", handleRoomUpdate);
      socket.off("vote_update", handleVoteUpdate);
    };
  }, [socket, isConnected]);

  // Cleanup: Leave all rooms on unmount
  useEffect(() => {
    return () => {
      if (socket && isConnected) {
        joinedRoomsRef.current.forEach((roomId) => {
          socket.emit("leave_room", { roomId });
        });
        joinedRoomsRef.current.clear();
      }
    };
  }, [socket, isConnected]);

  const handleVote = async (roomId, side) => {
    // Check if user is authenticated
    if (!authUser) {
      toast.info("Please sign in to vote", {
        icon: "🔐",
      });
      navigate("/login/student", {
        state: { from: "/learn-earn/live-debate-room" },
      });
      return;
    }

    if (votingRooms.has(roomId)) return;

    setVotingRooms((prev) => new Set(prev).add(roomId));

    try {
      // Send vote via Socket.io for real-time
      if (socket && isConnected) {
        socket.emit("vote_debate", { roomId, side });
      }

      // Also send via REST API as backup
      await voteOnDebate(roomId, side);

      toast.success(`Vote cast for ${side === "for" ? "For" : "Against"}`, {
        icon: <FaVoteYea />,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to vote:", error);
      toast.error("Failed to cast vote. Please try again.");
    } finally {
      setVotingRooms((prev) => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    }
  };

  const handleCreateDebate = async (e) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!authUser) {
      toast.info("Please sign in to create a debate", {
        icon: "🔐",
      });
      navigate("/login/student", {
        state: { from: "/learn-earn/live-debate-room" },
      });
      return;
    }

    if (!formData.title || !formData.topic) {
      toast.error("Please fill in title and topic");
      return;
    }

    setCreating(true);

    try {
      // Calculate scheduled start time
      let scheduledStart = formData.scheduledStart;
      if (formData.startImmediately) {
        // Start immediately - set to current time
        scheduledStart = new Date().toISOString();
      } else if (!scheduledStart) {
        // Default: 15 minutes from now
        const futureDate = new Date();
        futureDate.setMinutes(futureDate.getMinutes() + 15);
        scheduledStart = futureDate.toISOString();
      }

      const response = await createLiveRoom({
        title: formData.title,
        topic: formData.topic,
        description: formData.description || "",
        type: "debate",
        scheduledStart,
        startImmediately: formData.startImmediately,
      });

      if (response?.room) {
        toast.success("Debate room created successfully!", { icon: "🎉" });
        
        // Extract room ID (could be _id or id)
        const roomId = response.room._id?.toString() || response.room.id?.toString();
        
        // Add the newly created room directly to state (more reliable than refetching)
        const newRoom = response.room;
        if (newRoom.type === "debate") {
          setLiveDebates((prev) => [newRoom, ...prev]);
        } else if (newRoom.type === "open-room") {
          setOpenRooms((prev) => [newRoom, ...prev]);
        }

          // Join new room via Socket.io
          if (socket && isConnected && roomId) {
            socket.emit("join_room", { roomId });
            joinedRoomsRef.current.add(roomId);
        }

        // Reset form and close modal
        setFormData({
          title: "",
          topic: "",
          description: "",
          scheduledStart: "",
          type: "debate",
          startImmediately: false,
        });
        setShowCreateModal(false);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to create debate:", error);
      const errorMessage =
        error.details?.error?.message ||
        error.message ||
        "Failed to create debate room. Please try again.";
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!authUser) {
      toast.error("You must be logged in to delete a room");
      return;
    }

    try {
      await deleteLiveRoom(roomId);
      toast.success("Room deleted successfully", { icon: "🗑️" });

      // Remove from state
      setLiveDebates((prev) => prev.filter((r) => r.id !== roomId));
      setOpenRooms((prev) => prev.filter((r) => r.id !== roomId));

      // Leave room via Socket.io
      if (socket && isConnected) {
        socket.emit("leave_room", { roomId });
        joinedRoomsRef.current.delete(roomId);
      }

      // Navigate back if we're in the voice room
      if (window.location.pathname.includes(`/voice-room/${roomId}`)) {
        navigate("/learn-earn/live-debate-room");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete room:", error);
      toast.error(
        error.response?.data?.error?.message || "Failed to delete room. Please try again."
      );
    }
  };

  // Listen for room deletion events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRoomDeleted = (data) => {
      const deletedRoomId = data.roomId;
      
      // Remove from state
      setLiveDebates((prev) => prev.filter((r) => r.id !== deletedRoomId));
      setOpenRooms((prev) => prev.filter((r) => r.id !== deletedRoomId));
      
      // Leave room via Socket.io
      if (joinedRoomsRef.current.has(deletedRoomId)) {
        socket.emit("leave_room", { roomId: deletedRoomId });
        joinedRoomsRef.current.delete(deletedRoomId);
      }

      // Navigate back if we're in the deleted voice room
      if (window.location.pathname.includes(`/voice-room/${deletedRoomId}`)) {
        toast.info("This room has been deleted by the host");
        navigate("/learn-earn/live-debate-room");
      }
    };

    socket.on("room_deleted", handleRoomDeleted);

    return () => {
      socket.off("room_deleted", handleRoomDeleted);
    };
  }, [socket, isConnected, navigate]);

  return (
    <div className="space-y-8">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-gradient-to-br from-[#121212] via-[#090909] to-black p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Live debate arena</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Join, vote & climb the leaderboard</h1>
          <p className="mt-2 text-sm text-gray-400">
            Choose your stance, keep mics ready, and earn bonus coins for impactful arguments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!authUser) {
                toast.info("Please sign in to create a debate", {
                  icon: "🔐",
                });
                navigate("/login/student", {
                  state: { from: "/learn-earn/live-debate-room" },
                });
                return;
              }
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110">
            <HiOutlinePlus className="h-4 w-4" />
            Create Debate
          </button>
        <div className="flex items-center gap-2 rounded-2xl border border-[#D4AF37]/30 bg-[#151515] px-4 py-3 text-xs text-[#D4AF37]">
            <HiOutlineSpeakerWave className="h-5 w-5" />{" "}
            {(() => {
              const liveRooms = [...liveDebates, ...openRooms].filter((r) => r.status === "live");
              const liveCount = liveRooms.length;
              // Only count listeners from live rooms
              const totalListeners = liveRooms.reduce((sum, r) => sum + (r.listeners || 0), 0);
              
              if (liveCount === 0) {
                return "No rooms live";
              }
              return `${liveCount} rooms live · ${totalListeners} learners debating now`;
            })()}
            {!isConnected && (
              <span className="ml-2 text-yellow-400">(Connecting...)</span>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-12">
            <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : liveDebates.length === 0 ? (
          <div className="col-span-2 rounded-3xl border border-white/5 bg-[#101010] p-8 text-center">
            <p className="text-sm text-gray-400">No debates scheduled at the moment.</p>
            <p className="mt-2 text-xs text-gray-500">Check back later for new debates!</p>
          </div>
        ) : (
          liveDebates.map((debate) => (
            <DebateCard
              key={debate.id}
              room={debate}
              onVote={handleVote}
              onDelete={handleDeleteRoom}
              socket={socket}
              isConnected={isConnected}
              isVoting={votingRooms.has(debate.id)}
              currentUserId={authUser?.id}
            />
          ))
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center py-12">
            <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : openRooms.length === 0 ? (
          <div className="col-span-3 rounded-3xl border border-white/5 bg-[#101010] p-8 text-center">
            <p className="text-sm text-gray-400">No open rooms available at the moment.</p>
          </div>
        ) : (
          openRooms.map((room) => {
            const isHost = authUser?.id && room.host && authUser.id.toString() === room.host.toString();
            return (
              <Motion.div
                key={room.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="rounded-3xl border border-white/5 bg-[#101010] p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Open discussion room</p>
                    <p className="mt-2 text-lg font-semibold text-white">{room.title}</p>
                    <p className="mt-1 text-xs text-gray-400">Hosted by {room.hostName || room.host}</p>
                    <p className="mt-3 text-sm text-gray-300">Listeners online: {room.listeners}</p>
                  </div>
                  {isHost && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
                          handleDeleteRoom(room.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400/60 hover:bg-red-500/20"
                      title="Delete room">
                      <HiOutlineTrash className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-2 text-xs text-[#D4AF37]">
                  {room.winners?.map((winner) => (
                    <p key={winner}>🏆 {winner}</p>
                  ))}
                </div>
                {room.status === "live" && (
                  <button
                    onClick={() => navigate(`/learn-earn/live-debate-room/voice-room/${room.id}`)}
                    className="mt-4 w-full rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110">
                    <HiOutlineArrowRight className="mr-2 inline h-4 w-4" />
                    Join Voice Room
                  </button>
                )}
              </Motion.div>
            );
          })
        )}
      </section>

      {/* Create Debate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f0f0f] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Create New Debate</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Set up a new debate room for learners to discuss and vote
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    title: "",
                    topic: "",
                    description: "",
                    scheduledStart: "",
                    type: "debate",
                  });
                }}
                className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebate} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-300">
                  Debate Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Hybrid Work Builds Stronger Teams"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-300">
                  Debate Topic <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Should remote work be mandatory?"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a brief description of the debate topic..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="startImmediately"
                    checked={formData.startImmediately}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        startImmediately: e.target.checked,
                        scheduledStart: e.target.checked ? "" : formData.scheduledStart,
                      });
                    }}
                    className="h-4 w-4 rounded border-white/20 bg-[#111] text-[#D4AF37] focus:ring-[#D4AF37]/50"
                  />
                  <label htmlFor="startImmediately" className="text-sm font-medium text-white cursor-pointer">
                    Start immediately
                  </label>
                </div>

                {!formData.startImmediately && (
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-300">
                  Scheduled Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledStart}
                  onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Leave empty to start in 15 minutes (default)
                </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      title: "",
                      topic: "",
                      description: "",
                      scheduledStart: "",
                      type: "debate",
                      startImmediately: false,
                    });
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.title || !formData.topic}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                  {creating ? (
                    <>
                      <FaSpinner className="mr-2 inline h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Debate"
                  )}
                </button>
              </div>
            </form>
          </Motion.div>
        </div>
      )}
    </div>
  );
};

export default LiveDebates;


