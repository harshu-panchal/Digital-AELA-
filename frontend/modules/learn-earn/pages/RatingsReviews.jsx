import { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaStar, FaMedal } from "react-icons/fa";
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { useUser } from "../../../src/contexts/UserContext";

const ratingTags = [
  { label: "Inspiring Mentor", color: "bg-emerald-500/20 text-emerald-200" },
  { label: "Good Speaker", color: "bg-[#D4AF37]/20 text-[#D4AF37]" },
  { label: "Needs Improvement", color: "bg-rose-500/20 text-rose-200" },
  { label: "Supportive Listener", color: "bg-sky-500/20 text-sky-200" },
];

const RatingsReviews = () => {
  const { ratings, updateRatings, followers, profile } = useUser();
  const [selectedTag, setSelectedTag] = useState(ratingTags[0].label);

  const tagStats = useMemo(() => ratings.tags.sort((a, b) => b.count - a.count), [ratings.tags]);

  const handleSubmit = () => {
    updateRatings(selectedTag, 1);
    toast.success(`Feedback recorded: ${selectedTag}`, { icon: "⭐" });
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-3">
        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#161616] via-[#0c0c0c] to-black p-6 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Community rating</p>
          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-5xl font-semibold text-white">{ratings.average.toFixed(1)}</p>
              <p className="mt-2 text-sm text-gray-400">Based on {ratings.votes} peer reviews</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.badges.map((badge) => (
                  <span key={badge.id} className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative h-28 w-28">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#1f1f1f" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#D4AF37"
                  strokeWidth="8"
                  strokeDasharray={`${(ratings.average / 5) * 283} 283`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <FaStar className="h-6 w-6 text-[#D4AF37]" />
                <p className="mt-1 text-xs text-gray-300">Top 5%</p>
              </div>
            </div>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Rate a learner</p>
          <div className="mt-4 space-y-3 text-xs text-gray-300">
            <p>Select a feedback tag</p>
            <div className="flex flex-wrap gap-2">
              {ratingTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => setSelectedTag(tag.label)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedTag === tag.label ? `${tag.color} ring-2 ring-[#D4AF37]/40` : "bg-[#111] text-gray-300"
                  }`}>
                  {tag.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs font-semibold text-black hover:brightness-110">
              <HiOutlineChatBubbleOvalLeft className="h-4 w-4" /> Submit rating
            </button>
          </div>
        </Motion.div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.28 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Feedback insights</p>
          <div className="mt-4 space-y-3 text-sm text-gray-300">
            {tagStats.map((tag) => (
              <div key={tag.label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#111] px-4 py-3">
                <span>{tag.label}</span>
                <span className="text-[#D4AF37]">{tag.count}</span>
              </div>
            ))}
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.28, delay: 0.05 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Top supporters</p>
          <div className="mt-4 space-y-3 text-sm text-gray-300">
            {followers.slice(0, 3).map((follower, index) => (
              <div key={follower.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#111] px-4 py-3">
                <FaMedal className={`h-5 w-5 ${index === 0 ? "text-[#D4AF37]" : index === 1 ? "text-slate-300" : "text-amber-500"}`} />
                <div className="flex-1">
                  <p className="font-semibold text-white">{follower.name}</p>
                  <p className="text-xs text-gray-400">Coins shared {follower.coinsShared}</p>
                </div>
                <span className="text-xs text-[#D4AF37]">⭐ {follower.rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.28, delay: 0.1 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Upgrade goals</p>
          <ul className="mt-4 space-y-3 text-xs text-gray-300">
            <li className="rounded-2xl border border-white/5 bg-[#111] px-4 py-3">Reach 500 reviews to unlock Platinum Mentor badge</li>
            <li className="rounded-2xl border border-white/5 bg-[#111] px-4 py-3">Collect 1,000 feedback coins for workshop spotlight</li>
            <li className="rounded-2xl border border-white/5 bg-[#111] px-4 py-3">Maintain 4.7+ rating for 30 days to earn AELA certification</li>
          </ul>
        </Motion.div>
      </section>
    </div>
  );
};

export default RatingsReviews;


