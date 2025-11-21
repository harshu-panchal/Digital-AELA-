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
  HiOutlineArrowLeft,
  HiOutlineMagnifyingGlass,
  HiOutlineChatBubbleOvalLeft,
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
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const conversationsLoadedRef = useRef(false);
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
  const [showChatView, setShowChatView] = useState(false); // For mobile: control which view to show
  const [friendListSearch, setFriendListSearch] = useState(""); // Search within friend list

  // Load conversations on mount (only once, or when authUser changes)
  useEffect(() => {
    const loadConversations = async () => {
      if (!authUser || conversationsLoadedRef.current) return;

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
          conversationsLoadedRef.current = true;
          
          // Check if there's a userId in the URL, and set active chat accordingly
          if (userIdFromUrl) {
            // Check if conversation already exists
            const existingConv = formatted.find((conv) => conv.userId === userIdFromUrl);
            if (existingConv) {
              setActiveChatId(existingConv.userId);
              // Clear the URL parameter after setting active chat
              setSearchParams({}, { replace: true });
            } else {
              // Conversation doesn't exist yet, but we can still set the active chat
              // This will create a new conversation when first message is sent
              setActiveChatId(userIdFromUrl);
              // Clear the URL parameter
              setSearchParams({}, { replace: true });
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
  }, [authUser, userIdFromUrl, setSearchParams]); // Removed activeChatId to prevent loop

  // Reset conversationsLoadedRef when authUser changes
  useEffect(() => {
    conversationsLoadedRef.current = false;
  }, [authUser]);

  // Load messages when active chat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChatId || !authUser) {
        setMessages([]);
        setActiveChat(null);
        return;
      }

      try {
        setLoadingMessages(true);
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

        // Find active chat details from current conversations state
        // Use a separate effect to update activeChat based on conversations
        // This avoids dependency issues
        
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
        setMessages([]);
        setActiveChat(null);
      } finally {
        setLoadingMessages(false);
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
  }, [activeChatId, authUser]); // Removed conversations to prevent loop

  // Update activeChat when conversations or activeChatId changes
  useEffect(() => {
    if (!activeChatId) {
      setActiveChat(null);
      return;
    }

    // Find active chat details from conversations
    let chat = conversations.find((c) => c.userId === activeChatId);
    
    // If chat doesn't exist in conversations but activeChatId is set (from URL),
    // create a placeholder chat object
    if (!chat && activeChatId) {
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
  }, [conversations, activeChatId]);

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

  // Filter conversations based on search query (from outlet context or friend list search)
  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim() || friendListSearch.trim();
    if (!query) {
      return conversations;
    }
    const lowerQuery = query.toLowerCase().trim();
    return conversations.filter((chat) => {
      const nameMatch = chat.name?.toLowerCase().includes(lowerQuery);
      const userIdMatch = chat.userId?.toLowerCase().includes(lowerQuery);
      const previewMatch = chat.preview?.toLowerCase().includes(lowerQuery);
      return nameMatch || userIdMatch || previewMatch;
    });
  }, [conversations, searchQuery, friendListSearch]);

  // Handle friend card click - open chat and on mobile, switch to chat view
  const handleFriendClick = (chatId) => {
    setActiveChatId(chatId);
    // On mobile (smaller screens), show chat view after selecting a friend
    if (window.innerWidth < 768) {
      setShowChatView(true);
    }
  };

  // Handle back button on mobile - return to friend list
  const handleBackToFriends = () => {
    setShowChatView(false);
  };

  // Handle window resize - adjust view on mobile/desktop transition
  useEffect(() => {
    const handleResize = () => {
      // On desktop, always show both views
      if (window.innerWidth >= 768 && activeChatId) {
        setShowChatView(false); // Reset to show both views on desktop
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, [activeChatId]);

  // Reset showChatView when activeChatId changes and we're on desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setShowChatView(false); // Always show both on desktop
    } else if (activeChatId && window.innerWidth < 768) {
      setShowChatView(true); // Show chat view on mobile when chat is selected
    }
  }, [activeChatId]);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-3xl border border-white/5 bg-[#0f0f0f]">
      {/* Friends List Sidebar - Left Side (35% on desktop, hidden on mobile when chat is open) */}
      <aside
        className={`flex h-full flex-col border-r border-white/5 bg-[#0f0f0f] transition-all duration-300 ${
          showChatView && activeChat
            ? "hidden md:flex md:w-[35%]"
            : "w-full md:w-[35%]"
        }`}>
        {/* Friends List Header */}
        <div className="flex flex-col border-b border-white/5 bg-[#151515] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Chats</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
              <HiOutlinePlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
          {/* Search Bar */}
          <div className="mt-3 relative">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={friendListSearch}
              onChange={(e) => setFriendListSearch(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full rounded-lg border border-white/10 bg-[#101010] py-2 pl-10 pr-4 text-sm text-gray-100 outline-none transition focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="h-5 w-5 animate-spin text-[#D4AF37]" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 px-4">
              {conversations.length === 0
                ? "No conversations yet. Start chatting with other users!"
                : (searchQuery.trim() || friendListSearch.trim())
                ? `No conversations found`
                : "No conversations yet. Start chatting with other users!"}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredConversations.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleFriendClick(chat.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                    activeChatId === chat.id
                      ? "bg-[#151515] text-white"
                      : "bg-[#0f0f0f] text-gray-300 hover:bg-[#151515] active:bg-[#1a1a1a]"
                  }`}>
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="h-12 w-12 flex-shrink-0 rounded-full border border-[#D4AF37]/30 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{chat.name}</span>
                      {chat.timestamp && (
                        <span className="text-xs text-gray-500 flex-shrink-0">{chat.timestamp}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-gray-400 truncate">{chat.preview}</p>
                      {chat.unread > 0 && (
                        <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold text-black flex-shrink-0">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Chat Area - Right Side (65% on desktop, full width on mobile when chat is open) */}
      <section
        className={`flex h-full flex-col bg-[#0f0f0f] transition-all duration-300 ${
          showChatView && activeChat
            ? "w-full"
            : activeChat
            ? "hidden md:flex md:w-[65%]"
            : "hidden md:flex md:w-[65%]"
        }`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className="flex items-center justify-between border-b border-white/5 bg-[#151515] px-4 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Back button for mobile */}
                <button
                  type="button"
                  onClick={handleBackToFriends}
                  className="md:hidden inline-flex items-center justify-center rounded-lg border border-white/10 bg-[#101010] p-2 text-gray-300 transition hover:bg-[#1a1a1a] flex-shrink-0">
                  <HiOutlineArrowLeft className="h-5 w-5" />
                </button>
                <img
                  src={activeChat.avatar}
                  alt={activeChat.name}
                  className="h-10 w-10 flex-shrink-0 rounded-full border border-[#D4AF37]/30 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {activeChat.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{activeChat.userId}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleReport}
                  className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:border-rose-400/60 hover:text-rose-200">
                  <HiOutlineFlag className="h-4 w-4" />
                  <span className="hidden md:inline">Report</span>
                </button>
                <button
                  type="button"
                  onClick={handleBlock}
                  className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:border-rose-400/60 hover:text-rose-200">
                  <HiOutlineUserMinus className="h-4 w-4" />
                  <span className="hidden md:inline">Block</span>
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden bg-[#0f0f0f]">
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
                className="custom-scrollbar h-full space-y-3 overflow-y-auto bg-[#0f0f0f] p-4">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    <FaSpinner className="mr-2 h-5 w-5 animate-spin text-[#D4AF37]" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
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

            {/* Message Input Area */}
            <div className="border-t border-white/5 bg-[#151515] p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceMessage}
                  className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-[#101010] p-2.5 text-gray-200 transition hover:text-[#D4AF37] flex-shrink-0">
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
                  className="flex-1 rounded-lg border border-white/10 bg-[#101010] px-4 py-2.5 text-sm text-gray-100 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!isConnected || sending || !messageText.trim()}
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2.5 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                  {sending ? (
                    <FaSpinner className="h-5 w-5 animate-spin" />
                  ) : (
                  <HiOutlinePaperAirplane className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Share Coins Section */}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-white/5 bg-[#101010] p-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#D4AF37]">
                    Share Coins
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
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
                    className="w-20 rounded-lg border border-white/10 bg-[#151515] px-2.5 py-1.5 text-xs text-gray-100 focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleShareCoins}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#151515] px-3 py-1.5 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black">
                    <FaCoins className="h-3.5 w-3.5" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden h-full flex-col items-center justify-center gap-2 text-sm text-gray-400 md:flex">
            {loading ? (
              <>
                <FaSpinner className="h-6 w-6 animate-spin text-[#D4AF37]" />
                <p>Loading conversations...</p>
              </>
            ) : (
              <>
                <div className="text-center">
                  <HiOutlineChatBubbleOvalLeft className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                  <p className="text-base font-medium text-gray-300">Select a conversation</p>
                  <p className="mt-1 text-xs text-gray-500">Choose a friend from the list to start chatting</p>
                </div>
                {!isConnected && (
                  <p className="mt-4 text-xs text-yellow-500">
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
