import mongoose from "mongoose";
import JobPost from "../models/JobPost.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";

export const listPublishedJobs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const [jobs, total] = await Promise.all([
      JobPost.find({ status: "published" })
        .populate("owner", "fullName email")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      JobPost.countDocuments({ status: "published" }),
    ]);

    return res.json({
      data: jobs,
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const listMyJobs = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const [items, total] = await Promise.all([
      JobPost.find({ owner: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      JobPost.countDocuments({ owner: userId }),
    ]);

    return res.json({
      data: items,
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const status = req.body.status || "published";
    const job = await JobPost.create({
      ...req.body,
      owner: userId,
      status,
      publishedAt: status === "published" ? new Date() : undefined,
    });

    return res.status(201).json(job);
  } catch (error) {
    return next(error);
  }
};

export const getJob = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { jobId } = req.params;

    const job = await JobPost.findOne({ _id: jobId, owner: userId });
    if (!job) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Job not found" },
      });
    }

    return res.json(job);
  } catch (error) {
    return next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { jobId } = req.params;

    const job = await JobPost.findOneAndUpdate(
      { _id: jobId, owner: userId },
      {
        ...req.body,
        publishedAt:
          req.body.status === "published"
            ? req.body.publishedAt || new Date()
            : undefined,
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Job not found" },
      });
    }

    return res.json(job);
  } catch (error) {
    return next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { jobId } = req.params;

    const job = await JobPost.findOneAndDelete({ _id: jobId, owner: userId });
    if (!job) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Job not found" },
      });
    }

    await JobApplication.deleteMany({ job: jobId });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const listApplicants = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { jobId } = req.params;

    const job = await JobPost.findOne({ _id: jobId, owner: userId });
    if (!job) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Job not found" },
      });
    }

    const applicants = await JobApplication.find({ job: jobId }).sort({
      createdAt: -1,
    });

    return res.json({
      jobId: job.id,
      jobTitle: job.title,
      applicants,
    });
  } catch (error) {
    return next(error);
  }
};

