import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";

const externalDonateUrl = "https://digitalaela.com/donate";

const DonatePayment = () => {
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const type = query.get("type") || "anyone";
  const nearOneDetails = {
    userId: query.get("userId") || "",
    fullName: query.get("fullName") || "",
    email: query.get("email") || "",
    phone: query.get("phone") || "",
    relation: query.get("relation") || "",
    location: query.get("location") || "",
    message: query.get("message") || "",
  };

  const proceedToGateway = () => {
    window.open(externalDonateUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#020409] text-white">
      <SEO
        title="Digital AELA | Donation Checkout"
        description="Complete your donation to the Digital AELA learner community with secure payment options."
        keywords="Digital AELA donation, sponsor student, education charity"
        url="https://digitalaela.com/donate/payment"
      />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#D4AF37]/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-[#0E1635]/70 blur-[180px]" />
          <div className="absolute top-1/3 left-0 hidden h-80 w-80 -translate-x-1/2 rounded-full bg-[#103350]/35 blur-[140px] lg:block" />
        </div>

        <main className="relative z-10 pt-28 pb-24">
          <div className="layout-container">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="mb-10">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-[#D4AF37] transition hover:text-[#FFE28A]">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
                Back to home
              </Link>
            </motion.div>

            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.6fr_1fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur supports-backdrop-filter:bg-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF37]/80">
                  Donation Summary
                </p>
                <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                  You&apos;re almost done
                </h1>
                <p className="mt-3 text-base text-slate-300/85">
                  Review the details below before you continue to our secure payment partner. Your
                  contribution directly fuels Digital AELA centres and learner scholarships.
                </p>

                <div className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-black/30 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                      Donation Type
                    </span>
                    <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1 text-xs font-semibold text-[#F5D26A]">
                      {type === "near" ? "Dedicated Gift" : "Open Contribution"}
                    </span>
                  </div>

                  {type === "near" ? (
                    <div className="space-y-4 text-sm text-slate-200/90">
                      <p>
                        <span className="font-semibold text-white">Recipient:</span> {nearOneDetails.fullName || "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-white">User ID:</span> {nearOneDetails.userId || "-"}
                      </p>
                      {nearOneDetails.relation && (
                        <p>
                          <span className="font-semibold text-white">Relation:</span> {nearOneDetails.relation}
                        </p>
                      )}
                      {nearOneDetails.location && (
                        <p>
                          <span className="font-semibold text-white">Location:</span> {nearOneDetails.location}
                        </p>
                      )}
                      {nearOneDetails.email && (
                        <p>
                          <span className="font-semibold text-white">Email:</span> {nearOneDetails.email}
                        </p>
                      )}
                      {nearOneDetails.phone && (
                        <p>
                          <span className="font-semibold text-white">Phone:</span> {nearOneDetails.phone}
                        </p>
                      )}
                      {nearOneDetails.message && (
                        <div>
                          <span className="font-semibold text-white">Message:</span>
                          <p className="mt-1 text-sm text-slate-300/85">
                            {nearOneDetails.message}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 text-sm text-slate-200/90">
                      <p>
                        Your contribution will be channelled to learners based on priority waitlists across
                        Digital AELA centres. We ensure every rupee is accounted for and shared with you in the
                        quarterly impact report.
                      </p>
                      <p className="text-slate-300/70">
                        Need to dedicate this gift instead?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = "/donate/payment?type=near";
                          }}
                          className="text-[#D4AF37] hover:text-[#FFE28A]">
                          Restart with dedication form.
                        </button>
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 rounded-2xl border border-[#D4AF37]/20 bg-[#0B1221]/60 p-6">
                  <h2 className="text-lg font-semibold text-white">How your donation helps</h2>
                  <ul className="mt-4 space-y-3 text-sm text-slate-300/85">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#D4AF37]" />
                      Subsidises tuition, certification fees, and mentorship pods for learners from emerging cities.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#D4AF37]" />
                      Expands Digital AELA community labs with new books, devices, and facilitator hours.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#D4AF37]" />
                      Powers rapid response scholarships for learners at risk of dropping out.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.45, ease: "easeOut" }}
                  className="rounded-3xl border border-[#D4AF37]/25 bg-black/60 p-6 text-center shadow-[0_25px_80px_rgba(12,12,12,0.6)]">
                  <h3 className="text-xl font-bold text-white">Checkout</h3>
                  <p className="mt-2 text-sm text-slate-300/80">
                    You&apos;ll be redirected to our secure payment partner to complete your donation.
                  </p>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={proceedToGateway}
                    className="mt-5 w-full rounded-full bg-linear-to-r from-[#D4AF37] to-[#E5C158] px-5 py-3 text-sm font-bold text-black shadow-[0_15px_40px_rgba(245,210,106,0.35)] transition hover:brightness-110">
                    Proceed to secure payment
                  </motion.button>

                  <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/70">
                    powered by digital aela trust
                  </p>
                </motion.div>

                <div className="rounded-3xl border border-white/5 bg-white/5 p-6">
                  <h4 className="text-base font-semibold text-white">Need assistance?</h4>
                  <p className="mt-2 text-sm text-slate-300/85">
                    Write to us at{' '}
                    <a
                      className="text-[#D4AF37] underline-offset-2 hover:underline"
                      href="mailto:donations@digitalaela.com">
                      donations@digitalaela.com
                    </a>{' '}
                    or WhatsApp +971-508-185-690. We&apos;re here to help you complete the process.
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DonatePayment;
