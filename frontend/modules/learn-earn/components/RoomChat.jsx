import { useState, useEffect, useRef, useCallback } from "react";
import { motion as Motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineNoSymbol,
  HiOutlineSpeakerWave,
} from "react-icons/hi2";
import { FaSpinner, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useSocket } from "../../../src/hooks/useSocket";
import {
  getRoomMessages,
  sendRoomMessage,
  deleteRoomMessage,
  muteUserChat,
  unmuteUserChat,
} from "../../../src/services/api/roomMessages";

const RoomChat = ({ roomId, userRole, socket, isConnected }) => {
  const { user } = useAuth();
  const { socket: socketFromHook, isConnected: isConnectedFromHook } = useSocket();
  const effectiveSocket = socket || socketFromHook;
  const effectiveIsConnected = isConnected !== undefined ? isConnected : isConnectedFromHook;

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [mutedUsers, setMutedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const pendingMessagesRef = useRef(new Map());

  const isMuted = user ? mutedUsers.includes(user.id) : false;
  const isHost = userRole === "host";

  // Load initial chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!roomId) return;

      try {
        setLoading(true);
        const response = await getRoomMessages(roomId, 50);
        if (response?.messages) {
          setMessages(response.messages);
          setMutedUsers(response.mutedChatUsers || []);
          // Auto-scroll to bottom after loading
          setTimeout(() => {
            scrollToBottom(true);
          }, 100);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [roomId]);

  // Socket event handlers
  useEffect(() => {
    if (!effectiveSocket || !effectiveIsConnected || !roomId) return;

    const handleRoomMessage = (message) => {
      // Check if message already exists (deduplicate)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;

        // Replace optimistic message if this matches
        const pendingKey = `${message.content}-${message.senderId}`;
        if (pendingMessagesRef.current.has(pendingKey)) {
          const optimisticId = pendingMessagesRef.current.get(pendingKey);
          pendingMessagesRef.current.delete(pendingKey);
          return prev.map((m) =>
            m.id === optimisticId ? message : m
          );
        }

        return [...prev, message];
      });

      // Auto-scroll if user is near bottom
      if (shouldAutoScrollRef.current && !isUserScrollingRef.current) {
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    const handleRoomChatHistory = (data) => {
      if (data.roomId === roomId) {
        setMessages(data.messages || []);
        setMutedUsers(data.mutedChatUsers || []);
        setTimeout(() => scrollToBottom(true), 100);
      }
    };

    const handleRoomMessageDeleted = (data) => {
      if (data.roomId === roomId && data.messageId) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    };

    const handleUserChatMuted = (data) => {
      if (data.roomId === roomId && data.userId) {
        setMutedUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    };

    const handleUserChatUnmuted = (data) => {
      if (data.roomId === roomId && data.userId) {
        setMutedUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    effectiveSocket.on("room-message", handleRoomMessage);
    effectiveSocket.on("room-chat-history", handleRoomChatHistory);
    effectiveSocket.on("room-message-deleted", handleRoomMessageDeleted);
    effectiveSocket.on("user-chat-muted", handleUserChatMuted);
    effectiveSocket.on("user-chat-unmuted", handleUserChatUnmuted);

    return () => {
      effectiveSocket.off("room-message", handleRoomMessage);
      effectiveSocket.off("room-chat-history", handleRoomChatHistory);
      effectiveSocket.off("room-message-deleted", handleRoomMessageDeleted);
      effectiveSocket.off("user-chat-muted", handleUserChatMuted);
      effectiveSocket.off("user-chat-unmuted", handleUserChatUnmuted);
    };
  }, [effectiveSocket, effectiveIsConnected, roomId]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    shouldAutoScrollRef.current = isNearBottom;

    // Detect if user is scrolling
    isUserScrollingRef.current = true;
    clearTimeout(isUserScrollingRef.current);
    setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 1000);
  }, []);

  // Send message
  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !roomId || sending) return;

    // Check if user is authenticated
    if (!user) {
      toast.info("Please log in to send messages", {
        icon: "🔐",
      });
      return;
    }

    // Check if user is muted
    if (isMuted) {
      toast.error("You are muted and cannot send messages");
      return;
    }

    const content = messageText.trim();
    setMessageText("");
    setSending(true);

    // Optimistic update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderName: user.fullName || "You",
      content,
      type: "text",
      timestamp: new Date(),
    };

    const pendingKey = `${content}-${user.id}`;
    pendingMessagesRef.current.set(pendingKey, tempMessage.id);

    setMessages((prev) => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => scrollToBottom(true), 50);

    try {
      // Send via Socket.io (primary method)
      if (effectiveSocket && effectiveIsConnected) {
        effectiveSocket.emit("send-room-message", {
          roomId,
          content,
        });
      } else {
        // Fallback to REST API
        await sendRoomMessage(roomId, content);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      pendingMessagesRef.current.delete(pendingKey);
    } finally {
      setSending(false);
    }
  }, [messageText, roomId, user, isMuted, sending, effectiveSocket, effectiveIsConnected, scrollToBottom]);

  // Delete message (host only)
  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!isHost || !roomId || !messageId) return;

    try {
      if (effectiveSocket && effectiveIsConnected) {
        effectiveSocket.emit("delete-room-message", {
          roomId,
          messageId,
        });
      } else {
        await deleteRoomMessage(roomId, messageId);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  }, [isHost, roomId, effectiveSocket, effectiveIsConnected]);

  // Mute/unmute user (host only)
  const handleMuteUser = useCallback(async (userId, muted) => {
    if (!isHost || !roomId || !userId) return;

    try {
      if (effectiveSocket && effectiveIsConnected) {
        if (muted) {
          effectiveSocket.emit("unmute-user-chat", { roomId, userId });
        } else {
          effectiveSocket.emit("mute-user-chat", { roomId, userId });
        }
      } else {
        if (muted) {
          await unmuteUserChat(roomId, userId);
        } else {
          await muteUserChat(roomId, userId);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to mute/unmute user:", error);
      toast.error(`Failed to ${muted ? "unmute" : "mute"} user`);
    }
  }, [isHost, roomId, effectiveSocket, effectiveIsConnected]);

  // Handle Enter key
  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get user avatar initial
  const getAvatarInitial = (name) => {
    return name?.[0]?.toUpperCase() || "?";
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/5 bg-[#101010] overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Live Chat
        </h3>
        {isMuted && (
          <div className="flex items-center gap-1 text-xs text-orange-400">
            <FaVolumeMute className="h-4 w-4" />
            <span>Muted</span>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        style={{ maxHeight: "400px", minHeight: "200px" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <FaSpinner className="h-5 w-5 animate-spin text-[#D4AF37]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;
            const isMessageMuted = mutedUsers.includes(message.senderId);

            return (
              <Motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isOwnMessage
                      ? "bg-gradient-to-br from-[#D4AF37] to-[#E5C158] text-black"
                      : "bg-gray-600 text-white"
                  }`}
                >
                  {getAvatarInitial(message.senderName)}
                </div>

                {/* Message Content */}
                <div className={`flex flex-1 flex-col gap-1 ${isOwnMessage ? "items-end" : "items-start"}`}>
                  <div
                    className={`flex items-center gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                  >
                    <span className="text-xs font-medium text-gray-300">
                      {isOwnMessage ? "You" : message.senderName}
                    </span>
                    {isMessageMuted && !isOwnMessage && (
                      <FaVolumeMute className="h-3 w-3 text-orange-400" />
                    )}
                    {isHost && !isOwnMessage && (
                      <button
                        onClick={() =>
                          handleMuteUser(message.senderId, isMessageMuted)
                        }
                        className="text-xs text-gray-400 hover:text-orange-400 transition"
                        title={isMessageMuted ? "Unmute user" : "Mute user"}
                      >
                        {isMessageMuted ? (
                          <FaVolumeUp className="h-3 w-3" />
                        ) : (
                          <FaVolumeMute className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <div
                    className={`group relative rounded-2xl px-3 py-2 max-w-[80%] ${
                      isOwnMessage
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black"
                        : "bg-[#151515] text-white border border-white/5"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {isHost && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center h-5 w-5 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                        title="Delete message"
                      >
                        <HiOutlineTrash className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </Motion.div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-white/5 p-3">
        {!user ? (
          <div className="rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-center">
            <p className="text-xs text-gray-400">
              Please log in to send messages
            </p>
          </div>
        ) : isMuted ? (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-center">
            <p className="text-xs text-orange-400 flex items-center justify-center gap-2">
              <FaVolumeMute className="h-4 w-4" />
              You are muted and cannot send messages
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending || !effectiveIsConnected}
              className="flex-1 rounded-xl border border-white/10 bg-[#151515] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || sending || !effectiveIsConnected}
              className="flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <FaSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <HiOutlinePaperAirplane className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomChat;

