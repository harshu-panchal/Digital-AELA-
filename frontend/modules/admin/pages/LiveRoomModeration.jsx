import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaSpinner,
  FaCheck,
  FaTimes,
  FaBan,
  FaStop,
  FaTrash,
  FaVideo,
  FaUsers,
  FaClock,
  FaFilter,
} from "react-icons/fa";
import { useSocket } from "../../../src/hooks/useSocket";
import {
  fetchLiveRoomsForModeration,
  moderateLiveRoom,
  deleteLiveRoom,
} from "../../../src/services/api/adminLiveRooms";

const LiveRoomModeration = () => {
  const { socket, isConnected } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(new Set());
  const [filters, setFilters] = useState({
    status: "",
    moderationStatus: "",
    type: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const joinedRoomsRef = useRef(new Set());

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await fetchLiveRoomsForModeration({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (response) {
        setRooms(response.rooms || []);
        setPagination(response.pagination || pagination);

        // Join rooms for real-time updates
        if (socket && isConnected) {
          response.rooms.forEach((room) => {
            if (!joinedRoomsRef.current.has(room.id)) {
              socket.emit("join_room", { roomId: room.id });
              joinedRoomsRef.current.add(room.id);
            }
          });
        }
      }
    } catch (error) {
      toast.error(`Failed to load live rooms: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [pagination.page, filters]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRoomUpdate = (data) => {
      setRooms((prev) =>
        prev.map((room) =>
          room.id === data.roomId
            ? { ...room, listeners: data.listeners, status: data.status }
            : room
        )
      );
    };

    const handleRoomModerated = (data) => {
      setRooms((prev) =>
        prev.map((room) =>
          room.id === data.roomId
            ? {
                ...room,
                moderationStatus: data.moderationStatus,
                status: data.status,
              }
            : room
        )
      );
      toast.info(`Room ${data.action}ed`);
    };

    const handleRoomDeleted = (data) => {
      setRooms((prev) => prev.filter((room) => room.id !== data.roomId));
      joinedRoomsRef.current.delete(data.roomId);
      toast.info("Room deleted");
    };

    socket.on("room_update", handleRoomUpdate);
    socket.on("room_moderated", handleRoomModerated);
    socket.on("room_deleted", handleRoomDeleted);

    return () => {
      socket.off("room_update", handleRoomUpdate);
      socket.off("room_moderated", handleRoomModerated);
      socket.off("room_deleted", handleRoomDeleted);
    };
  }, [socket, isConnected]);

  const handleModerate = async (roomId, action, reason = "") => {
    if (processing.has(roomId)) return;

    setProcessing((prev) => new Set(prev).add(roomId));
    try {
      await moderateLiveRoom(roomId, action, reason);
      toast.success(`Room ${action}d successfully`);
      loadRooms();
    } catch (error) {
      toast.error(`Failed to ${action} room: ${error.message}`);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      return;
    }

    if (processing.has(roomId)) return;

    setProcessing((prev) => new Set(prev).add(roomId));
    try {
      await deleteLiveRoom(roomId);
      toast.success("Room deleted successfully");
      loadRooms();
    } catch (error) {
      toast.error(`Failed to delete room: ${error.message}`);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: "bg-blue-500/20 text-blue-300",
      live: "bg-green-500/20 text-green-300",
      ended: "bg-gray-500/20 text-gray-300",
    };
    return badges[status] || "bg-gray-500/20 text-gray-300";
  };

  const getModerationBadge = (status) => {
    const badges = {
      pending: "bg-yellow-500/20 text-yellow-300",
      approved: "bg-green-500/20 text-green-300",
      suspended: "bg-orange-500/20 text-orange-300",
      rejected: "bg-red-500/20 text-red-300",
    };
    return badges[status] || "bg-gray-500/20 text-gray-300";
  };

  const getTypeBadge = (type) => {
    const badges = {
      debate: "bg-purple-500/20 text-purple-300",
      "open-room": "bg-blue-500/20 text-blue-300",
      workshop: "bg-indigo-500/20 text-indigo-300",
    };
    return badges[type] || "bg-gray-500/20 text-gray-300";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Live Room Moderation</h1>
          <p className="mt-1 text-sm text-gray-400">Monitor and moderate live rooms, debates, and workshops</p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-2 text-xs text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400"></span>
              Live
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-gray-400"></span>
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FaFilter className="h-4 w-4" />
            <span>Filters:</span>
          </div>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none">
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="ended">Ended</option>
          </select>
          <select
            value={filters.moderationStatus}
            onChange={(e) => {
              setFilters({ ...filters, moderationStatus: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none">
            <option value="">All Moderation</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => {
              setFilters({ ...filters, type: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none">
            <option value="">All Types</option>
            <option value="debate">Debate</option>
            <option value="open-room">Open Room</option>
            <option value="workshop">Workshop</option>
          </select>
        </div>
      </div>

      {/* Rooms List */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        {loading && rooms.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No live rooms found</div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => {
              const isProcessing = processing.has(room.id);
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-white/10 bg-[#111] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{room.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(room.status)}`}>
                              {room.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getModerationBadge(room.moderationStatus)}`}>
                              {room.moderationStatus}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeBadge(room.type)}`}>
                              {room.type}
                            </span>
                          </div>
                          {room.topic && (
                            <p className="text-sm text-gray-300 mb-2">Topic: {room.topic}</p>
                          )}
                          {room.description && (
                            <p className="text-sm text-gray-400 line-clamp-2 mb-3">{room.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <FaVideo className="h-3 w-3" />
                              Host: {room.host?.fullName || "Unknown"}
                            </span>
                            {room.speakers && room.speakers.length > 0 && (
                              <span className="flex items-center gap-1">
                                <FaUsers className="h-3 w-3" />
                                {room.speakers.length} speaker{room.speakers.length !== 1 ? "s" : ""}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <FaUsers className="h-3 w-3" />
                              {room.listeners || 0} listener{room.listeners !== 1 ? "s" : ""}
                            </span>
                            {room.scheduledStart && (
                              <span className="flex items-center gap-1">
                                <FaClock className="h-3 w-3" />
                                {formatDate(room.scheduledStart)}
                              </span>
                            )}
                          </div>
                          {room.type === "debate" && (
                            <div className="mt-2 flex items-center gap-4 text-xs">
                              <span className="text-green-400">For: {room.forVotes || 0}</span>
                              <span className="text-red-400">Against: {room.againstVotes || 0}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {room.moderationStatus === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleModerate(room.id, "approve")}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50">
                          {isProcessing ? (
                            <FaSpinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <FaCheck className="h-4 w-4" />
                              Approve
                            </>
                          )}
                        </button>
                      )}
                      {room.status === "live" && (
                        <button
                          type="button"
                          onClick={() => handleModerate(room.id, "end")}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-2 rounded-xl bg-orange-500/20 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/30 disabled:opacity-50">
                          {isProcessing ? (
                            <FaSpinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <FaStop className="h-4 w-4" />
                              End Room
                            </>
                          )}
                        </button>
                      )}
                      {room.moderationStatus !== "suspended" && room.status !== "ended" && (
                        <button
                          type="button"
                          onClick={() => handleModerate(room.id, "suspend")}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-2 rounded-xl bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/30 disabled:opacity-50">
                          {isProcessing ? (
                            <FaSpinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <FaBan className="h-4 w-4" />
                              Suspend
                            </>
                          )}
                        </button>
                      )}
                      {room.moderationStatus === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleModerate(room.id, "reject")}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-50">
                          {isProcessing ? (
                            <FaSpinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <FaTimes className="h-4 w-4" />
                              Reject
                            </>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(room.id)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-50">
                        <FaTrash className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-sm text-white disabled:opacity-50">
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-sm text-white disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveRoomModeration;

