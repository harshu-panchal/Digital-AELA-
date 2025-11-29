import React from "react";
import {
  HiOutlineMapPin,
  HiOutlineGlobeAlt,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import TranslatedText from "../../../src/components/TranslatedText";

const StatItem = ({ label, value }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-center">
    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{typeof label === "string" ? label : label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
  </div>
);

const ProfileHeader = ({ profile, roleBadge, actionSlot, metrics = [] }) => {
  if (!profile) return null;

  return (
    <section className="space-y-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#080808] via-[#050505] to-[#010101] p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-start gap-6">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-28 w-28 rounded-[28px] border-2 border-white/20 object-cover"
            />
            <span className="absolute -bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-black">
              <HiOutlineSparkles className="h-4 w-4" />
              <TranslatedText>Spotlight</TranslatedText>
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-white">
                  <TranslatedText>{profile.name}</TranslatedText>
                </h1>
                {roleBadge}
              </div>
              <p className="mt-2 text-sm text-gray-400"><TranslatedText>{profile.headline}</TranslatedText></p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-gray-400">
              {profile.location && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2">
                  <HiOutlineMapPin className="h-4 w-4" />
                  <TranslatedText>{profile.location}</TranslatedText>
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-white/30">
                  <HiOutlineGlobeAlt className="h-4 w-4" />
                  <TranslatedText>Website</TranslatedText>
                </a>
              )}
              {profile.availability && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-emerald-200">
                  <HiOutlineUserGroup className="h-4 w-4" />
                  <TranslatedText>Availability</TranslatedText> · <TranslatedText>{profile.availability}</TranslatedText>
                </span>
              )}
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-gray-300">
              <TranslatedText>{profile.bio}</TranslatedText>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {profile.badges?.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                  <TranslatedText>{badge}</TranslatedText>
                </span>
              ))}
            </div>
          </div>
        </div>

        {actionSlot}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item, index) => (
          <StatItem key={item.id || item.key || `metric-${index}`} label={item.label} value={item.value} />
        ))}
      </div>

    </section>
  );
};

export default ProfileHeader;


