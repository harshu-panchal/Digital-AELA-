import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";

const FinancialPasswordModal = ({ isOpen, onSuccess, onCancel }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSuccess(password);
      if (!success) {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-2xl border border-[#D4AF37]/20 bg-[#0B0F1E] p-6 md:p-8 shadow-[0_0_24px_rgba(212,175,55,0.1)]">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/20 mb-4">
              <HiOutlineLockClosed className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Financial Access Required</h2>
            <p className="text-slate-400 text-sm">
              This section contains sensitive financial information. Please enter the financial password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Financial Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter financial password"
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
                  {showPassword ? (
                    <HiOutlineEyeSlash className="h-5 w-5" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400">
                  {error}
                </motion.p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="flex-1 px-4 py-3 rounded-xl bg-linear-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? "Verifying..." : "Access Financial Data"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-slate-500 text-center">
            Your session will remain active for 2 hours
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FinancialPasswordModal;


