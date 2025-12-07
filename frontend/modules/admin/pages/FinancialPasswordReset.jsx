import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSpinner, FaLock, FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  verifyFinancialPasswordToken,
  resetFinancialPasswordWithToken,
} from "../../../src/services/api/superAdmin";

const FinancialPasswordReset = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setIsVerifying(false);
      setIsValidToken(false);
      setError("Invalid reset link. Please request a new financial password reset.");
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      setIsVerifying(true);
      setError("");
      const response = await verifyFinancialPasswordToken(token);
      if (response && response.valid) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
        setError("Invalid or expired reset token. Please request a new financial password reset.");
      }
    } catch (error) {
      console.error("Failed to verify token:", error);
      setIsValidToken(false);
      if (error.code === "INVALID_TOKEN") {
        setError("Invalid or expired reset token. Please request a new financial password reset.");
      } else {
        setError(error.message || "Failed to verify reset token. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsResetting(true);
      const response = await resetFinancialPasswordWithToken(token, newPassword);
      if (response && response.success) {
        toast.success(response.message || "Financial password has been reset successfully");
        setTimeout(() => {
          navigate("/super-admin/settings", { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to reset financial password:", error);
      if (error.code === "INVALID_TOKEN") {
        setError("Invalid or expired reset token. Please request a new financial password reset.");
      } else {
        setError(error.message || "Failed to reset financial password. Please try again.");
      }
      toast.error(error.message || "Failed to reset financial password");
    } finally {
      setIsResetting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="fixed inset-0 flex min-h-screen items-center justify-center bg-linear-to-b from-black via-[#040404] to-black">
        <div className="text-center">
          <FaSpinner className="mx-auto h-8 w-8 animate-spin text-[#D4AF37]" />
          <p className="mt-4 text-gray-400">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="fixed inset-0 flex min-h-screen items-center justify-center bg-linear-to-b from-black via-[#040404] to-black p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-red-500/20 bg-white/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <FaExclamationCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-white">Invalid Reset Link</h1>
          <p className="mb-6 text-gray-400">{error || "This reset link is invalid or has expired."}</p>
          <button
            onClick={() => navigate("/super-admin/settings", { replace: true })}
            className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#F5D26A]">
            Go to Settings
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex min-h-screen items-center justify-center bg-linear-to-b from-black via-[#040404] to-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/20">
            <FaLock className="h-8 w-8 text-[#D4AF37]" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Reset Financial Password</h1>
          <p className="text-sm text-gray-400">
            Enter your new financial password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isResetting || !newPassword || !confirmPassword}
            className="w-full rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#F5D26A] disabled:opacity-50 disabled:cursor-not-allowed">
            {isResetting ? (
              <>
                <FaSpinner className="mr-2 inline-block h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <FaCheckCircle className="mr-2 inline-block h-4 w-4" />
                Reset Financial Password
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/super-admin/settings", { replace: true })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Cancel
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default FinancialPasswordReset;

