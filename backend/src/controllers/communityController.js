import User from "../models/User.js";

/**
 * Get community data (students, teachers, recruiters)
 * Accessible to all authenticated users
 */
export const getCommunityData = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Get Student Profiles (top 3 students)
    let studentProfiles = [];
    try {
      const students = await User.find({ role: "student", isActive: true })
        .select("fullName")
        .limit(3)
        .lean();
      
      studentProfiles = students.map((student, index) => {
        const focuses = ["IELTS Scholar", "Debate Captain", "Blog Creator", "Speaking Champion", "Grammar Master"];
        return {
          id: student._id.toString(),
          name: student.fullName,
          focus: focuses[index % focuses.length],
          to: `/community/students/${student._id}`,
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching students:", error);
      studentProfiles = [];
    }

    // Get Teachers (top 2 teachers)
    let teacherSpotlight = [];
    try {
      const teachers = await User.find({ role: "teacher", isActive: true })
        .select("fullName metadata")
        .limit(2)
        .lean();
      
      teacherSpotlight = teachers.map((teacher) => ({
        id: teacher._id.toString(),
        name: teacher.fullName,
        expertise: teacher.metadata?.expertise || "English Language",
        to: `/community/teachers/${teacher._id}`,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching teachers:", error);
      teacherSpotlight = [];
    }

    // Get Recruiters (top 2 recruiters)
    let recruiterSpotlight = [];
    try {
      const recruiters = await User.find({ role: "recruiter", isActive: true })
        .select("fullName metadata")
        .limit(2)
        .lean();
      
      recruiterSpotlight = recruiters.map((recruiter) => ({
        id: recruiter._id.toString(),
        name: recruiter.fullName,
        roles: recruiter.metadata?.company || "Talent Partner",
        to: `/community/recruiters/${recruiter._id}`,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching recruiters:", error);
      recruiterSpotlight = [];
    }

    return res.json({
      studentProfiles,
      teacherSpotlight,
      recruiterSpotlight,
    });
  } catch (error) {
    return next(error);
  }
};

