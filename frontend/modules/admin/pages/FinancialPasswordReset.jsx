import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaSpinner,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
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
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "Weak",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });

  const calculateStrength = (pass) => {
    const requirements = {
      length: pass.length >= 12,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[@$!%*?&]/.test(pass),
    };

    let score = 0;
    if (requirements.length) score += 20;
    if (requirements.uppercase) score += 20;
    if (requirements.lowercase) score += 20;
    if (requirements.number) score += 20;
    if (requirements.special) score += 20;

    let feedback = "Weak";
    if (score >= 40) feedback = "Fair";
    if (score >= 80) feedback = "Strong";
    if (score === 100) feedback = "Very Strong";

    setPasswordStrength({ score, feedback, requirements });
    return score === 100;
  };

  useEffect(() => {
    calculateStrength(newPassword);
  }, [newPassword]);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setIsVerifying(false);
      setIsValidToken(false);
      setError(
        "Invalid reset link. Please request a new financial password reset."
      );
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
        setError(
          "Invalid or expired reset token. Please request a new financial password reset."
        );
      }
    } catch (error) {
      console.error("Failed to verify token:", error);
      setIsValidToken(false);
      if (error.code === "INVALID_TOKEN") {
        setError(
          "Invalid or expired reset token. Please request a new financial password reset."
        );
      } else {
        setError(
          error.message || "Failed to verify reset token. Please try again."
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsResetting(true);
      const response = await resetFinancialPasswordWithToken(
        token,
        newPassword
      );
      if (response && response.success) {
        toast.success(
          response.message || "Financial password has been reset successfully"
        );
        setTimeout(() => {
          navigate("/super-admin/settings", { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to reset financial password:", error);
      if (error.code === "INVALID_TOKEN") {
        setError(
          "Invalid or expired reset token. Please request a new financial password reset."
        );
      } else {
        setError(
          error.message ||
            "Failed to reset financial password. Please try again."
        );
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
          <h1 className="mb-4 text-2xl font-bold text-white">
            Invalid Reset Link
          </h1>
          <p className="mb-6 text-gray-400">
            {error || "This reset link is invalid or has expired."}
          </p>
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
          <h1 className="mb-2 text-2xl font-bold text-white">
            Reset Financial Password
          </h1>
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
                placeholder="Enter new password"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Strength:</span>
                  <span
                    className={`text-xs font-bold ${
                      passwordStrength.score < 40
                        ? "text-red-500"
                        : passwordStrength.score < 80
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}>
                    {passwordStrength.feedback}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.score < 40
                        ? "bg-red-500"
                        : passwordStrength.score < 80
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.entries({
                    "Min 12 characters": passwordStrength.requirements.length,
                    "Uppercase letter": passwordStrength.requirements.uppercase,
                    "Lowercase letter": passwordStrength.requirements.lowercase,
                    Number: passwordStrength.requirements.number,
                    "Special character": passwordStrength.requirements.special,
                  }).map(([label, met]) => (
                    <div key={label} className="flex items-center gap-2">
                      {met ? (
                        <FaCheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-gray-600" />
                      )}
                      <span
                        className={`text-[10px] ${
                          met ? "text-green-500" : "text-gray-500"
                        }`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-5 w-5" />
                ) : (
                  <FaEye className="h-5 w-5" />
                )}
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
