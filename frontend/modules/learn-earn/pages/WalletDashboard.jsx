import { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import Confetti from "react-confetti";
import { toast } from "react-toastify";
import { HiOutlineArrowPath, HiOutlineArrowUpOnSquare } from "react-icons/hi2";
import { FaCoins } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useUser } from "../../../src/contexts/UserContext";
import { usePoints } from "../../../src/contexts/PointsContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const redeemOptions = [
  { id: "discount", label: "Course discounts", cost: 500, description: "Save 20% on premium courses" },
  { id: "cash", label: "Cash rewards", cost: 800, description: "Withdraw to your bank in 24h" },
  { id: "gift", label: "Gift coins to friends", cost: 200, description: "Support a peer's learning journey" },
  { id: "certificate", label: "Certificates & rewards", cost: 350, description: "Unlock verified achievements" },
  { id: "mentor", label: "Chat with mentors", cost: 150, description: "Book a 1:1 mentor slot" },
  { id: "resume", label: "Resume services", cost: 420, description: "Professional review & feedback" },
];

const WalletDashboard = () => {
  const { transactions, recordTransaction, shareCoins, totals } = useUser();
  const { redeemPoints, addPoints } = usePoints();
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [sendAmount, setSendAmount] = useState(60);
  const [recipient, setRecipient] = useState("Fatima Hassan");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateSize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const chartData = useMemo(() => {
    const recent = transactions.slice(0, 6).reverse();
    return {
      labels: recent.map((txn) => txn.label.split(" ")[0]),
      datasets: [
        {
          label: "Coins",
          data: recent.map((txn) => (txn.type === "earned" ? txn.amount : txn.amount * -1)),
          borderColor: "#D4AF37",
          backgroundColor: "rgba(212, 175, 55, 0.25)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#E5C158",
        },
      ],
    };
  }, [transactions]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw > 0 ? "+" : ""}${context.raw} coins`,
          },
        },
      },
      scales: {
        y: {
          ticks: { color: "#9ca3af" },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        x: {
          ticks: { color: "#6b7280" },
          grid: { display: false },
        },
      },
    }),
    []
  );

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3200);
  };

  const handleRedeem = (option) => {
    const success = redeemPoints(option.cost);
    if (!success) {
      toast.error("Not enough coins for this reward", { icon: "⚠️" });
      return;
    }
    recordTransaction({
      type: "redeemed",
      label: option.label,
      amount: option.cost,
      time: "Just now",
    });
    toast.success(`${option.label} unlocked`, { icon: "🎉" });
    triggerConfetti();
  };

  const handleWithdraw = () => {
    const success = redeemPoints(500);
    if (!success) {
      toast.error("500 coins required to withdraw", { icon: "⚠️" });
      return;
    }
    recordTransaction({ type: "redeemed", label: "Withdrawal request", amount: 500, time: "Processing" });
    toast.info("Withdrawal submitted · expect funds in 24h", { icon: "🏦" });
  };

  const handleSendCoins = () => {
    const result = shareCoins(recipient, sendAmount, "Keep shining!");
    if (result.success) {
      toast.success(`Sent ${sendAmount} coins to ${recipient}`, { icon: "🤝" });
    } else {
      toast.error(result.reason, { icon: "⚠️" });
    }
  };

  const handleBonusCollect = () => {
    const amount = 40;
    addPoints(amount, "Daily wallet login");
    recordTransaction({ type: "earned", label: "Daily bonus", amount, time: "Just now" });
    toast.success(`Daily bonus +${amount} coins`, { icon: "💎" });
  };

  return (
    <div className="relative space-y-8">
      {showConfetti && viewport.width > 0 && (
        <Confetti width={viewport.width} height={viewport.height} recycle={false} numberOfPieces={260} gravity={0.35} />
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1f1f1f] via-[#0d0d0d] to-black p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Wallet overview</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                {totals.current.toLocaleString()} <span className="text-sm text-[#D4AF37]">AELA coins</span>
              </h1>
              <p className="mt-2 text-sm text-gray-400">Lifetime earnings {totals.earned.toLocaleString()} · Redeemed {totals.redeemed.toLocaleString()}</p>
            </div>
            <button
              type="button"
              onClick={handleBonusCollect}
              className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#151515] px-5 py-2 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black">
              <HiOutlineArrowPath className="h-4 w-4" /> Claim daily bonus
            </button>
          </div>
          <div className="mt-6">
            <Line data={chartData} options={chartOptions} height={210} />
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Quick actions</p>
          <button
            type="button"
            onClick={handleWithdraw}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
            <HiOutlineArrowUpOnSquare className="h-5 w-5" /> Withdraw coins
          </button>
          <div className="rounded-2xl border border-white/10 bg-[#151515] p-4 text-xs text-gray-300">
            <p>Send coins to a learner</p>
            <div className="mt-3 space-y-2">
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="Recipient name"
                className="w-full rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-xs text-gray-100 focus:border-[#D4AF37]/40 focus:outline-none"
              />
              <input
                type="number"
                min={10}
                step={10}
                value={sendAmount}
                onChange={(event) => setSendAmount(Number(event.target.value))}
                className="w-full rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-xs text-gray-100 focus:border-[#D4AF37]/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendCoins}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-[#D4AF37]/20 hover:brightness-110">
                <FaCoins className="h-4 w-4" /> Send coins
              </button>
            </div>
          </div>
        </Motion.div>
      </section>

      <section className="grid gap-6">
        <Motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Redeem coins</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {redeemOptions.map((option) => (
              <Motion.div
                key={option.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-white/5 bg-[#111] p-4 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{option.label}</p>
                  <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-semibold text-[#D4AF37]">
                    {option.cost} coins
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-400">{option.description}</p>
                <button
                  type="button"
                  onClick={() => handleRedeem(option)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#151515] px-3 py-2 text-[11px] font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black">
                  Redeem now
                </button>
              </Motion.div>
            ))}
          </div>
        </Motion.div>
      </section>
    </div>
  );
};

export default WalletDashboard;


