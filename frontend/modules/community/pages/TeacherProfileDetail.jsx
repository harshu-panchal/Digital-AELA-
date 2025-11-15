import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaArrowLeft, FaSpinner, FaUser, FaGraduationCap, FaEnvelope, FaLink, FaGlobe, FaLinkedin, FaTwitter } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import { apiRequest } from "../../../src/services/api/baseClient";

const TeacherProfileDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        // Fetch user data
        const userData = await apiRequest(`/admin/users/id/${userId}`, {
          skipAuth: true,
        });
        setUser(userData);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load teacher profile");
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
          <p className="text-gray-400 mb-4">This teacher profile does not exist.</p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="bg-[#D4AF37] text-black py-2 px-6 rounded-lg font-bold hover:bg-[#E5C158] transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const expertise = user.metadata?.expertise || "English Language";
  const bio = user.metadata?.bio || "";
  const socials = user.metadata?.socials || {};

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`${user.fullName || "Teacher"} | Digital AELA`}
        description={bio || `View ${user.fullName || "teacher"}'s profile on Digital AELA`}
        keywords={`teacher profile, ${user.fullName}, Digital AELA`}
        url={`https://digitalaela.com/community/teachers/${userId}`}
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
              {user.metadata?.avatarUrl ? (
                <img
                  src={user.metadata.avatarUrl}
                  alt={user.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#D4AF37]/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border-4 border-[#D4AF37]/30">
                  <FaGraduationCap className="w-16 h-16 text-[#D4AF37]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{user.fullName || "Teacher"}</h1>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-4 py-1 rounded-full bg-[#D4AF37]/20 text-[#F5D26A] text-sm border border-[#D4AF37]/30">
                  Teacher
                </span>
                <span className="px-4 py-1 rounded-full bg-sky-500/20 text-sky-200 text-sm border border-sky-500/30">
                  {expertise}
                </span>
              </div>
              {bio && (
                <p className="text-gray-300 mb-4">{bio}</p>
              )}
              {user.email && (
                <div className="flex items-center gap-2 text-gray-400">
                  <FaEnvelope className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
          </div>

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

          {/* Expertise & Specializations */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
            <h2 className="text-xl font-semibold text-white mb-4">Expertise</h2>
            <p className="text-gray-300 text-lg">{expertise}</p>
            {user.metadata?.specializations && user.metadata.specializations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {user.metadata.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 text-sm border border-sky-500/30">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherProfileDetail;

