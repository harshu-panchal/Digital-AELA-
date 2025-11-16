import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlinePlusCircle,
  HiOutlineMicrophone,
  HiOutlinePaperAirplane,
  HiOutlineFlag,
  HiOutlineUserMinus,
} from "react-icons/hi2";
import { FaCoins, FaSpinner } from "react-icons/fa";
import { useUser } from "../../../src/contexts/UserContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useSocket } from "../../../src/hooks/useSocket";
import {
  fetchConversations,
  fetchMessages,
  sendMessageAPI,
  markMessagesAsRead,
} from "../../../src/services/api/messages";

const ChatCentre = () => {
  const { searchQuery = "" } = useOutletContext() || {};
  const { shareCoins } = useUser();
  const { user: authUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get("userId");
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [coinAmount, setCoinAmount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const shouldAutoScrollRef = useRef(true); // Track if we should auto-scroll
  const pendingMessagesRef = useRef(new Map()); // Track pending optimistic messages by content+timestamp
  const isUserScrollingRef = useRef(false); // Track if user is actively scrolling
  const autoScrollTimeoutRef = useRef(null); // Track auto-scroll timeout to cancel if needed
  const scrollEndTimeoutRef = useRef(null); // Track timeout for when user stops scrolling
  const isNearBottomRef = useRef(true); // Track if user is near bottom of scroll container
  const prevMessagesLengthRef = useRef(0); // Track previous messages length to detect new messages
  const initialScrollTimeoutRef = useRef(null); // Track initial scroll timeout to cancel if needed

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      if (!authUser) return;

      try {
        setLoading(true);
        const response = await fetchConversations();
        if (response?.conversations) {
          const formatted = response.conversations.map((conv) => ({
            id: conv.userId,
            userId: conv.userId,
            name: conv.name || "Unknown User",
            avatar: conv.avatar || `https://i.pravatar.cc/150?img=${conv.userId.slice(-2)}`,
            preview: conv.preview || "No messages yet",
            timestamp: conv.timestamp
              ? new Date(conv.timestamp).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })
              : "",
            unread: conv.unread || 0,
          }));
          setConversations(formatted);
          
          // Check if there's a userId in the URL, and set active chat accordingly
          if (userIdFromUrl) {
            // Check if conversation already exists
            const existingConv = formatted.find((conv) => conv.userId === userIdFromUrl);
            if (existingConv) {
              setActiveChatId(existingConv.userId);
              // Clear the URL parameter after setting active chat
              setSearchParams({});
            } else {
              // Conversation doesn't exist yet, but we can still set the active chat
              // This will create a new conversation when first message is sent
              setActiveChatId(userIdFromUrl);
              // Clear the URL parameter
              setSearchParams({});
            }
          } else if (formatted.length > 0 && !activeChatId) {
            // Default to first conversation if no URL parameter
            setActiveChatId(formatted[0].userId);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [authUser, activeChatId, userIdFromUrl, setSearchParams]);

  // Load messages when active chat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChatId || !authUser) return;

      try {
        const response = await fetchMessages(activeChatId);
        if (response?.messages) {
          setMessages(response.messages);
          // Mark as read
          await markMessagesAsRead(activeChatId);
          // Update conversation unread count
          setConversations((prev) =>
            prev.map((conv) =>
              conv.userId === activeChatId ? { ...conv, unread: 0 } : conv
            )
          );
        }

        // Find active chat details
        let chat = conversations.find((c) => c.userId === activeChatId);
        
        // If chat doesn't exist in conversations but activeChatId is set (from URL),
        // create a placeholder chat object
        if (!chat && activeChatId) {
          // Try to get user info from somewhere or create a basic placeholder
          // This will be updated when the first message is sent/received
          chat = {
            id: activeChatId,
            userId: activeChatId,
            name: "User",
            avatar: `https://i.pravatar.cc/150?img=${activeChatId.slice(-2)}`,
            preview: "No messages yet",
            timestamp: "",
            unread: 0,
          };
        }
        
        setActiveChat(chat || null);
        
        // Initialize prevMessagesLengthRef when messages first load
        if (response?.messages) {
          prevMessagesLengthRef.current = response.messages.length;
        }
        
        // Only scroll to bottom when first loading a chat (initial load)
        // Reset scroll state for new chat
        if (response?.messages && response.messages.length > 0 && messagesContainerRef.current) {
          // Reset refs for new chat - user is at bottom on initial load
          isNearBottomRef.current = true;
          shouldAutoScrollRef.current = true;
          isUserScrollingRef.current = false;
          
          // Clear any existing initial scroll timeout
          if (initialScrollTimeoutRef.current) {
            clearTimeout(initialScrollTimeoutRef.current);
          }
          
          // Small delay to ensure DOM is ready, then scroll to bottom only on initial load
          initialScrollTimeoutRef.current = setTimeout(() => {
            if (messagesContainerRef.current) {
              const container = messagesContainerRef.current;
              // Only scroll if user hasn't manually scrolled yet (they're still at initial position)
              // Double check the scroll position to ensure user hasn't scrolled up
              const scrollTop = container.scrollTop;
              const scrollHeight = container.scrollHeight;
              const clientHeight = container.clientHeight;
              const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
              
              if (isNearBottomRef.current && shouldAutoScrollRef.current && !isUserScrollingRef.current && distanceFromBottom < 150) {
              container.scrollTop = container.scrollHeight; // Instant scroll, no animation on initial load
              }
            }
            initialScrollTimeoutRef.current = null;
          }, 150);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load messages:", error);
        toast.error("Failed to load messages");
      }
    };

    loadMessages();
    
    // Reset scroll state when chat changes
    return () => {
      isUserScrollingRef.current = false;
      shouldAutoScrollRef.current = false; // Disable auto-scroll by default
      isNearBottomRef.current = true; // Reset to true for new chat
      prevMessagesLengthRef.current = 0; // Reset message count tracking
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
        scrollEndTimeoutRef.current = null;
      }
      if (initialScrollTimeoutRef.current) {
        clearTimeout(initialScrollTimeoutRef.current);
        initialScrollTimeoutRef.current = null;
      }
    };
  }, [activeChatId, authUser, conversations]);

  // Auto-scroll when new messages arrive, but ONLY if user is near bottom
  // This prevents auto-scroll from interrupting user when they're reading old messages
  useEffect(() => {
    // Skip if no messages or container ref doesn't exist
    if (!messagesContainerRef.current || messages.length === 0) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }
    
    // Check if a new message was actually added (not just a re-render)
    const messageAdded = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;
    
    // Only auto-scroll if:
    // 1. A new message was actually added
    // 2. User is near bottom (within 100px)
    // 3. User is not actively scrolling
    // 4. We should auto-scroll (from scroll handler)
    if (
      messageAdded &&
      isNearBottomRef.current &&
      !isUserScrollingRef.current &&
      shouldAutoScrollRef.current
    ) {
      // Clear any existing auto-scroll timeout
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
      
      // Use a small timeout to ensure DOM is updated
      autoScrollTimeoutRef.current = setTimeout(() => {
        if (messagesContainerRef.current && isNearBottomRef.current && shouldAutoScrollRef.current) {
          const container = messagesContainerRef.current;
          // Check one more time before scrolling
          const scrollTop = container.scrollTop;
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          
          // Only scroll if still near bottom (user didn't scroll up in the meantime)
          if (distanceFromBottom < 150) {
            container.scrollTop = container.scrollHeight;
          }
        }
        autoScrollTimeoutRef.current = null;
      }, 50);
      
      return () => {
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
          autoScrollTimeoutRef.current = null;
        }
      };
    }
  }, [messages]); // Only trigger when messages array changes

  // Socket.io event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Only add if it's for the current active chat
      if (message.senderId === activeChatId || message.recipientId === activeChatId) {
        setMessages((prev) => {
          // Check if message already exists (deduplicate by ID or content + sender)
          const exists = prev.some(
            (m) => 
              m.id === message.id || 
              (m.content === message.content && 
               m.from === (message.senderId === authUser?.id ? "me" : "other") &&
               Math.abs(new Date(m.timestamp || m.time) - new Date(message.timestamp)) < 5000)
          );
          if (exists) {
            return prev;
          }
          
          // Replace optimistic message if this matches a pending one
          const pendingKey = `${message.content}-${message.senderId}`;
          if (pendingMessagesRef.current.has(pendingKey)) {
            const optimisticId = pendingMessagesRef.current.get(pendingKey);
            pendingMessagesRef.current.delete(pendingKey);
            return prev.map((m) => 
              m.id === optimisticId ? {
                ...m,
                id: message.id,
                timestamp: message.timestamp,
              } : m
            );
          }
          
          return [...prev, message];
        });
        
        // Update conversation preview
        setConversations((prev) =>
          prev.map((conv) =>
            conv.userId === message.senderId || conv.userId === message.recipientId
              ? {
                  ...conv,
                  preview: message.content,
                  timestamp: new Date(message.timestamp).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  }),
                  unread: conv.userId === activeChatId ? 0 : (conv.unread || 0) + 1,
                }
              : conv
          )
        );
      } else {
        // Update unread count for other conversations
        setConversations((prev) =>
          prev.map((conv) =>
            conv.userId === message.senderId
              ? { ...conv, unread: (conv.unread || 0) + 1 }
              : conv
          )
        );
    }
    };

    const handleMessageSent = (message) => {
      // Replace optimistic message with real one from server
      setMessages((prev) => {
        // Check if message already exists
        const exists = prev.some(
          (m) => 
            m.id === message.id || 
            (m.content === message.content && 
             m.from === "me" &&
             Math.abs(new Date(m.timestamp || m.time) - new Date(message.timestamp)) < 5000)
        );
        if (exists) {
          return prev;
        }
        
        // Replace optimistic message if this matches a pending one
        const pendingKey = `${message.content}-${authUser?.id}`;
        if (pendingMessagesRef.current.has(pendingKey)) {
          const optimisticId = pendingMessagesRef.current.get(pendingKey);
          pendingMessagesRef.current.delete(pendingKey);
          return prev.map((m) => 
            m.id === optimisticId ? {
              ...m,
              id: message.id,
              timestamp: message.timestamp,
            } : m
          );
        }
        
        // Fallback: add if not exists
        return [...prev, message];
      });
    };

    const handleTyping = (data) => {
      if (data.userId === activeChatId) {
        if (data.isTyping) {
          setTypingUsers((prev) => new Set(prev).add(data.userId));
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(data.userId);
              return next;
            });
          }, 3000);
        } else {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
        }
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("user_typing", handleTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("user_typing", handleTyping);
    };
  }, [socket, activeChatId, authUser]);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !activeChatId || !socket || sending) return;

    const content = messageText.trim();
    setMessageText("");
    setSending(true);

    // Optimistically add message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      from: "me",
      content,
      type: "text",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(),
    };
    
    // Track this optimistic message so we can replace it when server responds
    const pendingKey = `${content}-${authUser?.id}`;
    pendingMessagesRef.current.set(pendingKey, tempMessage.id);
    
    // Clean up pending messages older than 30 seconds to prevent memory leaks
    setTimeout(() => {
      pendingMessagesRef.current.delete(pendingKey);
    }, 30000);
    
    setMessages((prev) => [...prev, tempMessage]);
    
    // Scroll to bottom only when user sends their own message
    // Use a small timeout to ensure DOM is updated before scrolling
    setTimeout(() => {
      if (messagesContainerRef.current && !isUserScrollingRef.current) {
        const container = messagesContainerRef.current;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);

    try {
      // Send via Socket.io for real-time (primary method)
      socket.emit("send_message", {
        recipientId: activeChatId,
        content,
        type: "text",
      });

      // Also send via REST API as backup (but don't add duplicate if socket works)
      // Only send REST API if socket is not connected or fails
      if (!isConnected) {
        await sendMessageAPI({
          recipientId: activeChatId,
          content,
          type: "text",
        });
      }

      // Update conversation preview
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === activeChatId
            ? {
                ...conv,
                preview: content,
                timestamp: new Date().toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                }),
              }
            : conv
        )
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  }, [messageText, activeChatId, socket, sending, isConnected, authUser]);

  const handleVoiceMessage = () => {
    toast.info("Voice message feature coming soon", { icon: "🎙️" });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleShareCoins = () => {
    if (!activeChat) return;
    const result = shareCoins(
      activeChat.name,
      coinAmount,
      "Thanks for the collaboration!"
    );
    if (result.success) {
      toast.success(`Sent ${coinAmount} AELA coins to ${activeChat.name}`, {
        icon: "💎",
      });
    } else {
      toast.error(result.reason, { icon: "⚠️" });
    }
  };

  const handleReport = () => {
    toast.warn("Report submitted to moderators", { icon: "🚨" });
  };

  const handleBlock = () => {
    toast.warn("User blocked – you can unblock anytime", { icon: "🛑" });
  };

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    const query = searchQuery.toLowerCase().trim();
    return conversations.filter((chat) => {
      const nameMatch = chat.name?.toLowerCase().includes(query);
      const userIdMatch = chat.userId?.toLowerCase().includes(query);
      const previewMatch = chat.preview?.toLowerCase().includes(query);
      return nameMatch || userIdMatch || previewMatch;
    });
  }, [conversations, searchQuery]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <aside className="h-full rounded-3xl border border-white/5 bg-[#0f0f0f] p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
            Connections
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
            <HiOutlinePlusCircle className="h-4 w-4" />
            New
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="h-5 w-5 animate-spin text-[#D4AF37]" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              {conversations.length === 0
                ? "No conversations yet. Start chatting with other users!"
                : searchQuery.trim()
                ? `No conversations found matching "${searchQuery}"`
                : "No conversations yet. Start chatting with other users!"}
            </div>
          ) : (
            filteredConversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border border-white/5 px-3 py-3 text-left transition ${
                activeChatId === chat.id
                  ? "bg-[#151515] text-white"
                  : "bg-[#101010] text-gray-300 hover:bg-[#151515]"
              }`}>
              <img
                src={chat.avatar}
                alt={chat.name}
                className="h-10 w-10 rounded-full border border-[#D4AF37]/30 object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{chat.name}</span>
                  <span className="text-gray-500">{chat.timestamp}</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">{chat.preview}</p>
              </div>
              {chat.unread > 0 && (
                <span className="rounded-full bg-[#D4AF37]/80 px-2 py-0.5 text-[10px] font-bold text-black">
                  {chat.unread}
                </span>
              )}
            </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
        {activeChat ? (
          <>
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeChat.avatar}
                  alt={activeChat.name}
                  className="h-12 w-12 rounded-full border border-[#D4AF37]/30 object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {activeChat.name}
                  </p>
                  <p className="text-xs text-gray-400">{activeChat.userId}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleReport}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-gray-300 transition hover:border-rose-400/60 hover:text-rose-200">
                  <HiOutlineFlag className="h-4 w-4" />
                  Report
                </button>
                <button
                  type="button"
                  onClick={handleBlock}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-gray-300 transition hover:border-rose-400/60 hover:text-rose-200">
                  <HiOutlineUserMinus className="h-4 w-4" />
                  Block
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-hidden">
              <div 
                ref={messagesContainerRef}
                onScroll={(e) => {
                  // Track if user manually scrolled up - disable auto-scroll if they're far from bottom
                  const container = e.target;
                  const scrollTop = container.scrollTop;
                  const scrollHeight = container.scrollHeight;
                  const clientHeight = container.clientHeight;
                  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
                  const isNearBottom = distanceFromBottom < 100;
                  
                  // Update the ref to track if user is near bottom
                  isNearBottomRef.current = isNearBottom;
                  
                  // If user scrolled away from bottom, immediately disable auto-scroll and cancel any pending scrolls
                  if (!isNearBottom) {
                    shouldAutoScrollRef.current = false;
                    // Cancel any pending initial scroll
                    if (initialScrollTimeoutRef.current) {
                      clearTimeout(initialScrollTimeoutRef.current);
                      initialScrollTimeoutRef.current = null;
                    }
                    // Cancel any pending auto-scroll from messages
                    if (autoScrollTimeoutRef.current) {
                      clearTimeout(autoScrollTimeoutRef.current);
                      autoScrollTimeoutRef.current = null;
                    }
                  } else {
                    // User scrolled back to bottom - allow auto-scroll again
                    shouldAutoScrollRef.current = true;
                  }
                  
                  // Mark that user is actively scrolling
                  isUserScrollingRef.current = true;
                  
                  // Clear the scrolling flag after user stops scrolling for 300ms
                  if (scrollEndTimeoutRef.current) {
                    clearTimeout(scrollEndTimeoutRef.current);
                  }
                  scrollEndTimeoutRef.current = setTimeout(() => {
                    isUserScrollingRef.current = false;
                  }, 300);
                }}
                className="custom-scrollbar h-[360px] space-y-3 overflow-y-auto rounded-2xl bg-[#101010] p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <>
                    {messages.map((item) => (
                  <Motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                      item.from === "me"
                        ? "ml-auto bg-gradient-to-r from-[#D4AF37]/30 to-[#E5C158]/30 text-white"
                        : "bg-[#151515] text-gray-200"
                    }`}>
                    {item.type === "voice" ? (
                      <div className="flex items-center gap-2 text-xs text-gray-200">
                        <HiOutlineMicrophone className="h-4 w-4" /> Voice note •{" "}
                        {item.duration}
                      </div>
                    ) : (
                      item.content
                    )}
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-400">
                      {item.time}
                    </p>
                  </Motion.div>
                ))}
                    {typingUsers.has(activeChatId) && (
                      <div className="text-xs text-gray-400 italic">
                        {activeChat?.name || "User"} is typing...
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#101010] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleVoiceMessage}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#151515] p-3 text-gray-200 transition hover:text-[#D4AF37]">
                  <HiOutlineMicrophone className="h-5 w-5" />
                </button>
                <input
                  value={messageText}
                  onChange={(event) => {
                    setMessageText(event.target.value);
                    // Send typing indicator
                    if (socket && activeChatId && event.target.value.trim()) {
                      socket.emit("typing", {
                        recipientId: activeChatId,
                        isTyping: true,
                      });
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message"
                  disabled={!isConnected || sending}
                  className="flex-1 rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-sm text-gray-100 focus:border-[#D4AF37]/50 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!isConnected || sending || !messageText.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-3 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                  {sending ? (
                    <FaSpinner className="h-5 w-5 animate-spin" />
                  ) : (
                  <HiOutlinePaperAirplane className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#101010] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">
                    Share coins
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Reward your peers for helping you grow
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={coinAmount}
                    onChange={(event) =>
                      setCoinAmount(Number(event.target.value))
                    }
                    className="w-24 rounded-xl border border-white/10 bg-[#151515] px-3 py-2 text-sm text-gray-100 focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleShareCoins}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#151515] px-4 py-2 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black">
                    <FaCoins className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-400">
            {loading ? (
              <>
                <FaSpinner className="h-6 w-6 animate-spin text-[#D4AF37]" />
                <p>Loading conversations...</p>
              </>
            ) : (
              <>
                <p>Select a conversation to get started.</p>
                {!isConnected && (
                  <p className="text-xs text-yellow-500">
                    Connecting to chat server...
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatCentre;
