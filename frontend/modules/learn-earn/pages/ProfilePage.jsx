import { useMemo } from "react";
import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaEdit, FaGlobe, FaLock, FaShieldAlt, FaUniversity } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import { useUser } from "../../../src/contexts/UserContext";

const ProfilePage = () => {
  const { profile } = useUser();

  const infoGrid = useMemo(
    () => [
      { label: "English Level", value: profile.englishLevel },
      { label: "Profession", value: profile.profession },
      { label: "Experience", value: profile.experience },
      { label: "Country", value: profile.country },
      { label: "City", value: profile.city },
      { label: "Marital Status", value: profile.maritalStatus },
    ],
    [profile]
  );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#1f1f1f] via-[#0c0c0c] to-black">
        <div className="flex flex-col gap-6 px-6 pb-8 pt-6 sm:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:gap-5">
              <div className="rounded-full border-4 border-black/80 p-1">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-28 w-28 rounded-full border-4 border-[#D4AF37]/50 object-cover"
                />
              </div>
              <div className="text-center sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
                  <h1 className="text-2xl font-semibold text-white sm:text-3xl">{profile.name}</h1>
                  <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                    {profile.id}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm text-gray-300 sm:text-left">{profile.title}</p>
                <p className="mt-3 text-sm text-gray-400 sm:text-left">{profile.bio}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <Link
                to="/learn-earn/chat"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
                Message
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-[#D4AF37]/30 hover:brightness-110">
                <FaEdit className="h-3.5 w-3.5" />
                Edit profile
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Followers</p>
              <p className="mt-2 text-2xl font-semibold text-white">{profile.followers.toLocaleString()}</p>
              <Link to="/learn-earn" className="mt-3 inline-flex text-xs font-semibold text-[#D4AF37]">
                View growth analytics →
              </Link>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Following</p>
              <p className="mt-2 text-2xl font-semibold text-white">{profile.following.toLocaleString()}</p>
              <p className="mt-3 text-xs text-gray-400">Curating meaningful learning circles</p>
            </div>
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#151515] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Community rating</p>
              <p className="mt-2 text-2xl font-semibold text-white">⭐ {profile.rating.toFixed(1)}</p>
              <p className="mt-3 text-xs text-gray-400">Top 5% of mentors on Learn & Earn</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">About</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {infoGrid.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/5 bg-[#111] p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Interests</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-200">
                  #{interest}
                </span>
              ))}
            </div>
          </div>
        </Motion.div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.32 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Social verification</p>
              <p className="mt-2 text-sm text-gray-300">Connect social accounts to earn bonus coins</p>
            </div>
            <FaShieldAlt className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div className="mt-5 space-y-3">
            {profile.socialLinks.map((link) => (
              <div
                key={link.platform}
                className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-[#111] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <FaGlobe className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">{link.platform}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#D4AF37]/90 underline-offset-4 hover:underline">
                      {link.url}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                      link.verified
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-[#D4AF37]/15 text-[#D4AF37]"
                    }`}>
                    {link.verified ? <FaCheckCircle className="h-3 w-3" /> : <FaLock className="h-3 w-3" />}
                    {link.verified ? "Verified" : "Verify & claim"}
                  </span>
                  <span className="text-xs text-gray-400">+{link.bonus} coins</span>
                </div>
              </div>
            ))}
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.32, delay: 0.1 }}
          className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">Education & achievements</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/5 bg-[#111] p-4">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <FaUniversity className="h-4 w-4 text-[#D4AF37]" />
                <div>
                  <p className="font-semibold text-white">{profile.education}</p>
                  <p className="text-xs text-gray-400">Leadership · Strategic Communication</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#111] p-4 text-sm text-gray-300">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Recent milestones</p>
              <ul className="mt-3 space-y-2 text-xs text-gray-300">
                <li>• Hosted 12 live debates with 95% positive ratings</li>
                <li>• Mentored 48 learners · 320 coins gifted by mentees</li>
                <li>• Published 3 new learning paths this month</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#111] p-4 text-sm text-gray-300">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Presence</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <HiOutlineMapPin className="h-4 w-4" /> Dubai · Hybrid availability · GMT+4
              </div>
            </div>
          </div>
        </Motion.div>
      </section>
    </div>
  );
};

export default ProfilePage;


