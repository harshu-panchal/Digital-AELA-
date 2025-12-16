import { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";
import Confetti from "react-confetti";
import { toast } from "react-toastify";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { FaCoins } from "react-icons/fa";
import { useUser } from "../../../src/contexts/UserContext";
import { usePoints } from "../../../src/contexts/PointsContext";
import { getRewards } from "../../../src/services/api/rewards";
import { createRedemptionRequest } from "../../../src/services/api/redemptionRequests";
import { claimDailyBonus, fetchStudentPoints } from "../../../src/services/api/points";
import TranslatedText from "../../../src/components/TranslatedText";
import { LazyLine } from "../../../src/components/LazyChart";

const WalletDashboard = () => {
  const { transactions, recordTransaction, totals } = useUser();
  const { redeemPoints, addPoints, refreshPoints } = usePoints();
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isBonusClaimed, setIsBonusClaimed] = useState(false);
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [lastClaimedDate, setLastClaimedDate] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateSize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    loadRewards();
    checkDailyBonusStatus();
  }, []);

  const checkDailyBonusStatus = async () => {
    try {
      const pointsData = await fetchStudentPoints();
      if (pointsData?.points?.lastDailyBonusClaimed) {
        const lastClaimed = new Date(pointsData.points.lastDailyBonusClaimed);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastClaimStart = new Date(lastClaimed.getFullYear(), lastClaimed.getMonth(), lastClaimed.getDate());
        
        if (lastClaimStart.getTime() === todayStart.getTime()) {
          setIsBonusClaimed(true);
          setLastClaimedDate(lastClaimed);
        }
      }
    } catch (error) {
      // Silently fail - user can still try to claim
      console.warn("Failed to check daily bonus status:", error);
    }
  };

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


  const handleBonusCollect = async () => {
    if (isBonusClaimed || isClaimingBonus) {
      return;
    }

    try {
      setIsClaimingBonus(true);
      const response = await claimDailyBonus();
      
      if (response?.points) {
        const amount = response.points.transaction?.amount || 40;
        addPoints(amount, "Daily wallet login");
        recordTransaction({ type: "earned", label: "Daily bonus", amount, time: "Just now" });
        triggerConfetti();
        toast.success(`Daily bonus +${amount} coins`, { icon: "💎" });
        
        // Update claim status
        setIsBonusClaimed(true);
        setLastClaimedDate(new Date(response.points.lastDailyBonusClaimed));
        
        // Refresh points
        refreshPoints();
      }
    } catch (error) {
      if (error?.error?.code === "ALREADY_CLAIMED") {
        setIsBonusClaimed(true);
        if (error.error.lastClaimed) {
          setLastClaimedDate(new Date(error.error.lastClaimed));
        }
        toast.error("Daily bonus already claimed today", { icon: "⚠️" });
      } else {
        toast.error(error?.message || "Failed to claim daily bonus", { icon: "⚠️" });
      }
    } finally {
      setIsClaimingBonus(false);
    }
  };

  return (
    <div className="relative space-y-8">
      {showConfetti && viewport.width > 0 && (
        <Confetti width={viewport.width} height={viewport.height} recycle={false} numberOfPieces={50} gravity={0.35} />
      )}

      <section className="grid gap-6">
        <Motion.div
          className="rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1f1f1f] via-[#0d0d0d] to-black p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70"><TranslatedText>Wallet overview</TranslatedText></p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                {totals.current.toLocaleString()} <span className="text-sm text-[#D4AF37]"><TranslatedText>AELA coins</TranslatedText></span>
              </h1>
              <p className="mt-2 text-sm text-gray-400"><TranslatedText>Lifetime earnings</TranslatedText> {totals.earned.toLocaleString()} · <TranslatedText>Redeemed</TranslatedText> {totals.redeemed.toLocaleString()}</p>
            </div>
            <button
              type="button"
              onClick={handleBonusCollect}
              disabled={isBonusClaimed || isClaimingBonus}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold transition ${
                isBonusClaimed || isClaimingBonus
                  ? "border-gray-600/40 bg-gray-800/50 text-gray-500 cursor-not-allowed"
                  : "border-[#D4AF37]/40 bg-[#151515] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
              }`}>
              <HiOutlineArrowPath className={`h-4 w-4 ${isClaimingBonus ? "animate-spin" : ""}`} /> 
              {isClaimingBonus ? <TranslatedText>Claiming...</TranslatedText> : isBonusClaimed ? <TranslatedText>Already claimed today</TranslatedText> : <TranslatedText>Claim daily bonus</TranslatedText>}
            </button>
          </div>
          <div className="mt-6">
            <LazyLine data={chartData} options={chartOptions} height={210} />
          </div>
        </Motion.div>

      </section>

      <section className="grid gap-6">
        <Motion.div
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70"><TranslatedText>Redeem coins</TranslatedText></p>
            <Link
              to="/learn-earn/redemption-history"
              className="text-xs text-[#D4AF37] hover:text-[#E5C158] transition">
              <TranslatedText>View History</TranslatedText> →
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
                <TranslatedText>All</TranslatedText>
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
            <div className="text-center py-8 text-gray-400"><TranslatedText>Loading rewards...</TranslatedText></div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><TranslatedText>No rewards available at the moment</TranslatedText></div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {rewards
                .filter((reward) => !selectedCategory || reward.category === selectedCategory)
                .map((reward) => {
                  const canRedeem = totals.current >= reward.cost;
                  return (
                    <Motion.div
                      key={reward._id}
                      className="rounded-2xl border border-white/5 bg-[#111] p-4 text-sm text-gray-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {reward.icon && <span className="text-lg">{reward.icon}</span>}
                          <p className="font-semibold text-white">{reward.name}</p>
                        </div>
                        <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-semibold text-[#D4AF37]">
                          {reward.cost} <TranslatedText>coins</TranslatedText>
                        </span>
                      </div>
                      {reward.description && (
                        <p className="mt-2 text-xs text-gray-400 mb-2">{reward.description}</p>
                      )}
                      {reward.limitPerUser && (
                        <p className="text-xs text-gray-500 mb-2"><TranslatedText>Limit:</TranslatedText> {reward.limitPerUser} <TranslatedText>per user</TranslatedText></p>
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
                        {canRedeem ? <TranslatedText>Request Redemption</TranslatedText> : <TranslatedText>Insufficient Coins</TranslatedText>}
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