export const getApplicantDetails = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { jobId, applicationId } = req.params;

    // Verify job ownership
    const job = await JobPost.findOne({ _id: jobId, owner: userId });
    if (!job) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Job not found" },
      });
    }

    // Get application
    const application = await JobApplication.findOne({
      _id: applicationId,
      job: jobId,
    });

    if (!application) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Application not found" },
      });
    }

    // Try to fetch user data and student profile if candidateId is a valid ObjectId
    let userData = null;
    let studentProfile = null;
    try {
      if (application.candidateId) {
        // candidateId is stored as String, so we need to convert it to ObjectId for queries
        const candidateObjectId = mongoose.Types.ObjectId.isValid(application.candidateId)
          ? new mongoose.Types.ObjectId(application.candidateId)
          : null;

        if (candidateObjectId) {
          userData = await User.findById(candidateObjectId).select("-passwordHash");
          // eslint-disable-next-line no-console
          console.log("Found user:", userData ? `${userData.fullName} (${userData.role})` : "Not found", "for candidateId:", application.candidateId);
          
          if (userData?.role === "student") {
            studentProfile = await StudentProfile.findOne({ user: candidateObjectId });
            // eslint-disable-next-line no-console
            console.log("Found student profile:", studentProfile ? "Yes" : "No", "for user:", candidateObjectId);
            
            // If no profile exists, create a basic one from application data
            if (!studentProfile && application) {
              // eslint-disable-next-line no-console
              console.log("Creating basic student profile from application data");
              try {
                studentProfile = await StudentProfile.create({
                  user: candidateObjectId,
                  headline: application.candidateHeadline || null,
                  resumeUrl: application.resumeUrl || null,
                  portfolioUrl: application.portfolioUrl || null,
                });
                // eslint-disable-next-line no-console
                console.log("Created basic student profile:", studentProfile._id);
              } catch (createError) {
                // eslint-disable-next-line no-console
                console.warn("Failed to create student profile:", createError.message);
                // Continue without profile - we'll still return application data
              }
            }
            
            if (studentProfile) {
              // eslint-disable-next-line no-console
              console.log("Student profile data:", {
                hasBio: !!studentProfile.bio,
                hasPhone: !!studentProfile.phone,
                hasLocation: !!studentProfile.location,
                skillsCount: studentProfile.skills?.length || 0,
                hasGoals: !!studentProfile.goals,
                hasHeadline: !!studentProfile.headline,
                hasResume: !!studentProfile.resumeUrl,
                hasPortfolio: !!studentProfile.portfolioUrl,
              });
            }
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn("Invalid candidateId format:", application.candidateId);
        }
      }
    } catch (userError) {
      // Log error for debugging
      // eslint-disable-next-line no-console
      console.error("Could not fetch user data for candidate:", userError);
    }

    return res.json({
      application: {
        id: application._id?.toString() || application.id,
        candidateId: application.candidateId,
        candidateName: application.candidateName,
        candidateHeadline: application.candidateHeadline,
        profileUrl: application.profileUrl,
        resumeUrl: application.resumeUrl,
        portfolioUrl: application.portfolioUrl,
        currentStage: application.currentStage,
        notes: application.notes,
        submittedAt: application.submittedAt,
        createdAt: application.createdAt,
      },
      job: {
        id: job._id?.toString() || job.id,
        title: job.title,
        company: job.company,
      },
      user: userData
        ? {
            id: userData._id?.toString() || userData.id,
            email: userData.email,
            fullName: userData.fullName,
            role: userData.role,
            createdAt: userData.createdAt,
          }
        : null,
      studentProfile: studentProfile
        ? {
            headline: studentProfile.headline,
            bio: studentProfile.bio,
            phone: studentProfile.phone,
            location: studentProfile.location,
            ageGroup: studentProfile.ageGroup,
            currentStatus: studentProfile.currentStatus,
            skills: studentProfile.skills,
            experience: studentProfile.experience,
            education: studentProfile.education,
            resumeUrl: studentProfile.resumeUrl,
            portfolioUrl: studentProfile.portfolioUrl,
            linkedinUrl: studentProfile.linkedinUrl,
            githubUrl: studentProfile.githubUrl,
            websiteUrl: studentProfile.websiteUrl,
            preferredProgram: studentProfile.preferredProgram,
            goals: studentProfile.goals,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const submitApplication = async (req, res, next) => {
  try {
    const { userId, userRole, userFullName } = req.auth || {};
    const { jobId } = req.params;
    const { candidateName, candidateHeadline, profileUrl, resumeUrl, portfolioUrl, notes } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required to apply" },
      });
    }

    const job = await JobPost.findOne({ _id: jobId, status: "published" });
    if (!job) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Job not found or not published" },
      });
    }

    const existingApplication = await JobApplication.findOne({
      job: jobId,
      candidateId: userId,
    });

    if (existingApplication) {
      return res.status(409).json({
        error: { code: "DUPLICATE_APPLICATION", message: "You have already applied to this job" },
      });
    }

    // Try to fetch student profile to get default values
    let studentProfile = null;
    try {
      if (userRole === "student") {
        studentProfile = await StudentProfile.findOne({ user: userId });
      }
    } catch (profileError) {
      // Ignore profile fetch errors
      // eslint-disable-next-line no-console
      console.warn("Could not fetch student profile:", profileError);
    }

    const application = await JobApplication.create({
      job: jobId,
      candidateId: userId,
      candidateName: candidateName || userFullName || "Applicant",
      candidateHeadline:
        candidateHeadline ||
        studentProfile?.headline ||
        (studentProfile?.currentStatus
          ? `${studentProfile.currentStatus.replace(/-/g, " ")} · ${studentProfile.location?.city || studentProfile.location?.country || ""}`
          : null),
      profileUrl: profileUrl || `/profiles/students/${userId}`,
      resumeUrl: resumeUrl || studentProfile?.resumeUrl,
      portfolioUrl: portfolioUrl || studentProfile?.portfolioUrl,
      notes,
      currentStage: "screening",
    });

    await JobPost.findByIdAndUpdate(jobId, {
      $inc: { "stats.applications": 1 },
    });

    return res.status(201).json(application);
  } catch (error) {
    if (error.name === "MongoServerError" && error.code === 11000) {
      return res.status(409).json({
        error: { code: "DUPLICATE_APPLICATION", message: "You have already applied to this job" },
      });
    }
    return next(error);
  }
};

export const updateApplicantStage = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { jobId, applicationId } = req.params;
    const { currentStage, notes } = req.body;

    const job = await JobPost.findOne({ _id: jobId, owner: userId });
    if (!job) {
      return res.status(404).json({
        error: { code: "RESOURCE_NOT_FOUND", message: "Job not found" },
      });
    }

    const application = await JobApplication.findOneAndUpdate(
      { _id: applicationId, job: jobId },
      { currentStage, notes },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Application not found",
        },
      });
    }

    return res.json(application);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user's job applications (for students/job seekers)
 * GET /api/v1/jobs/applications
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { page = 1, pageSize = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    // Build query
    const query = { candidateId: userId };
    if (status) {
      query.currentStage = status;
    }

    const [applications, total] = await Promise.all([
      JobApplication.find(query)
        .populate({
          path: "job",
          select: "title company location type status publishedAt",
        })
        .sort({ submittedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      JobApplication.countDocuments(query),
    ]);

    return res.json({
      applications,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get application statistics for user
 * GET /api/v1/jobs/applications/stats
 */
export const getApplicationStats = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    const [total, byStage] = await Promise.all([
      JobApplication.countDocuments({ candidateId: userId }),
      JobApplication.aggregate([
        { $match: { candidateId: userId } },
        {
          $group: {
            _id: "$currentStage",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statsByStage = byStage.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Get recent applications (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = await JobApplication.countDocuments({
      candidateId: userId,
      submittedAt: { $gte: thirtyDaysAgo },
    });

    return res.json({
      stats: {
        total,
        recent: recentCount,
        byStage: {
          screening: statsByStage.screening || 0,
          assessment: statsByStage.assessment || 0,
          interview: statsByStage.interview || 0,
          offer: statsByStage.offer || 0,
          hired: statsByStage.hired || 0,
          rejected: statsByStage.rejected || 0,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

