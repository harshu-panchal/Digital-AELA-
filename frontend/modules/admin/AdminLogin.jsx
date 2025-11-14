import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaShieldAlt, FaLock, FaEnvelope } from "react-icons/fa";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  isValidEmail,
  safeString,
} from "../../src/utils/registrationHelpers";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = safeString(formData.email).toLowerCase();
    const password = safeString(formData.password);

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await login({
        email,
        password,
        role: "super-admin",
      });

      // Verify that the user is actually a super-admin
      if (authenticatedUser.role !== "super-admin") {
        toast.error("Access denied. This portal is for super administrators only.");
        return;
      }

      toast.success(`Welcome back, ${authenticatedUser.fullName || "Admin"}!`);
      navigate("/super-admin", { replace: true });
      setFormData({ email: "", password: "" });
    } catch (error) {
      toast.error(
        error.message || "Authentication failed. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if already logged in as super-admin
  useEffect(() => {
    if (user && user.role === "super-admin") {
      navigate("/super-admin", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#050505] to-black text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.15),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(214,162,64,0.08),transparent_60%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md space-y-8 rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#0f0f0f] via-[#0a0a0a] to-black p-8 shadow-[0_30px_90px_rgba(212,175,55,0.25)] backdrop-blur-xl">
          {/* Header */}
          <div className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10">
              <FaShieldAlt className="h-8 w-8 text-[#D4AF37]" />
            </motion.div>
            <div>
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                <FaLock className="h-3 w-3" />
                Admin Portal
              </motion.span>
              <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                Super Admin Access
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Restricted access. Authorized personnel only.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <FaEnvelope className="h-3.5 w-3.5 text-[#D4AF37]" />
                Email Address
              </span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@digitalaela.com"
                className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                autoComplete="email"
              />
            </label>

            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                <FaLock className="h-3.5 w-3.5 text-[#D4AF37]" />
                Password
              </span>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                autoComplete="current-password"
              />
            </label>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-5 py-3.5 text-sm font-semibold text-black shadow-lg shadow-[#D4AF37]/30 transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Authenticating...
                </>
              ) : (
                <>
                  <FaShieldAlt className="h-4 w-4" />
                  Access Dashboard
                </>
              )}
            </motion.button>
          </form>

          {/* Security Notice */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs text-amber-200/80">
              <strong className="text-amber-200">Security Notice:</strong> This portal is
              restricted to authorized super administrators only. Unauthorized access attempts
              are logged and monitored.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminLogin;

