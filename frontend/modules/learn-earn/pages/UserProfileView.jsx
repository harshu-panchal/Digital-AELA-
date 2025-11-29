import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaSpinner,
  FaUser,
  FaCoins,
  FaTrophy,
  FaClock,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaBriefcase,
  FaLink,
  FaGlobe,
  FaLinkedin,
  FaGithub,
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaFacebook,
  FaTiktok,
} from "react-icons/fa";
import { HiOutlineChatBubbleOvalLeft, HiOutlineUserPlus, HiCheckCircle } from "react-icons/hi2";
import { fetchStudentProfile } from "../../../src/services/api/student";
import { fetchPublicUserStats } from "../../../src/services/api/learnEarn";
import { followUser, unfollowUser, fetchFollowing } from "../../../src/services/api/social";
import { useAuth } from "../../../src/contexts/AuthContext";
import { useUser } from "../../../src/contexts/UserContext";
import TranslatedText from "../../../src/components/TranslatedText";

const UserProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { refreshSocialStats } = useUser();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState(new Map());
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load profile and stats in parallel
        const [profileData, statsData] = await Promise.all([
          fetchStudentProfile(userId).catch((error) => {
            // Only log non-404 errors (404 is expected if profile doesn't exist)
            if (error?.status !== 404) {
              console.warn("Failed to load profile:", error);
            }
            return null;
          }),
          fetchPublicUserStats(userId).catch((error) => {
            // Only log non-404 errors (404 is expected if stats don't exist)
            if (error?.status !== 404) {
              console.warn("Failed to load user stats:", error);
            }
            return null;
          }),
        ]);

        setProfile(profileData);
        setStats(statsData);

        // Load following status if user is authenticated
        if (authUser?.id && authUser.id !== userId) {
          try {
            const followingData = await fetchFollowing(authUser.id);
            // The API returns { data: [...], meta: {...} }
            const followingList = followingData?.data || [];
            const followingSet = new Set(
              followingList.map((user) => {
                // User objects have id, userId, or _id fields
                return user.id || user.userId || user._id || user;
              })
            );
            // Check if the viewed user is in the following list
            const isUserFollowed = followingSet.has(userId);
            setIsFollowing(isUserFollowed);
            setFollowingStatus(new Map([[userId, isUserFollowed]]));
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn("Failed to load following status:", error);
            setIsFollowing(false);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load profile:", error);
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, authUser]);

  const handleFollow = async () => {
    if (!authUser?.id || authUser.id === userId) return;

    const currentStatus = isFollowing;
    setIsFollowing(!currentStatus);
    setIsLoadingFollow(true);

    try {
      if (currentStatus) {
        await unfollowUser(userId);
        toast.success("Unfollowed successfully");
      } else {
        await followUser(userId);
        toast.success("Following successfully");
      }
      
      // Update following status
      setFollowingStatus(new Map([[userId, !currentStatus]]));
      
      // Refresh social stats
      if (refreshSocialStats) {
        refreshSocialStats();
      }
    } catch (error) {
      // Rollback on error
      setIsFollowing(currentStatus);
      toast.error(error?.message || "Failed to update follow status");
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const getSocialIcon = (platform) => {
    const icons = {
      LinkedIn: FaLinkedin,
      GitHub: FaGithub,
      Instagram: FaInstagram,
      YouTube: FaYoutube,
      Twitter: FaTwitter,
      Facebook: FaFacebook,
      TikTok: FaTiktok,
      Website: FaGlobe,
    };
    return icons[platform] || FaLink;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <FaSpinner className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!profile && !stats) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-4">This user profile does not exist.</p>
          <button
            onClick={() => navigate("/learn-earn/find-learners")}
            className="bg-[#D4AF37] text-black py-2 px-6 rounded-lg font-bold hover:bg-[#E5C158] transition-colors">
            Back to Find Learners
          </button>
        </div>
      </div>
    );
  }

  const user = profile?.user || stats?.user || {};
  const location = profile?.location || {};
  const experience = profile?.experience || {};
  const earnings = stats?.earnings || {};
  const statsData = stats?.stats || {};

  const isCurrentUser = authUser?.id === userId;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <Motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors">
          <FaArrowLeft className="w-4 h-4" />
          Back
        </Motion.button>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-[#0f0f0f] p-6 sm:p-8 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <div className="flex-shrink-0">
              {profile?.avatarUrl || stats?.user?.avatarUrl ? (
                <img
                  src={profile.avatarUrl || stats.user.avatarUrl}
                  alt={user.fullName || "User"}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#D4AF37]/30"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border-4 border-[#D4AF37]/30">
                  <FaUser className="w-12 h-12 sm:w-16 sm:h-16 text-[#D4AF37]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {user.fullName || profile?.fullName || "User"}
                  </h1>
                  <p className="text-xs text-gray-400 mb-2">User ID: {user._id || user.id || userId || "N/A"}</p>
                  {profile?.headline && (
                    <p className="text-lg text-[#F5D26A] mb-3">{profile.headline}</p>
                  )}
                  {profile?.bio && (
                    <p className="text-gray-300 mb-4 text-sm sm:text-base">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-400">
                    {location.city && location.country && (
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4" />
                        <span>{location.city}, {location.country}</span>
                      </div>
                    )}
                    {profile?.profession && (
                      <div className="flex items-center gap-2">
                        <FaBriefcase className="w-4 h-4" />
                        <span>{profile.profession}</span>
                      </div>
                    )}
                  </div>
                </div>
                {!isCurrentUser && authUser?.id && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-start sm:flex-shrink-0">
                    <button
                      onClick={handleFollow}
                      disabled={isLoadingFollow}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${
                        isFollowing
                          ? "border border-white/10 bg-[#151515] text-gray-300 hover:bg-[#1a1a1a]"
                          : "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black hover:brightness-110"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}>
                      {isLoadingFollow ? (
                        <FaSpinner className="h-4 w-4 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <HiCheckCircle className="h-4 w-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <HiOutlineUserPlus className="h-4 w-4" />
                          Follow
                        </>
                      )}
                    </button>
                    <Link
                      to={`/learn-earn/chat?userId=${userId}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:brightness-110 transition whitespace-nowrap">
                      <HiOutlineChatBubbleOvalLeft className="h-4 w-4" />
                      Message
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Earnings Section */}
          {stats && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#151515]/80">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaCoins className="text-[#D4AF37]" />
                Earnings & Stats
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-[#D4AF37]/20 bg-[#0f0f0f]">
                  <p className="text-xs text-gray-400 mb-1">Total Coins</p>
                  <p className="text-lg font-bold text-[#D4AF37]">
                    {earnings.totalCoins || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#D4AF37]/20 bg-[#0f0f0f]">
                  <p className="text-xs text-gray-400 mb-1">Available</p>
                  <p className="text-lg font-bold text-[#F5D26A]">
                    {earnings.availableCoins || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#D4AF37]/20 bg-[#0f0f0f]">
                  <p className="text-xs text-gray-400 mb-1">Total Earned</p>
                  <p className="text-lg font-bold text-green-400">
                    {earnings.totalEarned || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#D4AF37]/20 bg-[#0f0f0f]">
                  <p className="text-xs text-gray-400 mb-1">Redeemed</p>
                  <p className="text-lg font-bold text-gray-300">
                    {earnings.redeemedCoins || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Section */}
          {stats && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#151515]/80">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaTrophy className="text-[#D4AF37]" />
                Learning Stats
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-blue-500/20 bg-[#0f0f0f]">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FaClock className="w-3 h-3" />
                    Learning Hours
                  </p>
                  <p className="text-lg font-bold text-blue-400">
                    {statsData.learningHours || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-purple-500/20 bg-[#0f0f0f]">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FaGraduationCap className="w-3 h-3" />
                    Active Courses
                  </p>
                  <p className="text-lg font-bold text-purple-400">
                    {statsData.activeCourses || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-orange-500/20 bg-[#0f0f0f]">
                  <p className="text-xs text-gray-400 mb-1">Streak</p>
                  <p className="text-lg font-bold text-orange-400">
                    {statsData.streak || 0} days
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-green-500/20 bg-[#0f0f0f]">
                  <p className="text-xs text-gray-400 mb-1">Speaking Score</p>
                  <p className="text-lg font-bold text-green-400">
                    {statsData.speakingScore ? `${statsData.speakingScore}/10` : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Skills & Interests */}
          {(profile?.skills?.length > 0 || profile?.interests?.length > 0) && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#151515]/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {profile.skills?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#F5D26A] text-sm border border-[#D4AF37]/30">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.interests?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Interests</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 text-sm border border-sky-500/30">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience.years && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#151515]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Experience</h2>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="font-semibold text-[#D4AF37]">{experience.years} years</span>
                  {experience.description && ` · ${experience.description}`}
                </p>
              </div>
            </div>
          )}

          {/* Social Links */}
          {profile?.socialLinks?.length > 0 && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#151515]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Social Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.socialLinks.map((link, index) => {
                  const Icon = getSocialIcon(link.platform);
                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors p-3 rounded-lg hover:bg-[#0f0f0f]">
                      <Icon className="w-5 h-5 text-[#D4AF37]" />
                      <span>{link.platform} {link.verified && <span className="text-green-400">✓</span>}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {(profile?.englishLevel || profile?.profession) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {profile.englishLevel && (
                <div className="p-4 rounded-xl border border-white/10 bg-[#151515]/80">
                  <p className="text-sm text-gray-400 mb-1">English Level</p>
                  <p className="text-lg font-semibold text-white">{profile.englishLevel}</p>
                </div>
              )}
              {profile.profession && (
                <div className="p-4 rounded-xl border border-white/10 bg-[#151515]/80">
                  <p className="text-sm text-gray-400 mb-1">Profession</p>
                  <p className="text-lg font-semibold text-white">{profile.profession}</p>
                </div>
              )}
            </div>
          )}
        </Motion.div>
      </div>
    </div>
  );
};

export default UserProfileView;

