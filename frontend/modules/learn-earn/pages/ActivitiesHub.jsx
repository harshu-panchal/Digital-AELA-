import { useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useTimer } from "react-timer-hook";
import { toast } from "react-toastify";
import { FaPuzzlePiece, FaHeadset, FaBookReader } from "react-icons/fa";
import { useUser } from "../../../src/contexts/UserContext";

const ActivitiesHub = () => {
  const { rewardCoins } = useUser();
  const [activeCategory, setActiveCategory] = useState("quiz");

  const expiry = useMemo(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);

  const { hours, minutes, seconds } = useTimer({ expiryTimestamp: expiry, autoStart: true });

  const categories = useMemo(
    () => ({
      quiz: {
        title: "Daily English Quizzes",
        icon: FaBookReader,
        description: "Sharpen grammar, comprehension, and listening with adaptive quizzes.",
        items: [
          {
            id: "quiz-grammar",
            name: "Grammar Accelerator",
            difficulty: "Intermediate",
            reward: 45,
            progress: 70,
          },
          {
            id: "quiz-business",
            name: "Business English Sprint",
            difficulty: "Advanced",
            reward: 60,
            progress: 40,
          },
        ],
      },
      vocabulary: {
        title: "Vocabulary Games",
        icon: FaPuzzlePiece,
        description: "Gamified flashcards, match-ups, and speed rounds to boost recall.",
        items: [
          { id: "vocab-blitz", name: "Word Blitz", difficulty: "All Levels", reward: 30, progress: 84 },
          { id: "vocab-debate", name: "Debate Phrases", difficulty: "Advanced", reward: 55, progress: 52 },
        ],
      },
      speaking: {
        title: "Listening & Speaking",
        icon: FaHeadset,
        description: "Voice prompts, interview drills, and pronunciation feedback sessions.",
        items: [
          { id: "speak-interview", name: "Interview Masterclass", difficulty: "Intermediate", reward: 75, progress: 63 },
          { id: "speak-story", name: "Storytelling Flow", difficulty: "Advanced", reward: 90, progress: 45 },
        ],
      },
    }),
    []
  );

  const categoryKeys = Object.keys(categories);
  const activeData = categories[activeCategory];

  const handleStart = (item) => {
    const gained = rewardCoins(item.reward, `${item.name} completed`);
    toast.success(`+${gained} coins awarded for completing ${item.name}`, { icon: "🏆" });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#161616] via-[#0c0c0c] to-black p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Daily streak reset</p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-sm text-gray-300">Complete at least one challenge before midnight</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds
                .toString()
                .padStart(2, "0")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#151515] px-4 py-2 text-xs text-[#D4AF37]">
            3-day streak active · +60 bonus coins on completion
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-3xl border border-white/5 bg-[#0f0f0f] p-2">
        {categoryKeys.map((key) => {
          const CategoryIcon = categories[key].icon;
          const isActive = key === activeCategory;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              className={`flex flex-1 min-w-[180px] items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs transition sm:text-sm ${
                isActive
                  ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#E5C158]/20 text-[#D4AF37]"
                  : "text-gray-400 hover:text-white"
              }`}>
              <CategoryIcon className={`h-5 w-5 ${isActive ? "text-[#D4AF37]" : "text-gray-500"}`} />
              {categories[key].title}
            </button>
          );
        })}
      </div>

      <Motion.div
        key={activeCategory}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6 rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">{activeData.title}</p>
          <p className="mt-3 text-sm text-gray-300">{activeData.description}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {activeData.items.map((item) => (
            <Motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25 }}
              className="space-y-4 rounded-2xl border border-white/5 bg-[#111] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.difficulty}</p>
                </div>
                <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-semibold text-[#D4AF37]">
                  +{item.reward} coins
                </span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
                  <Motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${item.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158]"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                <span>Complete in under 6 minutes</span>
                <button
                  type="button"
                  onClick={() => handleStart(item)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#151515] px-4 py-2 font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black">
                  Start challenge
                </button>
              </div>
            </Motion.div>
          ))}
        </div>
      </Motion.div>
    </div>
  );
};

export default ActivitiesHub;


