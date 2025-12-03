import React from "react";
import {
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineLink,
  HiOutlineCheckCircle,
  HiOutlineArrowUpRight,
} from "react-icons/hi2";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../../../src/contexts/AuthContext";
import TranslatedText from "../../../src/components/TranslatedText";
import { getMediaUrl } from "../../../src/utils/mediaUrl";

const StatPill = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
    <Icon className="h-5 w-5 text-white/70" />
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-[0.3em] text-gray-500">
        {label}
      </span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  </div>
);

const Section = ({ title, children, action }) => (
  <section className="space-y-4 rounded-[28px] border border-white/5 bg-black/50 p-6 lg:p-8">
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
          <TranslatedText>Overview</TranslatedText>
        </p>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      {action}
    </header>
    {children}
  </section>
);

const formatTimeAgo = (dateString) =>
  formatDistanceToNow(new Date(dateString), { addSuffix: true });

const PostDetailContent = ({ post, onApply, hasApplied }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  if (!post) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-semibold text-white"><TranslatedText>Post not found</TranslatedText></h2>
        <p className="mt-2 max-w-md text-sm text-gray-400">
          <TranslatedText>The post you are looking for might have been removed or is temporarily unavailable. Try exploring the feed for similar opportunities.</TranslatedText>
        </p>
      </div>
    );
  }

  const isJob = post.type === "job";

  const handleApply = () => {
    if (onApply && post.id) {
      onApply(post.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10">
        <img
          src={getMediaUrl(post.image) || "https://via.placeholder.com/800x400?text=Post"}
          alt={post.title}
          className="h-72 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 px-6 pb-6">
          <div className="flex items-center gap-4">
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="h-14 w-14 rounded-full border-2 border-white/40 object-cover"
            />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                {isJob ? <TranslatedText>Recruiter</TranslatedText> : <TranslatedText>Job Seeker</TranslatedText>}
              </p>
              <h2 className="text-2xl font-semibold text-white">
                <TranslatedText>{post.authorName}</TranslatedText>
              </h2>
              <p className="text-xs text-gray-300">
                <TranslatedText>Posted</TranslatedText> {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white">
            <span className="rounded-full bg-white/20 px-4 py-2">
              {isJob ? <TranslatedText>Role Drop</TranslatedText> : <TranslatedText>Resume Spotlight</TranslatedText>}
            </span>
            {post.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/30 px-4 py-2">
                <TranslatedText>{tag}</TranslatedText>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-white"><TranslatedText>{post.title}</TranslatedText></h1>
        <p className="text-lg text-gray-300">
          {isJob ? <TranslatedText>{post.company}</TranslatedText> : <TranslatedText>{post.headline}</TranslatedText>}
        </p>
        <p className="text-sm leading-relaxed text-gray-400">
          {isJob ? <TranslatedText>{post.description}</TranslatedText> : <TranslatedText>{post.summary}</TranslatedText>}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {isJob && (
          <button
            type="button"
            onClick={handleApply}
            disabled={hasApplied}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              hasApplied
                ? "cursor-not-allowed border border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                : "bg-white text-black hover:-translate-y-0.5"
            }`}>
            <HiOutlineSparkles className="h-5 w-5" />
            {hasApplied ? <TranslatedText>Applied</TranslatedText> : <TranslatedText>Instant Apply</TranslatedText>}
          </button>
        )}
        {!isJob && (
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5">
            <HiOutlineSparkles className="h-5 w-5" />
            <TranslatedText>Refer Candidate</TranslatedText>
          </button>
        )}
        <a
          href={post.resumeUrl ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/70 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30">
          <HiOutlineLink className="h-5 w-5" />
          {isJob ? <TranslatedText>View Job Description</TranslatedText> : <TranslatedText>View Portfolio</TranslatedText>}
        </a>
      </section>

      {isJob ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Section
            title={<TranslatedText>Role Snapshot</TranslatedText>}
            action={
              <button
                type="button"
                onClick={handleApply}
                disabled={hasApplied}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  hasApplied
                    ? "cursor-not-allowed border border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "bg-white text-black hover:-translate-y-0.5"
                }`}>
                <HiOutlineSparkles className="h-5 w-5" />
                {hasApplied ? <TranslatedText>Applied</TranslatedText> : <TranslatedText>Apply Now</TranslatedText>}
              </button>
            }>
            <div className="grid gap-4">
              <StatPill
                icon={HiOutlineMapPin}
                label={<TranslatedText>Location</TranslatedText>}
                value={<TranslatedText>{post.location}</TranslatedText>}
              />
              <StatPill
                icon={HiOutlineCurrencyRupee}
                label={<TranslatedText>Compensation</TranslatedText>}
                value={<TranslatedText>{post.salary ?? "Competitive"}</TranslatedText>}
              />
              <StatPill
                icon={HiOutlineBriefcase}
                label={<TranslatedText>Employment</TranslatedText>}
                value={<TranslatedText>{post.employmentType}</TranslatedText>}
              />
              <StatPill
                icon={HiOutlineClock}
                label={<TranslatedText>Experience</TranslatedText>}
                value={<TranslatedText>{post.experience ?? "Flexible"}</TranslatedText>}
              />
            </div>
          </Section>

          <Section title={<TranslatedText>Culture Highlights</TranslatedText>}>
            <ul className="space-y-3 text-sm text-gray-300">
              {post.cultureHighlights?.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                  <HiOutlineCheckCircle className="mt-0.5 h-5 w-5 text-white/70" />
                  <span><TranslatedText>{highlight}</TranslatedText></span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section
            title={<TranslatedText>Experience Highlights</TranslatedText>}
            action={
              <a
                href={post.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40">
                <HiOutlineArrowUpRight className="h-5 w-5" />
                <TranslatedText>View Portfolio</TranslatedText>
              </a>
            }>
            <div className="space-y-4">
              {post.experience?.map((item) => (
                <div
                  key={`${item.company}-${item.role}`}
                  className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                    <TranslatedText>{item.period}</TranslatedText>
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    <TranslatedText>{item.role}</TranslatedText>
                  </p>
                  <p className="text-sm text-gray-300"><TranslatedText>{item.company}</TranslatedText></p>
                </div>
              ))}
            </div>
          </Section>

          <Section title={<TranslatedText>Case Studies & Wins</TranslatedText>}>
            <ul className="space-y-3 text-sm text-gray-300">
              {post.achievements?.map((achievement) => (
                <li
                  key={achievement}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                  <HiOutlineSparkles className="mt-0.5 h-5 w-5 text-white/70" />
                  <span><TranslatedText>{achievement}</TranslatedText></span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}

      {!isJob && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-gray-400">
          <TranslatedText>Availability:</TranslatedText> <span className="font-semibold text-white"><TranslatedText>{post.availability ?? "Open to roles"}</TranslatedText></span>
        </div>
      )}
    </div>
  );
};

export default PostDetailContent;


