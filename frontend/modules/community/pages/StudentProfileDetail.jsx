import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaArrowLeft, FaSpinner, FaUser, FaMapMarkerAlt, FaGraduationCap, FaBriefcase, FaEnvelope, FaPhone, FaLink, FaGlobe, FaLinkedin, FaGithub, FaInstagram, FaYoutube, FaTwitter, FaFacebook, FaTiktok } from "react-icons/fa";
import SEO from "../../../src/components/SEO";
import { fetchStudentProfile } from "../../../src/services/api/student";

const StudentProfileDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await fetchStudentProfile(userId);
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load student profile");
        navigate("/student/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId, navigate]);

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
      <div className="min-h-screen bg-[#05060D] flex items-center justify-center">
        <FaSpinner className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#05060D] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-4">This student profile does not exist.</p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="bg-[#D4AF37] text-black py-2 px-6 rounded-lg font-bold hover:bg-[#E5C158] transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const user = profile.user || {};
  const location = profile.location || {};
  const experience = profile.experience || {};
  const education = profile.education || [];

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`${user.fullName || "Student"} | Digital AELA`}
        description={profile.bio || `View ${user.fullName || "student"}'s profile on Digital AELA`}
        keywords={`student profile, ${user.fullName}, Digital AELA`}
        url={`https://digitalaela.com/community/students/${userId}`}
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
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={user.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#D4AF37]/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border-4 border-[#D4AF37]/30">
                  <FaUser className="w-16 h-16 text-[#D4AF37]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{user.fullName || "Student"}</h1>
              {profile.headline && (
                <p className="text-lg text-[#F5D26A] mb-3">{profile.headline}</p>
              )}
              {profile.bio && (
                <p className="text-gray-300 mb-4">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {location.city && location.country && (
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span>{location.city}, {location.country}</span>
                  </div>
                )}
                {profile.currentStatus && (
                  <div className="flex items-center gap-2">
                    <FaGraduationCap className="w-4 h-4" />
                    <span className="capitalize">{profile.currentStatus.replace("-", " ")}</span>
                  </div>
                )}
                {profile.profession && (
                  <div className="flex items-center gap-2">
                    <FaBriefcase className="w-4 h-4" />
                    <span>{profile.profession}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact & Links */}
          {(profile.phone || profile.linkedinUrl || profile.githubUrl || profile.websiteUrl || profile.socialLinks?.length > 0) && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Contact & Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.phone && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <FaPhone className="w-5 h-5 text-[#D4AF37]" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                    <FaLinkedin className="w-5 h-5 text-[#D4AF37]" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                    <FaGithub className="w-5 h-5 text-[#D4AF37]" />
                    <span>GitHub</span>
                  </a>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                    <FaGlobe className="w-5 h-5 text-[#D4AF37]" />
                    <span>Website</span>
                  </a>
                )}
                {profile.socialLinks?.map((link, index) => {
                  const Icon = getSocialIcon(link.platform);
                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition-colors">
                      <Icon className="w-5 h-5 text-[#D4AF37]" />
                      <span>{link.platform} {link.verified && <span className="text-green-400">✓</span>}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skills & Interests */}
          {(profile.skills?.length > 0 || profile.interests?.length > 0) && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Experience</h2>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="font-semibold text-[#D4AF37]">{experience.years} years</span>
                  {experience.description && ` · ${experience.description}`}
                </p>
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Education</h2>
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-[#D4AF37]/30 pl-4">
                    <h3 className="font-semibold text-white">{edu.degree}</h3>
                    <p className="text-gray-300">{edu.institution}</p>
                    {edu.year && <p className="text-sm text-gray-400">{edu.year}</p>}
                    {edu.description && <p className="text-sm text-gray-400 mt-1">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {profile.goals && (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-[#0b0b0b]/80">
              <h2 className="text-xl font-semibold text-white mb-4">Goals</h2>
              <p className="text-gray-300">{profile.goals}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.englishLevel && (
              <div className="p-4 rounded-xl border border-white/10 bg-[#0b0b0b]/80">
                <p className="text-sm text-gray-400 mb-1">English Level</p>
                <p className="text-lg font-semibold text-white">{profile.englishLevel}</p>
              </div>
            )}
            {profile.preferredProgram && (
              <div className="p-4 rounded-xl border border-white/10 bg-[#0b0b0b]/80">
                <p className="text-sm text-gray-400 mb-1">Preferred Program</p>
                <p className="text-lg font-semibold text-white">{profile.preferredProgram}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentProfileDetail;

