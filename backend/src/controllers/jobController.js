import JobPost from "../models/JobPost.js";
import JobApplication from "../models/JobApplication.js";

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
    const job = await JobPost.create({
      ...req.body,
      owner: userId,
      publishedAt: req.body.status === "published" ? new Date() : undefined,
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

