import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineSparkles,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import PostGrid from "../components/PostGrid";
import ProfileHeader from "../components/ProfileHeader";
import { useExploreJobs } from "../context/ExploreJobsContext";
import { useAuth } from "../../../src/contexts/AuthContext";
import { fetchStudentProfile } from "../../../src/services/api/student";
import TranslatedText from "../../../src/components/TranslatedText";

const SeekerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const {
    recruiterJobPosts,
    appliedPostIds,
    savedPostIds,
    applyToJob,
    toggleSavePost,
  } = useExploreJobs();
  
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch student profile from backend
  useEffect(() => {
    const loadStudentProfile = async () => {
      if (!authUser?.id) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        const response = await fetchStudentProfile(authUser.id);
        const profileData = response?.data || response;
        
        // Map backend student profile to ProfileHeader format
        const mappedProfile = {
          name: authUser.fullName || profileData.user?.fullName || "Student",
          avatar: profileData.avatarUrl || authUser.metadata?.avatarUrl || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
          headline: profileData.headline || authUser.metadata?.headline || "",
          bio: profileData.bio || "",
          location: (() => {
            if (!profileData.location) return undefined;
            const parts = [];
            if (profileData.location.city) parts.push(profileData.location.city);
            if (profileData.location.country) parts.push(profileData.location.country);
            return parts.length > 0 ? parts.join(", ") : undefined;
          })(),
          website: profileData.websiteUrl || profileData.socialLinks?.find(link => link.platform === "Website")?.url || undefined,
          availability: profileData.currentStatus 
            ? profileData.currentStatus.replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase())
            : "Open to opportunities",
          badges: [
            ...(profileData.profession ? [profileData.profession] : []),
            ...(profileData.englishLevel ? [`${profileData.englishLevel} English`] : []),
            ...(profileData.skills?.slice(0, 2) || []),
          ].filter(Boolean),
        };
        
        setStudentProfile(mappedProfile);
      } catch (error) {
        console.error("Failed to load student profile:", error);
        // Fallback to basic profile from auth user
        setStudentProfile({
          name: authUser.fullName || "Student",
          avatar: authUser.metadata?.avatarUrl || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
          headline: authUser.metadata?.headline || "",
          bio: "",
          location: undefined,
          website: undefined,
          availability: "Open to opportunities",
          badges: [],
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadStudentProfile();
  }, [authUser]);

  const appliedJobs = useMemo(() => {
    return recruiterJobPosts.filter((post) => appliedPostIds.has(post.id));
  }, [recruiterJobPosts, appliedPostIds]);

  const availableJobs = useMemo(() => {
    return recruiterJobPosts.filter((post) => !appliedPostIds.has(post.id));
  }, [recruiterJobPosts, appliedPostIds]);

  const stats = useMemo(() => {
    return [
      { label: <TranslatedText>Applied</TranslatedText>, value: appliedPostIds.size },
      { label: <TranslatedText>Saved</TranslatedText>, value: savedPostIds.size },
      { label: <TranslatedText>Available</TranslatedText>, value: availableJobs.length },
      { label: <TranslatedText>Total Jobs</TranslatedText>, value: recruiterJobPosts.length },
    ];
  }, [appliedPostIds, savedPostIds, availableJobs.length, recruiterJobPosts.length]);

  const handleOpenPost = (post) => {
    navigate(`/explore-jobs/post/${post.id}`, {
      state: { backgroundLocation: location },
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#D4AF37] border-r-transparent"></div>
          <p className="mt-6 text-base font-medium text-white"><TranslatedText>Loading profile...</TranslatedText></p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {studentProfile && (
        <ProfileHeader
          profile={studentProfile}
          roleBadge={
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              <HiOutlineSparkles className="h-4 w-4" />
              <TranslatedText>Job Seeker</TranslatedText>
            </span>
          }
          metrics={stats}
        />
      )}

      {appliedJobs.length > 0 && (
        <section className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                <TranslatedText>Applied Jobs</TranslatedText>
              </p>
              <h2 className="text-xl font-semibold text-white">
                <TranslatedText>Jobs you've applied to</TranslatedText>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <HiOutlineCheckCircle className="h-4 w-4" />
              <TranslatedText>{appliedJobs.length} application{appliedJobs.length !== 1 ? "s" : ""}</TranslatedText>
            </div>
          </header>

          <PostGrid
            posts={appliedJobs}
            onOpen={handleOpenPost}
            onSave={toggleSavePost}
            onApply={applyToJob}
            savedPostIds={savedPostIds}
            appliedPostIds={appliedPostIds}
            emptyState={
              <>
                <h3 className="text-lg font-semibold text-white">
                  <TranslatedText>No applications yet</TranslatedText>
                </h3>
                <p className="mt-2 max-w-md text-sm text-gray-400">
                  <TranslatedText>Start exploring available jobs and apply to positions that match your skills.</TranslatedText>
                </p>
              </>
            }
          />
        </section>
      )}

      <section className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              <TranslatedText>Available Jobs</TranslatedText>
            </p>
            <h2 className="text-xl font-semibold text-white">
              <TranslatedText>Explore and apply to new opportunities</TranslatedText>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <HiOutlineClipboardDocumentList className="h-4 w-4" />
            <TranslatedText>{availableJobs.length} job{availableJobs.length !== 1 ? "s" : ""} available</TranslatedText>
          </div>
        </header>

        <PostGrid
          posts={availableJobs}
          onOpen={handleOpenPost}
          onSave={toggleSavePost}
          onApply={applyToJob}
          savedPostIds={savedPostIds}
          appliedPostIds={appliedPostIds}
          emptyState={
            <>
              <h3 className="text-lg font-semibold text-white">
                <TranslatedText>No jobs available at the moment</TranslatedText>
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                <TranslatedText>Check back later for new job opportunities from recruiters.</TranslatedText>
              </p>
            </>
          }
        />
      </section>
    </div>
  );
};

export default SeekerDashboard;


