import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from "react-icons/hi2";
import SEO from "../../../src/components/SEO";
import { getRewards, createReward, updateReward, deleteReward, getRewardAnalytics } from "../../../src/services/api/rewards.js";

const categories = ["Cash", "Discounts", "Services", "Certificates", "Gifts", "Other"];

const RewardManagement = () => {
  const [rewards, setRewards] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Other",
    cost: "",
    imageUrl: "",
    icon: "",
    limitPerUser: "",
    globalLimit: "",
    expirationDate: "",
    isActive: true,
  });

  useEffect(() => {
    loadRewards();
    loadAnalytics();
  }, []);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const response = await getRewards({ activeOnly: "false" });
      setRewards(response.rewards || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load rewards");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await getRewardAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const handleOpenModal = (reward = null) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        name: reward.name || "",
        description: reward.description || "",
        category: reward.category || "Other",
        cost: reward.cost?.toString() || "",
        imageUrl: reward.imageUrl || "",
        icon: reward.icon || "",
        limitPerUser: reward.limitPerUser?.toString() || "",
        globalLimit: reward.globalLimit?.toString() || "",
        expirationDate: reward.expirationDate ? new Date(reward.expirationDate).toISOString().split("T")[0] : "",
        isActive: reward.isActive !== false,
      });
    } else {
      setEditingReward(null);
      setFormData({
        name: "",
        description: "",
        category: "Other",
        cost: "",
        imageUrl: "",
        icon: "",
        limitPerUser: "",
        globalLimit: "",
        expirationDate: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReward(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cost: parseInt(formData.cost, 10),
        limitPerUser: formData.limitPerUser ? parseInt(formData.limitPerUser, 10) : null,
        globalLimit: formData.globalLimit ? parseInt(formData.globalLimit, 10) : null,
        expirationDate: formData.expirationDate || null,
      };

      if (editingReward) {
        await updateReward(editingReward._id, payload);
        toast.success("Reward updated successfully");
      } else {
        await createReward(payload);
        toast.success("Reward created successfully");
      }

      handleCloseModal();
      loadRewards();
      loadAnalytics();
    } catch (error) {
      toast.error(error?.message || "Failed to save reward");
    }
  };

  const handleDelete = async (rewardId) => {
    if (!window.confirm("Are you sure you want to delete this reward?")) return;

    try {
      await deleteReward(rewardId);
      toast.success("Reward deleted successfully");
      loadRewards();
      loadAnalytics();
    } catch (error) {
      toast.error(error?.message || "Failed to delete reward");
    }
  };

  const groupedRewards = rewards.reduce((acc, reward) => {
    if (!acc[reward.category]) {
      acc[reward.category] = [];
    }
    acc[reward.category].push(reward);
    return acc;
  }, {});

  return (
    <div className="relative p-6 md:p-8 lg:p-10">
      <SEO
        title="Reward Management | Super Admin"
        description="Manage rewards for the learn and earn module"
      />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">Reward Management</h1>
            <p className="text-sm text-slate-300/70 mt-2">Manage rewards available for redemption</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-5 py-2 text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
            <HiOutlinePlus className="h-5 w-5" />
            Add Reward
          </button>
        </div>

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400 mb-1">Total Rewards</p>
              <p className="text-2xl font-semibold text-white">{analytics.rewards?.total || 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400 mb-1">Active Rewards</p>
              <p className="text-2xl font-semibold text-emerald-400">{analytics.rewards?.active || 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400 mb-1">Total Redemptions</p>
              <p className="text-2xl font-semibold text-blue-400">{analytics.redemptions?.total || 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400 mb-1">Approval Rate</p>
              <p className="text-2xl font-semibold text-purple-400">{analytics.redemptions?.approvalRate || 0}%</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading rewards...</div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedRewards).map((category) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedRewards[category].map((reward) => (
                  <div
                    key={reward._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {reward.icon && <span className="text-lg">{reward.icon}</span>}
                          <h3 className="font-semibold text-white">{reward.name}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{reward.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-300">
                          <span className="text-[#F5D26A] font-semibold">{reward.cost} coins</span>
                          <span className={`px-2 py-1 rounded-full ${reward.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                            {reward.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {(reward.limitPerUser || reward.globalLimit) && (
                          <div className="mt-2 text-xs text-slate-400">
                            {reward.limitPerUser && <p>Limit per user: {reward.limitPerUser}</p>}
                            {reward.globalLimit && <p>Global limit: {reward.globalLimit}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleOpenModal(reward)}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition">
                        <HiOutlinePencil className="h-4 w-4 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(reward._id)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition">
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {editingReward ? "Edit Reward" : "Create Reward"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition">
                <HiOutlineX className="h-5 w-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none">
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Cost (coins) *</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    required
                    min="1"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Icon (emoji)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🎁"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Limit per User</label>
                  <input
                    type="number"
                    value={formData.limitPerUser}
                    onChange={(e) => setFormData({ ...formData, limitPerUser: e.target.value })}
                    min="1"
                    placeholder="Unlimited"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Global Limit</label>
                  <input
                    type="number"
                    value={formData.globalLimit}
                    onChange={(e) => setFormData({ ...formData, globalLimit: e.target.value })}
                    min="1"
                    placeholder="Unlimited"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#F5D26A]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-white/10 bg-white/5"
                  />
                  <span className="text-sm font-semibold text-white">Active</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 rounded-xl border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-3 text-sm font-semibold text-[#F5D26A] hover:bg-[#F5D26A]/20 transition">
                  {editingReward ? "Update Reward" : "Create Reward"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RewardManagement;

