import mongoose from "mongoose";
import JobPost from "../models/JobPost.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";

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

    // Try to fetch user data if candidateId is a valid ObjectId
    let userData = null;
    try {
      if (application.candidateId && mongoose.Types.ObjectId.isValid(application.candidateId)) {
        userData = await User.findById(application.candidateId).select("-passwordHash");
      }
    } catch (userError) {
      // Ignore user fetch errors - application data is still available
      // eslint-disable-next-line no-console
      console.warn("Could not fetch user data for candidate:", userError);
    }

    return res.json({
      application: {
        id: application.id,
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
        id: job.id,
        title: job.title,
        company: job.company,
      },
      user: userData
        ? {
            id: userData.id,
            email: userData.email,
            fullName: userData.fullName,
            role: userData.role,
            createdAt: userData.createdAt,
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

    const application = await JobApplication.create({
      job: jobId,
      candidateId: userId,
      candidateName: candidateName || userFullName || "Applicant",
      candidateHeadline,
      profileUrl,
      resumeUrl,
      portfolioUrl,
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

