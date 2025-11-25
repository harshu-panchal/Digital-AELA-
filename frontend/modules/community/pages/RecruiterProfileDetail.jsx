import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaArrowLeft, FaSpinner, FaUser, FaBriefcase, FaEnvelope, FaLink, FaGlobe, FaLinkedin, FaTwitter, FaPhone, FaBuilding } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import { apiRequest } from "../../../src/services/api/baseClient";

const RecruiterProfileDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        // Fetch recruiter profile from public endpoint
        const profileData = await apiRequest(`/recruiter/${userId}/profile`, {
          skipAuth: true,
        });
        setProfile(profileData);
        setUser(profileData.user || profileData);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load recruiter profile");
        navigate("/student/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060D] flex items-center justify-center">
        <FaSpinner className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#05060D] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-4">This recruiter profile does not exist.</p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="bg-[#D4AF37] text-black py-2 px-6 rounded-lg font-bold hover:bg-[#E5C158] transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const company = profile?.company || user?.metadata?.company || "Talent Partner";
  const headline = profile?.headline || user?.metadata?.headline || "";
  const bio = profile?.bio || profile?.aboutCompany || user?.metadata?.bio || user?.metadata?.aboutCompany || "";
  const aboutCompany = profile?.aboutCompany || user?.metadata?.aboutCompany || bio || "";
  const experience = profile?.experience || user?.metadata?.experience || "";
  const experienceYears = profile?.experienceYears || user?.metadata?.experienceYears || 0;
  const phone = profile?.phone || user?.metadata?.phone || "";
  const socials = profile?.socials || user?.metadata?.socials || {};
  const stats = profile?.stats || {};

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`${user.fullName || "Recruiter"} | Digital AELA`}
        description={bio || headline || `View ${user.fullName || "recruiter"}'s profile on Digital AELA`}
        keywords={`recruiter profile, ${user.fullName}, ${company}, Digital AELA`}
        url={`https://digitalaela.com/community/recruiters/${userId}`}
      />

      <div className="layout-container pt-24 pb-20">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors">
          <FaArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-[#080808]/80 p-8 shadow-[0_28px_75px_rgba(0,0,0,0.55)]">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-shrink-0">
              {(profile?.avatarUrl || user.metadata?.avatarUrl) ? (
                <img
                  src={profile?.avatarUrl || user.metadata?.avatarUrl}
                  alt={user.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#D4AF37]/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border-4 border-[#D4AF37]/30">
                  <FaBriefcase className="w-16 h-16 text-[#D4AF37]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{user.fullName || "Recruiter"}</h1>
              <p className="text-xs text-gray-400 mb-2">User ID: {user._id || user.id || userId || "N/A"}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-4 py-1 rounded-full bg-[#D4AF37]/20 text-[#F5D26A] text-sm border border-[#D4AF37]/30">
                  Recruiter
                </span>
                <span className="px-4 py-1 rounded-full bg-sky-500/20 text-sky-200 text-sm border border-sky-500/30">
                  {company}
                </span>
              </div>
              {headline && (
                <p className="text-lg text-[#F5D26A] mb-3">{headline}</p>
              )}
              {bio && (
                <p className="text-gray-300 mb-4">{bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {user.email && (
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2">
                    <FaPhone className="w-4 h-4" />
                    <span>{phone}</span>
                  </div>
                )}
                {experienceYears > 0 && (
                  <div className="flex items-center gap-2">
                    <FaBriefcase className="w-4 h-4" />
                    <span>{experienceYears} years experience</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {(stats.activeRoles > 0 || stats.totalViews > 0 || stats.totalApplications > 0) && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.activeRoles > 0 && (
                <div className="p-4 rounded-xl border border-white/10 bg-[#0b0b0b]/80 text-center">
                  <p className="text-2xl font-bold text-[#D4AF37]">{stats.activeRoles}</p>
                  <p className="text-sm text-gray-400 mt-1">Active Roles</p>
                </div>
              )}
              {stats.totalViews > 0 && (
                <div className="p-4 rounded-xl border border-white/10 bg-[#0b0b0b]/80 text-center">
                  <p className="text-2xl font-bold text-[#D4AF37]">{stats.totalViews}</p>
                  <p className="text-sm text-gray-400 mt-1">Total Views</p>
                </div>
              )}
              {stats.totalApplications > 0 && (
                <div className="p-4 rounded-xl border border-white/10 bg-[#0b0b0b]/80 text-center">
                  <p className="text-2xl font-bold text-[#D4AF37]">{stats.totalApplications}</p>
                  <p className="text-sm text-gray-400 mt-1">Applications</p>
                </div>
              )}
            </div>
          )}

          {/* Social Links */}
          {(socials.linkedin || socials.website || socials.twitter) && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Connect</h2>
              <div className="flex flex-wrap gap-4">
                {socials.linkedin && (
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                    <FaLinkedin className="w-5 h-5 text-[#D4AF37]" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {socials.website && (
                  <a
                    href={socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                    <FaGlobe className="w-5 h-5 text-[#D4AF37]" />
                    <span>Website</span>
                  </a>
                )}
                {socials.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                    <FaTwitter className="w-5 h-5 text-[#D4AF37]" />
                    <span>Twitter</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* About Company */}
          {aboutCompany && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaBuilding className="w-5 h-5 text-[#D4AF37]" />
                About Company
              </h2>
              <p className="text-gray-300">{aboutCompany}</p>
            </div>
          )}

          {/* Experience */}
          {(experienceYears > 0 || experience) && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Experience</h2>
              {experienceYears > 0 && (
                <p className="text-gray-300 mb-2">
                  <span className="font-semibold text-[#D4AF37]">{experienceYears} years</span> of recruiting experience
                </p>
              )}
              {experience && (
                <p className="text-gray-300">{experience}</p>
              )}
            </div>
          )}

          {/* Company Info */}
          {!aboutCompany && (
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              <p className="text-gray-300">
                {bio || `Connect with ${user.fullName} from ${company} for career opportunities and guidance.`}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RecruiterProfileDetail;

