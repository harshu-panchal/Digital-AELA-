import { motion as Motion } from "framer-motion";
import { HiOutlineUsers, HiOutlineClipboardDocumentList, HiOutlineChartBar, HiOutlineShieldCheck } from "react-icons/hi2";

const adminCards = [
  {
    id: "users",
    title: "User management",
    description: "Moderate learner accounts, verify mentors, and assign privileges.",
    icon: HiOutlineUsers,
    status: "Beta",
    color: "text-emerald-200 bg-emerald-500/15",
    actions: ["View roster", "Assign roles"],
  },
  {
    id: "content",
    title: "Post & content control",
    description: "Approve debate recordings, featured posts, and course highlights.",
    icon: HiOutlineClipboardDocumentList,
    status: "Planned",
    color: "text-sky-200 bg-sky-500/15",
    actions: ["Review queue", "Schedule spotlight"],
  },
  {
    id: "coins",
    title: "Coins & rewards system",
    description: "Configure earning rules, seasonal bonuses, and redemption catalogues.",
    icon: HiOutlineShieldCheck,
    status: "Design",
    color: "text-[#D4AF37] bg-[#D4AF37]/15",
    actions: ["Adjust multipliers", "Preview storefront"],
  },
  {
    id: "analytics",
    title: "Reports & analytics",
    description: "Track engagement funnels, coin economy health, and live debate stats.",
    icon: HiOutlineChartBar,
    status: "Coming soon",
    color: "text-rose-200 bg-rose-500/15",
    actions: ["Download report", "Export CSV"],
  },
];

const AdminControl = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#141414] via-[#0b0b0b] to-black p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Admin preview</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Digital AELA control room</h1>
        <p className="mt-2 text-sm text-gray-400">
          These panels are placeholders for upcoming admin workflows. Connect APIs later to drive real moderation, reporting, and reward automation.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {adminCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Motion.div
              key={card.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="space-y-4 rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${card.color}`}>
                    <Icon className="h-4 w-4" />
                    {card.status}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-white">{card.title}</h2>
                </div>
              </div>
              <p className="text-sm text-gray-300">{card.description}</p>
              <div className="rounded-2xl border border-white/5 bg-[#111] p-4 text-xs text-gray-400">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Next checkpoints</p>
                <ul className="mt-3 space-y-2">
                  {card.actions.map((action) => (
                    <li key={action} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
                Configure (coming soon)
              </button>
            </Motion.div>
          );
        })}
      </section>
    </div>
  );
};

export default AdminControl;


