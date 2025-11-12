import { useMemo } from "react";
import { motion } from "framer-motion";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();

  const { headlineStats, approvals, activityFeed, quickActions } =
    useMemo(() => {
      const stats = [
        {
          id: "learners",
          label: "Active Learners",
          value: "12,480",
          delta: "+6.4% vs last week",
        },
        {
          id: "teachers",
          label: "Verified Teachers",
          value: "286",
          delta: "24 pending approvals",
        },
        {
          id: "revenue",
          label: "Monthly Revenue",
          value: "AED 428K",
          delta: "+18% YoY",
        },
        {
          id: "jobs",
          label: "Open Jobs",
          value: "94",
          delta: "32 new this week",
        },
      ];

      const approvalQueues = [
        {
          id: "courses",
          title: "Courses Pending Approval",
          items: [
            {
              title: "Executive Presentation Lab",
              owner: "Sarah Thomas",
              submitted: "45 min ago",
            },
            {
              title: "Digital Marketing Sprint 2025",
              owner: "Ahmed Khan",
              submitted: "2 hours ago",
            },
            {
              title: "IELTS Band 8 Mastery",
              owner: "Priya Sharma",
              submitted: "Yesterday",
            },
          ],
          cta: "Review courses",
        },
        {
          id: "ebooks",
          title: "Books & E-Books",
          items: [
            {
              title: "Accent Neutralisation Playbook",
              owner: "Lina Joseph",
              submitted: "12 min ago",
            },
            {
              title: "Leadership Storytelling Guide",
              owner: "David Patel",
              submitted: "1 hour ago",
            },
          ],
          cta: "Moderate library",
        },
        {
          id: "jobs",
          title: "Job Posts",
          items: [
            {
              title: "Communication Coach · Remote",
              owner: "TalentBridge HR",
              submitted: "30 min ago",
            },
            {
              title: "Corporate Trainer · Dubai",
              owner: "GulfSkills",
              submitted: "3 hours ago",
            },
          ],
          cta: "Moderate job board",
        },
      ];

      const activity = [
        {
          icon: "🧾",
          title: "New invoice paid",
          description: "Invoice #INV-2281 · AED 12,999 · Learner: Ali Hassan",
          time: "5 min ago",
        },
        {
          icon: "🎓",
          title: "Course completion spike",
          description: "IELTS Fast Track cohort hit 92% completion",
          time: "1 hour ago",
        },
        {
          icon: "🤝",
          title: "Partnership enquiry",
          description: "Dubai Future Foundation submitted collaboration brief",
          time: "2 hours ago",
        },
        {
          icon: "🛡️",
          title: "Security notice",
          description: "2FA enabled for 184 new accounts",
          time: "Today, 09:15",
        },
      ];

      const actions = [
        {
          label: "Approve teachers",
          description: "24 awaiting verification",
          href: "/super-admin/teachers",
        },
        {
          label: "Moderate course catalog",
          description: "11 new submissions",
          href: "/super-admin/courses",
        },
        {
          label: "Review franchise leads",
          description: "8 warm opportunities",
          href: "/super-admin/franchise",
        },
        {
          label: "System health dashboard",
          description: "Uptime 99.97% · All services operational",
          href: "/super-admin/system-health",
        },
      ];

      return {
        headlineStats: stats,
        approvals: approvalQueues,
        activityFeed: activity,
        quickActions: actions,
      };
    }, []);

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Super Admin Dashboard | Digital AELA"
        description="Monitor platform health, approve content, and manage global operations from the Digital AELA super admin console."
        keywords="super admin dashboard, Digital AELA admin, LMS admin, job board admin"
        url="https://digitalaela.com/super-admin"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,162,64,0.14),transparent_70%)]" />

      <main className="relative z-10 pt-24 pb-20">
        <section className="layout-container space-y-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#F5D26A]/40 bg-[#F5D26A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5D26A]">
              Super Admin Console
            </span>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold md:text-4xl">
                  Welcome back, {user?.fullName?.split(" ")[0] ?? "Admin"}
                </h1>
                <p className="mt-2 text-sm text-slate-300/80">
                  Oversight across learners, mentors, recruiters, and revenue —
                  stay ahead of approvals and platform health.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Monthly NPS{" "}
                  <span className="font-semibold text-[#F5D26A]">4.6 / 5</span>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Platform uptime{" "}
                  <span className="font-semibold text-[#F5D26A]">99.97%</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.section
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {headlineStats.map((stat) => (
              <motion.div
                key={stat.id}
                variants={cardVariants}
                className="rounded-3xl border border-[#F5D26A]/15 bg-[#080B14]/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#F5D26A]/80">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-slate-300/80">{stat.delta}</p>
              </motion.div>
            ))}
          </motion.section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Approval queue
                  </h2>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#F5D26A]/70">
                    Latest submissions
                  </p>
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-3">
                {approvals.map((column) => (
                  <div
                    key={column.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <h3 className="text-sm font-semibold text-white">
                      {column.title}
                    </h3>
                    <ul className="mt-3 space-y-3 text-xs text-slate-300/85">
                      {column.items.map((item) => (
                        <li
                          key={item.title}
                          className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                          <p className="font-semibold text-white/90">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.owner}
                          </p>
                          <p className="text-[11px] text-[#F5D26A]/80">
                            {item.submitted}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="mt-3 text-[11px] font-semibold text-[#F5D26A] hover:text-[#FFE28A]">
                      {column.cta} →
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="space-y-4 rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
              <header className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Recent activity
                </h2>
                <span className="text-xs text-slate-400">Live feed</span>
              </header>
              <div className="space-y-3">
                {activityFeed.map((item, index) => (
                  <motion.div
                    key={`${item.title}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-300/80">
                          {item.description}
                        </p>
                        <p className="text-[11px] text-[#F5D26A]/80">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          <motion.section
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="rounded-3xl border border-white/10 bg-[#0B0F1E]/80 p-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Quick actions
                </h2>
                <p className="text-xs text-slate-300/70">
                  Jump into the most visited admin workspaces
                </p>
              </div>
            </header>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                  <p className="text-base font-semibold text-white">
                    {action.label}
                  </p>
                  <p className="text-xs text-slate-400/80">
                    {action.description}
                  </p>
                  <button
                    type="button"
                    className="mt-2 w-fit rounded-full border border-[#F5D26A]/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#F5D26A] hover:border-[#F5D26A]/70 hover:text-[#FFE28A]">
                    Open workspace →
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        </section>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
