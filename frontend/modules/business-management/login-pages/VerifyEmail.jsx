import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import SEO from "../../../src/components/SEO";
import { verifyEmail, resendVerificationEmail } from "../../../src/services/api/auth";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      handleVerify();
    } else {
      setIsError(true);
      setErrorMessage("Invalid verification link. Please check your email for the correct link.");
    }
  }, [token]);

  const handleVerify = async () => {
    setIsVerifying(true);
    setIsError(false);
    try {
      const result = await verifyEmail(token);
      setIsVerified(true);
      toast.success(result.message || "Email verified successfully!");
      setTimeout(() => {
        navigate("/login/student", { replace: true });
      }, 3000);
    } catch (error) {
      setIsError(true);
      if (error.code === "INVALID_TOKEN") {
        setErrorMessage("Invalid or expired verification link. Please request a new verification email.");
      } else {
        setErrorMessage(error.message || "Failed to verify email. Please try again.");
      }
      toast.error(error.message || "Failed to verify email");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationEmail(email.trim().toLowerCase());
      toast.success("Verification email sent! Please check your inbox.");
      setIsError(false);
    } catch (error) {
      toast.error(error.message || "Failed to send verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-[#020409] text-white">
        <SEO
          title="Email Verified | Digital AELA"
          description="Your email has been successfully verified"
          keywords="email verification, verify email, Digital AELA"
          url="https://digitalaela.com/verify-email"
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
              Email Verified Successfully!
            </h1>
            <p className="text-sm text-slate-300/80">
              Your email address has been verified. You can now log in to your account.
            </p>
            <p className="text-xs text-slate-400/80 animate-pulse">
              Redirecting to login page...
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#020409] text-white">
        <SEO
          title="Verifying Email | Digital AELA"
          description="Verifying your email address"
          keywords="email verification, verify email, Digital AELA"
          url="https://digitalaela.com/verify-email"
        />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.18),transparent_65%)]" />

        <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-lg space-y-8 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_30px_90px_rgba(191,148,72,0.38)] backdrop-blur-xl supports-backdrop-filter:bg-white/18 sm:p-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-16 h-16 rounded-full border-4 border-[#F5D26A]/30 border-t-[#F5D26A] mb-4"
            />
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Verifying Email...
            </h1>
            <p className="text-sm text-slate-300/80">
              Please wait while we verify your email address.
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Verify Email | Digital AELA"
        description="Verify your email address"
        keywords="email verification, verify email, Digital AELA"
        url="https://digitalaela.com/verify-email"
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
              Email Verification
            </motion.span>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              {isError ? "Verification Failed" : "Verify Your Email"}
            </h1>
            <p className="text-sm text-slate-300/80">
              {isError
                ? errorMessage
                : "Click the verification link in your email to verify your account."}
            </p>
          </div>

          {isError && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {errorMessage}
              </div>

              <form onSubmit={handleResend} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-100">
                    Email Address
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
                  />
                </label>

                <motion.button
                  type="submit"
                  disabled={isResending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_32px_rgba(245,210,106,0.3)] transition focus:outline-none focus:ring focus:ring-[#F5D26A]/40 disabled:cursor-not-allowed disabled:opacity-80">
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </motion.button>
              </form>
            </div>
          )}

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

export default VerifyEmail;

