import { useState } from "react";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const BranchOwnerRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    region: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  motion.div;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Branch Owner Registration | Digital AELA"
        description="Partner with Digital AELA as a branch owner. Submit your details to start your centre onboarding process."
        keywords="branch owner registration, franchise signup, Digital AELA"
        url="https://digitalaela.com/register/branch-owner"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.18),transparent_65%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-xl space-y-10 rounded-3xl border border-white/15 bg-white/10 p-8 shadow-[0_40px_120px_rgba(191,148,72,0.45)] backdrop-blur-2xl supports-backdrop-filter:bg-white/18 sm:p-12">
          <div className="space-y-4 text-center">
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/50 bg-[#F5D26A]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-[#F5D26A]">
              Launch a Branch
            </motion.span>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Start Your Digital AELA Centre</h1>
            <p className="text-sm text-slate-300/80">
              Share your details to begin the partnership process. Our expansion team will design a launch roadmap with you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">Full Name</span>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Ravi Menon"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">Email</span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="owner@digitalaela.center"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Contact Number</span>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+971 50 123 4567"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Region / City</span>
                <input
                  type="text"
                  name="region"
                  required
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="Dubai, UAE"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Password</span>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/35 backdrop-blur"
                />
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-6 py-3 text-sm font-semibold text-black shadow-[0_12px_40px_rgba(245,210,106,0.35)] transition focus:outline-none focus:ring-2 focus:ring-[#F5D26A]/50 disabled:cursor-not-allowed disabled:opacity-80">
              {isSubmitting ? "Submitting..." : "Create account"}
            </motion.button>
          </form>

          <div className="text-center text-xs text-slate-300/70">
            Already an owner?{" "}
            <motion.a
              whileHover={{ x: 2 }}
              href="/login/branch-owner"
              className="text-[#F5D26A] underline-offset-2 hover:text-[#FFE28A]">
              Sign in to your dashboard
            </motion.a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default BranchOwnerRegister;
