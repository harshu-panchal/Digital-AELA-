import { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlinePlusCircle,
  HiOutlineMicrophone,
  HiOutlinePaperAirplane,
  HiOutlineFlag,
  HiOutlineUserMinus,
} from "react-icons/hi2";
import { FaCoins } from "react-icons/fa";
import { useUser } from "../../../src/contexts/UserContext";

const ChatCentre = () => {
  const { messages, markConversationRead, sendMessage, shareCoins } = useUser();
  const [activeChatId, setActiveChatId] = useState(messages[0]?.id || "");
  const [messageText, setMessageText] = useState("");
  const [coinAmount, setCoinAmount] = useState(20);

  const activeChat = useMemo(
    () => messages.find((chat) => chat.id === activeChatId) || messages[0],
    [messages, activeChatId]
  );

  useEffect(() => {
    if (activeChat) {
      markConversationRead(activeChat.id);
    }
  }, [activeChat, markConversationRead]);

  const handleSend = () => {
    if (!messageText.trim() || !activeChat) return;
    sendMessage(activeChat.id, {
      from: "me",
      content: messageText.trim(),
      type: "text",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    toast.success("Message delivered", { icon: "✉️" });
    setMessageText("");
  };

  const handleVoiceMessage = () => {
    toast.info("Voice message recorded (mock)", { icon: "🎙️" });
    if (!activeChat) return;
    sendMessage(activeChat.id, {
      from: "me",
      content: "voice-message-link",
      type: "voice",
      duration: "0:45",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
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
          {messages.map((chat) => (
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
          ))}
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
              <div className="custom-scrollbar h-[360px] space-y-3 overflow-y-auto rounded-2xl bg-[#101010] p-4">
                {activeChat.history.map((item) => (
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
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Type a message"
                  className="flex-1 rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-sm text-gray-100 focus:border-[#D4AF37]/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-3 text-sm font-semibold text-black hover:brightness-110">
                  <HiOutlinePaperAirplane className="h-5 w-5" />
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
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Select a conversation to get started.
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatCentre;
