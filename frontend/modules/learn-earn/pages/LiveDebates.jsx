import { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useTimer } from "react-timer-hook";
import {
  HiOutlineMicrophone,
  HiOutlineVideoCamera,
  HiOutlineNoSymbol,
  HiOutlineSpeakerWave,
} from "react-icons/hi2";
import { FaVoteYea } from "react-icons/fa";
import { toast } from "react-toastify";
import { useUser } from "../../../src/contexts/UserContext";

const DebateCard = ({ room, onVote }) => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(false);

  const expiry = useMemo(() => {
    const end = new Date();
    end.setMinutes(end.getMinutes() + room.startInMinutes);
    return end;
  }, [room.startInMinutes]);

  const { minutes, seconds } = useTimer({ expiryTimestamp: expiry, autoStart: true });

  const totalVotes = room.forVotes + room.againstVotes || 1;
  const forPercent = Math.round((room.forVotes / totalVotes) * 100);
  const againstPercent = 100 - forPercent;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.28 }}
      className="space-y-4 rounded-3xl border border-[#D4AF37]/20 bg-[#101010] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Featured debate</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{room.topic}</h3>
          <p className="mt-1 text-xs text-gray-400">Speakers: {room.speakers.join(" · ")}</p>
        </div>
        <div className="rounded-full border border-white/10 px-4 py-2 text-xs text-gray-300">
          Starts in <span className="font-semibold text-white">{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onVote(room.id, "for")}
          className="group flex flex-col rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-left transition hover:border-emerald-400/60">
          <span className="text-xs uppercase tracking-[0.3em] text-emerald-200">For</span>
          <span className="mt-2 text-xl font-semibold text-white">{room.forVotes}</span>
          <span className="mt-1 text-xs text-emerald-200">{forPercent}% support</span>
        </button>
        <button
          type="button"
          onClick={() => onVote(room.id, "against")}
          className="group flex flex-col rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-left transition hover:border-rose-400/60">
          <span className="text-xs uppercase tracking-[0.3em] text-rose-200">Against</span>
          <span className="mt-2 text-xl font-semibold text-white">{room.againstVotes}</span>
          <span className="mt-1 text-xs text-rose-200">{againstPercent}% votes</span>
        </button>
      </div>

      <div className="h-3 rounded-full bg-[#0a0a0a]">
        <div
          className="flex h-full overflow-hidden rounded-full"
          style={{ width: "100%" }}>
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{ width: `${forPercent}%` }} />
          <div className="h-full bg-gradient-to-r from-rose-500 to-rose-300" style={{ width: `${againstPercent}%` }} />
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
        <button
          type="button"
          onClick={() => setCamEnabled((prev) => !prev)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${
            camEnabled
              ? "border-sky-400/40 bg-sky-500/10 text-sky-200"
              : "border-white/10 bg-[#151515] text-gray-300"
          }`}>
          <HiOutlineVideoCamera className="h-4 w-4" /> Cam {camEnabled ? "on" : "off"}
        </button>
        <span className="rounded-full border border-white/10 px-4 py-2 text-gray-300">Audience votes: {totalVotes}</span>
      </div>
    </Motion.div>
  );
};

const LiveDebates = () => {
  const { liveDebates, openRooms, voteOnDebate } = useUser();

  const handleVote = (id, side) => {
    voteOnDebate(id, side);
    toast.success(`Vote cast for ${side === "for" ? "For" : "Against"}`, { icon: <FaVoteYea /> });
  };

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
        <div className="flex items-center gap-2 rounded-2xl border border-[#D4AF37]/30 bg-[#151515] px-4 py-3 text-xs text-[#D4AF37]">
          <HiOutlineSpeakerWave className="h-5 w-5" /> 4 rooms live · 128 learners debating now
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        {liveDebates.map((debate) => (
          <DebateCard key={debate.id} room={debate} onVote={handleVote} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {openRooms.map((room) => (
          <Motion.div
            key={room.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-3xl border border-white/5 bg-[#101010] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Open discussion room</p>
            <p className="mt-2 text-lg font-semibold text-white">{room.title}</p>
            <p className="mt-1 text-xs text-gray-400">Hosted by {room.host}</p>
            <p className="mt-3 text-sm text-gray-300">Listeners online: {room.listeners}</p>
            <div className="mt-4 space-y-2 text-xs text-[#D4AF37]">
              {room.winners.map((winner) => (
                <p key={winner}>🏆 {winner}</p>
              ))}
            </div>
          </Motion.div>
        ))}
      </section>
    </div>
  );
};

export default LiveDebates;


