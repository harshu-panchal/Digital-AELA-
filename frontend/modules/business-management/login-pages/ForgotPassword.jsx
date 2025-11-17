import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { requestPasswordReset } from "../../../src/services/api/auth";
import { isValidEmail } from "../../../src/utils/registrationHelpers";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setIsSubmitted(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      toast.error(
        error.message || "Failed to send reset email. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#020409] text-white">
        <SEO
          title="Password Reset Sent | Digital AELA"
          description="Password reset instructions have been sent to your email"
          keywords="password reset, forgot password, Digital AELA"
          url="https://digitalaela.com/forgot-password"
        />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.18),transparent_65%)]" />

        <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-lg space-y-8 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_30px_90px_rgba(191,148,72,0.38)] backdrop-blur-xl supports-backdrop-filter:bg-white/18 sm:p-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mx-auto w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-[#D4AF37]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </motion.div>

            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Check Your Email
            </h1>
            <p className="text-sm text-slate-300/80">
              If an account with <strong className="text-[#D4AF37]">{email}</strong> exists, we've sent password reset instructions to your email.
            </p>
            <p className="text-xs text-slate-400/80">
              The reset link will expire in 1 hour. If you don't see the email, check your spam folder.
            </p>

            <div className="flex flex-col gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/login/student")}
                className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_32px_rgba(245,210,106,0.3)] transition">
                Back to Login
              </motion.button>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="text-sm text-[#D4AF37] hover:text-[#FFE28A] transition">
                Try another email
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Forgot Password | Digital AELA"
        description="Reset your Digital AELA account password"
        keywords="forgot password, password reset, Digital AELA"
        url="https://digitalaela.com/forgot-password"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.18),transparent_65%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20 mt-20">
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
              Password Recovery
            </motion.span>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Forgot Password?
            </h1>
            <p className="text-sm text-slate-300/80">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Email Address
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_32px_rgba(245,210,106,0.3)] transition focus:outline-none focus:ring focus:ring-[#F5D26A]/40 disabled:cursor-not-allowed disabled:opacity-80">
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </motion.button>
          </form>

          <div className="text-center text-xs text-slate-300/70">
            Remember your password?{" "}
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

export default ForgotPassword;

