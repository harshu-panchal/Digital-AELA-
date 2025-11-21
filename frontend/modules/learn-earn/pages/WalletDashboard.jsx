import { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";
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
import { shareCoins as shareCoinsAPI } from "../../../src/services/api/social";
import { getRewards } from "../../../src/services/api/rewards.js";
import { createRedemptionRequest } from "../../../src/services/api/redemptionRequests.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const WalletDashboard = () => {
  const { transactions, recordTransaction, totals } = useUser();
  const { redeemPoints, addPoints, refreshPoints } = usePoints();
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [sendAmount, setSendAmount] = useState(60);
  const [recipientUserId, setRecipientUserId] = useState("");
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateSize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setLoadingRewards(true);
      const response = await getRewards({ activeOnly: "true" });
      setRewards(response.rewards || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load rewards");
    } finally {
      setLoadingRewards(false);
    }
  };

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

  const handleRedeem = async (reward) => {
    try {
      // Check if user has enough coins
      const availableCoins = totals.current;
      if (availableCoins < reward.cost) {
        toast.error(`Not enough coins. You need ${reward.cost} coins but only have ${availableCoins} available.`, { icon: "⚠️" });
        return;
      }

      // Create redemption request
      await createRedemptionRequest(reward._id);
      
      toast.success(`Redemption request submitted for ${reward.name}. Waiting for admin approval.`, { icon: "🎉" });
      
      // Refresh points to update pending coins
      refreshPoints();
      
      // Refresh rewards to update limits
      loadRewards();
    } catch (error) {
      toast.error(error?.message || "Failed to create redemption request", { icon: "⚠️" });
    }
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

  const handleSendCoins = async () => {
    if (!recipientUserId.trim()) {
      toast.error("Please enter a recipient user ID", { icon: "⚠️" });
      return;
    }
    
    if (sendAmount <= 0) {
      toast.error("Amount must be greater than zero", { icon: "⚠️" });
      return;
    }

    try {
      const result = await shareCoinsAPI(recipientUserId.trim(), sendAmount, "Keep shining!");
      if (result?.success) {
        toast.success(result.message || `Sent ${sendAmount} coins successfully`, { icon: "🤝" });
        setRecipientUserId(""); // Clear input after successful send
        setSendAmount(60); // Reset to default amount
        // Update local transaction record
        recordTransaction({
          type: "sent",
          label: `Gifted to user ${recipientUserId.trim()}`,
          amount: sendAmount,
          time: "Just now",
        });
        // Refresh wallet data from backend
        window.dispatchEvent(new CustomEvent("transactionCompleted"));
        // Refresh points context to get updated wallet balance
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("refreshWallet"));
        }, 500);
    } else {
        toast.error(result?.error?.message || result?.message || "Failed to send coins", { icon: "⚠️" });
      }
    } catch (error) {
      toast.error(error?.error?.message || error?.message || "Failed to send coins", { icon: "⚠️" });
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
                value={recipientUserId}
                onChange={(event) => setRecipientUserId(event.target.value)}
                placeholder="Enter user ID"
                className="w-full rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-xs text-gray-100 focus:border-[#D4AF37]/40 focus:outline-none"
              />
              <input
                type="number"
                min={10}
                step={10}
                value={sendAmount}
                onChange={(event) => setSendAmount(Number(event.target.value))}
                placeholder="Amount"
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Redeem coins</p>
            <Link
              to="/learn-earn/redemption-history"
              className="text-xs text-[#D4AF37] hover:text-[#E5C158] transition">
              View History →
            </Link>
          </div>

          {/* Category Filter */}
          {rewards.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  selectedCategory === ""
                    ? "bg-[#D4AF37] text-black"
                    : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                }`}>
                All
              </button>
              {Array.from(new Set(rewards.map((r) => r.category))).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    selectedCategory === category
                      ? "bg-[#D4AF37] text-black"
                      : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}>
                  {category}
                </button>
              ))}
            </div>
          )}

          {loadingRewards ? (
            <div className="text-center py-8 text-gray-400">Loading rewards...</div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No rewards available at the moment</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {rewards
                .filter((reward) => !selectedCategory || reward.category === selectedCategory)
                .map((reward) => {
                  const canRedeem = totals.current >= reward.cost;
                  return (
                    <Motion.div
                      key={reward._id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25 }}
                      className="rounded-2xl border border-white/5 bg-[#111] p-4 text-sm text-gray-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {reward.icon && <span className="text-lg">{reward.icon}</span>}
                          <p className="font-semibold text-white">{reward.name}</p>
                        </div>
                        <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-semibold text-[#D4AF37]">
                          {reward.cost} coins
                        </span>
                      </div>
                      {reward.description && (
                        <p className="mt-2 text-xs text-gray-400 mb-2">{reward.description}</p>
                      )}
                      {reward.limitPerUser && (
                        <p className="text-xs text-gray-500 mb-2">Limit: {reward.limitPerUser} per user</p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRedeem(reward)}
                        disabled={!canRedeem}
                        className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold transition ${
                          canRedeem
                            ? "border-[#D4AF37]/40 bg-[#151515] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                            : "border-gray-600/40 bg-gray-800/50 text-gray-500 cursor-not-allowed"
                        }`}>
                        {canRedeem ? "Request Redemption" : "Insufficient Coins"}
                      </button>
                    </Motion.div>
                  );
                })}
            </div>
          )}
        </Motion.div>
      </section>
    </div>
  );
};

export default WalletDashboard;


