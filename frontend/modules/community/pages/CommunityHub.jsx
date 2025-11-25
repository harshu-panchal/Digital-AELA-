import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineUsers,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import SEO from "../../../src/components/SEO";
import { fetchCommunityData } from "../../../src/services/api/community";
import { useAuth } from "../../../src/contexts/AuthContext";

const CommunityHub = () => {
  const { user: authUser, tokens } = useAuth();
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [teacherSpotlight, setTeacherSpotlight] = useState([]);
  const [recruiterSpotlight, setRecruiterSpotlight] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [recruiterSearchQuery, setRecruiterSearchQuery] = useState("");

  useEffect(() => {
    const loadCommunityData = async () => {
      if (!authUser || !tokens?.accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch community data from dedicated community endpoint
        // This endpoint is accessible to all authenticated users
        const communityData = await fetchCommunityData();
        
        // Extract community data from response
        setStudentProfiles(communityData.studentProfiles || []);
        setTeacherSpotlight(communityData.teacherSpotlight || []);
        setRecruiterSpotlight(communityData.recruiterSpotlight || []);
      } catch (error) {
        console.error("Failed to load community data:", error);
        
        // Set empty arrays on error to prevent UI errors
        setStudentProfiles([]);
        setTeacherSpotlight([]);
        setRecruiterSpotlight([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunityData();
  }, [authUser, tokens]);

  // Filter students based on search query
  const filteredStudentProfiles = useMemo(() => {
    if (!studentSearchQuery.trim()) {
      return studentProfiles;
    }
    const query = studentSearchQuery.toLowerCase().trim();
    return studentProfiles.filter((student) => {
      const nameMatch = student.name?.toLowerCase().includes(query);
      const focusMatch = student.focus?.toLowerCase().includes(query);
      return nameMatch || focusMatch;
    });
  }, [studentProfiles, studentSearchQuery]);

  // Filter teachers based on search query
  const filteredTeacherSpotlight = useMemo(() => {
    if (!teacherSearchQuery.trim()) {
      return teacherSpotlight;
    }
    const query = teacherSearchQuery.toLowerCase().trim();
    return teacherSpotlight.filter((teacher) => {
      const nameMatch = teacher.name?.toLowerCase().includes(query);
      const expertiseMatch = teacher.expertise?.toLowerCase().includes(query);
      return nameMatch || expertiseMatch;
    });
  }, [teacherSpotlight, teacherSearchQuery]);

  // Filter recruiters based on search query
  const filteredRecruiterSpotlight = useMemo(() => {
    if (!recruiterSearchQuery.trim()) {
      return recruiterSpotlight;
    }
    const query = recruiterSearchQuery.toLowerCase().trim();
    return recruiterSpotlight.filter((recruiter) => {
      const nameMatch = recruiter.name?.toLowerCase().includes(query);
      const rolesMatch = recruiter.roles?.toLowerCase().includes(query);
      return nameMatch || rolesMatch;
    });
  }, [recruiterSpotlight, recruiterSearchQuery]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <p className="text-sm text-slate-300/80">Loading community...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <SEO
        title="Community Hub | Digital AELA"
        description="Discover fellow students, connect with mentors, and explore opportunities with recruiters in the Digital AELA community."
        keywords="community, students, teachers, mentors, recruiters, networking"
        url="https://digitalaela.com/community"
      />

      <div className="space-y-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Community</p>
            <h1 className="text-3xl font-semibold md:text-4xl">Community Hub</h1>
            <p className="mt-2 text-sm text-slate-300/80">
              Connect with fellow students, learn from mentors, and explore opportunities with recruiters.
            </p>
          </div>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Discover Fellow Students */}
          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="space-y-3 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineUsers className="h-5 w-5 text-sky-200" />
                <h2 className="text-lg font-semibold text-white">Discover fellow students</h2>
              </div>
            </header>
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
              />
            </div>
            {filteredStudentProfiles.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">No students found matching your search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudentProfiles.map((student) => (
                  <Link
                    key={student.id}
                    to={student.to}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/50">
                    <div>
                      <p className="font-semibold text-white">{student.name}</p>
                      <p className="text-xs text-slate-400/80">{student.focus}</p>
                      <p className="text-xs text-gray-500 mt-1">ID: {student.id || "N/A"}</p>
                    </div>
                    <HiOutlineUsers className="h-5 w-5 text-sky-200" />
                  </Link>
                ))}
              </div>
            )}
          </motion.section>

          {/* Mentors & Recruiters */}
          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="show"
            className="space-y-4 rounded-3xl border border-white/10 bg-[#060A17]/90 p-6">
            <header>
              <h2 className="text-lg font-semibold text-white">Mentors & recruiters</h2>
              <p className="text-xs text-slate-400">
                Connect with teachers for guidance and recruiters for roles.
              </p>
            </header>

            {/* Teachers Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineAcademicCap className="h-4 w-4 text-sky-200" />
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Teachers</p>
                </div>
              </div>
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                />
              </div>
              {filteredTeacherSpotlight.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400">No teachers found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTeacherSpotlight.map((teacher) => (
                    <Link
                      key={teacher.id}
                      to={teacher.to}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/50">
                      <div>
                        <p className="font-semibold text-white">{teacher.name}</p>
                        <p className="text-xs text-slate-400/80">{teacher.expertise}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {teacher.id || "N/A"}</p>
                      </div>
                      <HiOutlineAcademicCap className="h-5 w-5 text-sky-200" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recruiters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineBriefcase className="h-4 w-4 text-sky-200" />
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recruiters</p>
                </div>
              </div>
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search recruiters..."
                  value={recruiterSearchQuery}
                  onChange={(e) => setRecruiterSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30"
                />
              </div>
              {filteredRecruiterSpotlight.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400">No recruiters found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecruiterSpotlight.map((recruiter) => (
                    <Link
                      key={recruiter.id}
                      to={recruiter.to}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/50">
                      <div>
                        <p className="font-semibold text-white">{recruiter.name}</p>
                        <p className="text-xs text-slate-400/80">{recruiter.roles}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {recruiter.id || "N/A"}</p>
                      </div>
                      <HiOutlineBriefcase className="h-5 w-5 text-sky-200" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;

