import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { resetPassword } from "../../../src/services/api/auth";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link. Please request a new password reset.");
      navigate("/forgot-password", { replace: true });
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, formData.newPassword);
      setIsSuccess(true);
      toast.success("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login/student", { replace: true });
      }, 2000);
    } catch (error) {
      if (error.code === "INVALID_TOKEN") {
        toast.error(
          "Invalid or expired reset link. Please request a new password reset."
        );
        setTimeout(() => {
          navigate("/forgot-password", { replace: true });
        }, 2000);
      } else {
        toast.error(error.message || "Failed to reset password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 min-h-screen bg-[#020409] text-white overflow-auto">
        <SEO
          title="Password Reset Successful | Digital AELA"
          description="Your password has been successfully reset"
          keywords="password reset, Digital AELA"
          url="https://digitalaela.com/reset-password"
        />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.18),transparent_65%)]" />

        <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-lg space-y-8 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_30px_90px_rgba(191,148,72,0.38)] backdrop-blur-xl supports-backdrop-filter:bg-white/18 sm:p-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mx-auto w-16 h-16 rounded-full bg-[#27ae60]/20 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-[#27ae60]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>

            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Password Reset Successful!
            </h1>
            <p className="text-sm text-slate-300/80">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <p className="text-xs text-slate-400/80 animate-pulse">
              Redirecting to login page...
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-[#020409] text-white overflow-auto">
      <SEO
        title="Reset Password | Digital AELA"
        description="Reset your Digital AELA account password"
        keywords="reset password, password reset, Digital AELA"
        url="https://digitalaela.com/reset-password"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.18),transparent_65%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-lg space-y-8 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_30px_90px_rgba(191,148,72,0.38)] backdrop-blur-xl supports-backdrop-filter:bg-white/18 sm:p-8">
          <div className="space-y-3 text-center">
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/50 bg-[#F5D26A]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-[#F5D26A]">
              Reset Password
            </motion.span>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Create New Password
            </h1>
            <p className="text-sm text-slate-300/80">
              Enter your new password below. Make sure it's at least 6 characters long.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                New Password
              </span>
              <input
                type="password"
                name="newPassword"
                required
                minLength={6}
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Confirm Password
              </span>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_32px_rgba(245,210,106,0.3)] transition focus:outline-none focus:ring focus:ring-[#F5D26A]/40 disabled:cursor-not-allowed disabled:opacity-80">
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </motion.button>
          </form>

          <div className="text-center text-xs text-slate-300/70">
            <Link
              to="/login/student"
              className="text-[#F5D26A] underline-offset-2 hover:text-[#FFE28A]">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ResetPassword;

