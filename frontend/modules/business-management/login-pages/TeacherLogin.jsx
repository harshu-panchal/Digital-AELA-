import { useState } from "react";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const TeacherLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Touch motion to satisfy eslint no-unused-vars when using motion.* in JSX
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
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Teacher Login | Digital AELA"
        description="Secure login portal for Digital AELA teachers. Access classrooms, schedules, and resources."
        keywords="teacher login, instructor portal, Digital AELA"
        url="https://digitalaela.com/login/teacher"
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
              className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.25em] text-[#F5D26A]">
              Teacher Portal
            </motion.span>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Welcome back, Mentor
            </h1>
            <p className="text-sm text-slate-300/80">
              Log in to manage live classrooms, upload resources, and stay
              connected with your learners.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Email
              </span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@digitalaela.com"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Password
              </span>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 transition focus:border-[#F5D26A]/60 focus:outline-none focus:ring focus:ring-[#F5D26A]/30 backdrop-blur"
              />
            </label>

            <div className="flex items-center justify-between text-xs text-slate-400/80">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/25 bg-white/10 text-[#F5D26A] focus:ring-[#F5D26A]/40"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-[#F5D26A] transition hover:text-[#FFE28A]">
                Forgot password?
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-[#F5D26A] via-[#E5C158] to-[#BA8D2F] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_32px_rgba(245,210,106,0.3)] transition focus:outline-none focus:ring focus:ring-[#F5D26A]/40 disabled:cursor-not-allowed disabled:opacity-80">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </motion.button>
          </form>

          <div className="text-center text-xs text-slate-300/70">
            New to Digital AELA?{" "}
            <motion.a
              whileHover={{ x: 2 }}
              href="/register/teacher"
              className="text-[#F5D26A] underline-offset-2 hover:text-[#FFE28A]">
              Create a teacher account
            </motion.a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TeacherLogin;
