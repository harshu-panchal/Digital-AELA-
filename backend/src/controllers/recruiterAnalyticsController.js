import mongoose from "mongoose";
import JobPost from "../models/JobPost.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Notification from "../models/Notification.js";

/**
 * Get recruiter analytics dashboard
 * GET /api/v1/recruiter/analytics/dashboard
 */
export const getRecruiterAnalyticsDashboard = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { period = "30" } = req.query; // days

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const days = parseInt(period);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get all jobs owned by recruiter
    const allJobs = await JobPost.find({ owner: userObjectId }).lean();
    const jobIds = allJobs.map((j) => j._id);

    // Get all applications for recruiter's jobs
    const allApplications = await JobApplication.find({
      job: { $in: jobIds },
    }).lean();

    // Get applications in period
    const periodApplications = allApplications.filter(
      (app) => new Date(app.submittedAt || app.createdAt) >= startDate
    );

    // Calculate metrics
    const totalJobs = allJobs.length;
    const activeJobs = allJobs.filter(
      (j) => j.status === "published" && (!j.expirationDate || new Date(j.expirationDate) > now)
    ).length;
    const totalApplications = allApplications.length;
    const periodApplicationsCount = periodApplications.length;
    const totalViews = allJobs.reduce((sum, j) => sum + (j.stats?.views || 0), 0);
    const totalSaves = allJobs.reduce((sum, j) => sum + (j.stats?.saves || 0), 0);

    // Application status breakdown
    const statusBreakdown = {
      screening: allApplications.filter((a) => a.currentStage === "screening").length,
      assessment: allApplications.filter((a) => a.currentStage === "assessment").length,
      interview: allApplications.filter((a) => a.currentStage === "interview").length,
      offer: allApplications.filter((a) => a.currentStage === "offer").length,
      hired: allApplications.filter((a) => a.currentStage === "hired").length,
      rejected: allApplications.filter((a) => a.currentStage === "rejected").length,
    };

    // Calculate conversion rates
    const conversionRate = totalApplications > 0
      ? ((statusBreakdown.hired / totalApplications) * 100).toFixed(2)
      : 0;
    const interviewToOfferRate = statusBreakdown.interview > 0
      ? ((statusBreakdown.offer / statusBreakdown.interview) * 100).toFixed(2)
      : 0;
    const offerToHireRate = statusBreakdown.offer > 0
      ? ((statusBreakdown.hired / statusBreakdown.offer) * 100).toFixed(2)
      : 0;

    // Time to hire (average days from application to hired)
    const hiredApplications = allApplications.filter((a) => a.currentStage === "hired");
    let avgTimeToHire = 0;
    if (hiredApplications.length > 0) {
      const totalDays = hiredApplications.reduce((sum, app) => {
        const submitted = new Date(app.submittedAt || app.createdAt);
        const hired = new Date(app.updatedAt);
        return sum + Math.max(0, Math.floor((hired - submitted) / (1000 * 60 * 60 * 24)));
      }, 0);
      avgTimeToHire = Math.round(totalDays / hiredApplications.length);
    }

    // Application trend (last 7 days)
    const applicationTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayApplications = allApplications.filter(
        (a) => {
          const appDate = new Date(a.submittedAt || a.createdAt);
          return appDate >= dayStart && appDate <= dayEnd;
        }
      ).length;

      applicationTrend.push({
        date: dayStart.toISOString().split("T")[0],
        applications: dayApplications,
      });
    }

    // Top performing jobs
    const jobStats = allJobs.map((job) => {
      const jobApplications = allApplications.filter(
        (a) => a.job.toString() === job._id.toString()
      );
      return {
        jobId: job._id.toString(),
        title: job.title,
        company: job.company,
        applications: jobApplications.length,
        views: job.stats?.views || 0,
        saves: job.stats?.saves || 0,
        hired: jobApplications.filter((a) => a.currentStage === "hired").length,
        conversionRate: jobApplications.length > 0
          ? ((jobApplications.filter((a) => a.currentStage === "hired").length / jobApplications.length) * 100).toFixed(2)
          : 0,
      };
    });

    const topPerformingJobs = jobStats
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);

    return res.json({
      period: {
        days,
        startDate,
        endDate: now,
      },
      overview: {
        totalJobs,
        activeJobs,
        totalApplications,
        periodApplications: periodApplicationsCount,
        totalViews,
        totalSaves,
        conversionRate: parseFloat(conversionRate),
        interviewToOfferRate: parseFloat(interviewToOfferRate),
        offerToHireRate: parseFloat(offerToHireRate),
        avgTimeToHire,
      },
      statusBreakdown,
      applicationTrend,
      topPerformingJobs,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get application analytics per job
 * GET /api/v1/recruiter/analytics/jobs/:jobId
 */
export const getJobApplicationAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { jobId } = req.params;
    const { period = "30" } = req.query;

    if (!userId || !jobId) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User ID and job ID are required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    const jobObjectId = mongoose.isValidObjectId(jobId)
      ? new mongoose.Types.ObjectId(jobId)
      : null;

    if (!userObjectId || !jobObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID or job ID",
        },
      });
    }

    // Verify job ownership
    const job = await JobPost.findOne({ _id: jobObjectId, owner: userObjectId }).lean();
    if (!job) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Job not found",
        },
      });
    }

    const days = parseInt(period);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get all applications for this job
    const allApplications = await JobApplication.find({ job: jobObjectId }).lean();

    // Get applications in period
    const periodApplications = allApplications.filter(
      (app) => new Date(app.submittedAt || app.createdAt) >= startDate
    );

    // Status breakdown
    const statusBreakdown = {
      screening: allApplications.filter((a) => a.currentStage === "screening").length,
      assessment: allApplications.filter((a) => a.currentStage === "assessment").length,
      interview: allApplications.filter((a) => a.currentStage === "interview").length,
      offer: allApplications.filter((a) => a.currentStage === "offer").length,
      hired: allApplications.filter((a) => a.currentStage === "hired").length,
      rejected: allApplications.filter((a) => a.currentStage === "rejected").length,
    };

    // Application trend
    const applicationTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayApplications = allApplications.filter(
        (a) => {
          const appDate = new Date(a.submittedAt || a.createdAt);
          return appDate >= dayStart && appDate <= dayEnd;
        }
      );

      applicationTrend.push({
        date: dayStart.toISOString().split("T")[0],
        applications: dayApplications.length,
        byStage: {
          screening: dayApplications.filter((a) => a.currentStage === "screening").length,
          assessment: dayApplications.filter((a) => a.currentStage === "assessment").length,
          interview: dayApplications.filter((a) => a.currentStage === "interview").length,
          offer: dayApplications.filter((a) => a.currentStage === "offer").length,
          hired: dayApplications.filter((a) => a.currentStage === "hired").length,
          rejected: dayApplications.filter((a) => a.currentStage === "rejected").length,
        },
      });
    }

    // Source analysis (if available in metadata)
    const sourceBreakdown = {};
    allApplications.forEach((app) => {
      const source = app.metadata?.source || "direct";
      if (!sourceBreakdown[source]) {
        sourceBreakdown[source] = 0;
      }
      sourceBreakdown[source]++;
    });

    // Calculate metrics
    const totalApplications = allApplications.length;
    const periodApplicationsCount = periodApplications.length;
    const conversionRate = totalApplications > 0
      ? ((statusBreakdown.hired / totalApplications) * 100).toFixed(2)
      : 0;

    // Average time in each stage
    const stageTimes = {};
    ["screening", "assessment", "interview", "offer"].forEach((stage) => {
      const stageApps = allApplications.filter((a) => a.currentStage === stage);
      if (stageApps.length > 0) {
        const avgDays = stageApps.reduce((sum, app) => {
          const submitted = new Date(app.submittedAt || app.createdAt);
          const updated = new Date(app.updatedAt);
          return sum + Math.max(0, Math.floor((updated - submitted) / (1000 * 60 * 60 * 24)));
        }, 0) / stageApps.length;
        stageTimes[stage] = Math.round(avgDays);
      } else {
        stageTimes[stage] = 0;
      }
    });

    return res.json({
      job: {
        id: job._id.toString(),
        title: job.title,
        company: job.company,
        status: job.status,
        views: job.stats?.views || 0,
        saves: job.stats?.saves || 0,
      },
      period: {
        days,
        startDate,
        endDate: now,
      },
      metrics: {
        totalApplications,
        periodApplications: periodApplicationsCount,
        conversionRate: parseFloat(conversionRate),
        avgTimeInStages: stageTimes,
      },
      statusBreakdown,
      applicationTrend,
      sourceBreakdown,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get candidate pipeline metrics
 * GET /api/v1/recruiter/analytics/pipeline
 */
export const getCandidatePipelineMetrics = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { jobId } = req.query; // Optional: filter by job

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Build query
    let jobQuery = { owner: userObjectId };
    if (jobId && mongoose.isValidObjectId(jobId)) {
      jobQuery._id = new mongoose.Types.ObjectId(jobId);
    }

    const jobs = await JobPost.find(jobQuery).select("_id").lean();
    const jobIds = jobs.map((j) => j._id);

    const allApplications = await JobApplication.find({
      job: { $in: jobIds },
    }).lean();

    // Pipeline stages
    const pipeline = {
      screening: {
        count: allApplications.filter((a) => a.currentStage === "screening").length,
        applications: [],
      },
      assessment: {
        count: allApplications.filter((a) => a.currentStage === "assessment").length,
        applications: [],
      },
      interview: {
        count: allApplications.filter((a) => a.currentStage === "interview").length,
        applications: [],
      },
      offer: {
        count: allApplications.filter((a) => a.currentStage === "offer").length,
        applications: [],
      },
      hired: {
        count: allApplications.filter((a) => a.currentStage === "hired").length,
        applications: [],
      },
      rejected: {
        count: allApplications.filter((a) => a.currentStage === "rejected").length,
        applications: [],
      },
    };

    // Get application details for each stage
    for (const stage of Object.keys(pipeline)) {
      const stageApplications = allApplications.filter((a) => a.currentStage === stage);
      pipeline[stage].applications = await Promise.all(
        stageApplications.slice(0, 10).map(async (app) => {
          const job = await JobPost.findById(app.job).select("title company").lean();
          return {
            applicationId: app._id.toString(),
            candidateId: app.candidateId,
            candidateName: app.candidateName,
            candidateHeadline: app.candidateHeadline,
            jobTitle: job?.title || "Unknown",
            jobCompany: job?.company || "Unknown",
            submittedAt: app.submittedAt || app.createdAt,
            updatedAt: app.updatedAt,
            notes: app.notes,
          };
        })
      );
    }

    // Calculate flow metrics
    const totalInPipeline = allApplications.filter(
      (a) => !["hired", "rejected"].includes(a.currentStage)
    ).length;

    const stageFlow = {
      screeningToAssessment: pipeline.screening.count > 0
        ? ((pipeline.assessment.count / pipeline.screening.count) * 100).toFixed(2)
        : 0,
      assessmentToInterview: pipeline.assessment.count > 0
        ? ((pipeline.interview.count / pipeline.assessment.count) * 100).toFixed(2)
        : 0,
      interviewToOffer: pipeline.interview.count > 0
        ? ((pipeline.offer.count / pipeline.interview.count) * 100).toFixed(2)
        : 0,
      offerToHired: pipeline.offer.count > 0
        ? ((pipeline.hired.count / pipeline.offer.count) * 100).toFixed(2)
        : 0,
    };

    // Bottlenecks (stages with longest average time)
    const bottlenecks = [];
    for (const stage of ["screening", "assessment", "interview", "offer"]) {
      const stageApps = allApplications.filter((a) => a.currentStage === stage);
      if (stageApps.length > 0) {
        const avgDays = stageApps.reduce((sum, app) => {
          const submitted = new Date(app.submittedAt || app.createdAt);
          const updated = new Date(app.updatedAt);
          return sum + Math.max(0, Math.floor((updated - submitted) / (1000 * 60 * 60 * 24)));
        }, 0) / stageApps.length;
        bottlenecks.push({
          stage,
          avgDays: Math.round(avgDays),
          count: stageApps.length,
        });
      }
    }
    bottlenecks.sort((a, b) => b.avgDays - a.avgDays);

    return res.json({
      pipeline,
      metrics: {
        totalInPipeline,
        totalApplications: allApplications.length,
        stageFlow: Object.fromEntries(
          Object.entries(stageFlow).map(([k, v]) => [k, parseFloat(v)])
        ),
        bottlenecks: bottlenecks.slice(0, 3),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get hiring statistics
 * GET /api/v1/recruiter/analytics/hiring-stats
 */
export const getHiringStatistics = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { period = "90" } = req.query; // days

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const days = parseInt(period);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const jobs = await JobPost.find({ owner: userObjectId }).select("_id").lean();
    const jobIds = jobs.map((j) => j._id);

    const allApplications = await JobApplication.find({
      job: { $in: jobIds },
    }).lean();

    const periodApplications = allApplications.filter(
      (app) => new Date(app.submittedAt || app.createdAt) >= startDate
    );

    // Hiring metrics
    const hiredApplications = allApplications.filter((a) => a.currentStage === "hired");
    const periodHired = periodApplications.filter((a) => a.currentStage === "hired");

    // Time to hire
    const timeToHireData = hiredApplications.map((app) => {
      const submitted = new Date(app.submittedAt || app.createdAt);
      const hired = new Date(app.updatedAt);
      return Math.max(0, Math.floor((hired - submitted) / (1000 * 60 * 60 * 24)));
    });

    const avgTimeToHire = timeToHireData.length > 0
      ? Math.round(timeToHireData.reduce((a, b) => a + b, 0) / timeToHireData.length)
      : 0;
    const medianTimeToHire = timeToHireData.length > 0
      ? timeToHireData.sort((a, b) => a - b)[Math.floor(timeToHireData.length / 2)]
      : 0;

    // Hiring by month
    const hiringByMonth = {};
    hiredApplications.forEach((app) => {
      const hiredDate = new Date(app.updatedAt);
      const monthKey = `${hiredDate.getFullYear()}-${String(hiredDate.getMonth() + 1).padStart(2, "0")}`;
      if (!hiringByMonth[monthKey]) {
        hiringByMonth[monthKey] = 0;
      }
      hiringByMonth[monthKey]++;
    });

    // Hiring by job
    const hiringByJob = {};
    for (const app of hiredApplications) {
      const job = await JobPost.findById(app.job).select("title company").lean();
      const jobKey = job?.title || "Unknown";
      if (!hiringByJob[jobKey]) {
        hiringByJob[jobKey] = { count: 0, jobTitle: job?.title, jobCompany: job?.company };
      }
      hiringByJob[jobKey].count++;
    }

    // Quality metrics
    const qualityMetrics = {
      totalHired: hiredApplications.length,
      periodHired: periodHired.length,
      avgTimeToHire,
      medianTimeToHire,
      fastestHire: timeToHireData.length > 0 ? Math.min(...timeToHireData) : 0,
      slowestHire: timeToHireData.length > 0 ? Math.max(...timeToHireData) : 0,
    };

    return res.json({
      period: {
        days,
        startDate,
        endDate: now,
      },
      qualityMetrics,
      hiringByMonth,
      hiringByJob: Object.values(hiringByJob).sort((a, b) => b.count - a.count).slice(0, 10),
      timeToHireDistribution: {
        "0-7 days": timeToHireData.filter((d) => d <= 7).length,
        "8-14 days": timeToHireData.filter((d) => d > 7 && d <= 14).length,
        "15-30 days": timeToHireData.filter((d) => d > 14 && d <= 30).length,
        "31+ days": timeToHireData.filter((d) => d > 30).length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get performance reports
 * GET /api/v1/recruiter/analytics/performance-report
 */
export const getPerformanceReport = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { startDate, endDate, format = "json" } = req.query; // format: json, csv

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const jobs = await JobPost.find({ owner: userObjectId }).lean();
    const jobIds = jobs.map((j) => j._id);

    const allApplications = await JobApplication.find({
      job: { $in: jobIds },
      $or: [
        { submittedAt: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } },
      ],
    }).lean();

    // Comprehensive report data
    const report = {
      period: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(
          (j) => j.status === "published" && (!j.expirationDate || new Date(j.expirationDate) > new Date())
        ).length,
        totalApplications: allApplications.length,
        totalViews: jobs.reduce((sum, j) => sum + (j.stats?.views || 0), 0),
        totalSaves: jobs.reduce((sum, j) => sum + (j.stats?.saves || 0), 0),
      },
      applications: {
        byStatus: {
          screening: allApplications.filter((a) => a.currentStage === "screening").length,
          assessment: allApplications.filter((a) => a.currentStage === "assessment").length,
          interview: allApplications.filter((a) => a.currentStage === "interview").length,
          offer: allApplications.filter((a) => a.currentStage === "offer").length,
          hired: allApplications.filter((a) => a.currentStage === "hired").length,
          rejected: allApplications.filter((a) => a.currentStage === "rejected").length,
        },
        byJob: await Promise.all(
          jobs.map(async (job) => {
            const jobApps = allApplications.filter(
              (a) => a.job.toString() === job._id.toString()
            );
            return {
              jobId: job._id.toString(),
              jobTitle: job.title,
              company: job.company,
              applications: jobApps.length,
              hired: jobApps.filter((a) => a.currentStage === "hired").length,
              conversionRate: jobApps.length > 0
                ? ((jobApps.filter((a) => a.currentStage === "hired").length / jobApps.length) * 100).toFixed(2)
                : 0,
            };
          })
        ),
      },
      performance: {
        conversionRate: allApplications.length > 0
          ? ((allApplications.filter((a) => a.currentStage === "hired").length / allApplications.length) * 100).toFixed(2)
          : 0,
        avgTimeToHire: (() => {
          const hired = allApplications.filter((a) => a.currentStage === "hired");
          if (hired.length === 0) return 0;
          const totalDays = hired.reduce((sum, app) => {
            const submitted = new Date(app.submittedAt || app.createdAt);
            const hiredDate = new Date(app.updatedAt);
            return sum + Math.max(0, Math.floor((hiredDate - submitted) / (1000 * 60 * 60 * 24)));
          }, 0);
          return Math.round(totalDays / hired.length);
        })(),
      },
    };

    if (format === "csv") {
      // Convert to CSV format
      const csvRows = [];
      csvRows.push("Period,Start Date,End Date");
      csvRows.push(`Period,${start.toISOString()},${end.toISOString()}`);
      csvRows.push("");
      csvRows.push("Summary,Value");
      csvRows.push(`Total Jobs,${report.summary.totalJobs}`);
      csvRows.push(`Active Jobs,${report.summary.activeJobs}`);
      csvRows.push(`Total Applications,${report.summary.totalApplications}`);
      csvRows.push(`Total Views,${report.summary.totalViews}`);
      csvRows.push(`Total Saves,${report.summary.totalSaves}`);
      csvRows.push("");
      csvRows.push("Applications by Status,Count");
      Object.entries(report.applications.byStatus).forEach(([status, count]) => {
        csvRows.push(`${status},${count}`);
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=recruiter-performance-${Date.now()}.csv`);
      return res.send(csvRows.join("\n"));
    }

    return res.json(report);
  } catch (error) {
    return next(error);
  }
};

/**
 * Bulk applicant actions
 * POST /api/v1/recruiter/applicants/bulk-action
 */
export const bulkApplicantActions = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { applicationIds, action, data } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Application IDs array is required",
        },
      });
    }

    if (!action) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Action is required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Validate application IDs and verify ownership
    const validIds = applicationIds
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "No valid application IDs provided",
        },
      });
    }

    // Get applications and verify ownership through jobs
    const applications = await JobApplication.find({ _id: { $in: validIds } }).lean();
    const jobIds = [...new Set(applications.map((a) => a.job.toString()))];
    const jobs = await JobPost.find({
      _id: { $in: jobIds.map((id) => new mongoose.Types.ObjectId(id)) },
      owner: userObjectId,
    }).select("_id").lean();

    const ownedJobIds = new Set(jobs.map((j) => j._id.toString()));
    const validApplications = applications.filter((a) => ownedJobIds.has(a.job.toString()));

    if (validApplications.length === 0) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "No applications found or you don't have permission",
        },
      });
    }

    const validApplicationIds = validApplications.map((a) => a._id);

    let result;
    switch (action) {
      case "updateStage":
        if (!data || !data.stage) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Stage is required for updateStage action",
            },
          });
        }
        result = await JobApplication.updateMany(
          { _id: { $in: validApplicationIds } },
          { $set: { currentStage: data.stage, updatedAt: new Date() } }
        );
        break;

      case "addNote":
        if (!data || !data.note) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Note is required for addNote action",
            },
          });
        }
        result = await JobApplication.updateMany(
          { _id: { $in: validApplicationIds } },
          { $set: { notes: data.note, updatedAt: new Date() } }
        );
        break;

      case "reject":
        result = await JobApplication.updateMany(
          { _id: { $in: validApplicationIds } },
          { $set: { currentStage: "rejected", updatedAt: new Date() } }
        );
        break;

      case "moveToScreening":
        result = await JobApplication.updateMany(
          { _id: { $in: validApplicationIds } },
          { $set: { currentStage: "screening", updatedAt: new Date() } }
        );
        break;

      case "delete":
        result = await JobApplication.deleteMany({ _id: { $in: validApplicationIds } });
        break;

      default:
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid action: ${action}`,
          },
        });
    }

    // Create notifications for candidates if action affects them
    if (["updateStage", "reject", "moveToScreening"].includes(action)) {
      for (const app of validApplications) {
        try {
          const candidate = await User.findOne({ _id: app.candidateId }).lean();
          if (candidate) {
            await Notification.create({
              user: app.candidateId,
              title: "Application Status Updated",
              description: `Your application status has been updated to ${data?.stage || action}`,
              type: "event",
              actionUrl: `/student/applications`,
              metadata: {
                jobId: app.job.toString(),
                applicationId: app._id.toString(),
                stage: data?.stage || action,
              },
            });
          }
        } catch (error) {
          // Continue even if notification fails
          // eslint-disable-next-line no-console
          console.error("Error creating notification:", error);
        }
      }
    }

    return res.json({
      success: true,
      message: `Successfully performed ${action} on ${result.modifiedCount || result.deletedCount} application(s)`,
      count: result.modifiedCount || result.deletedCount,
      action,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Advanced candidate filtering
 * GET /api/v1/recruiter/applicants/search
 */
export const advancedCandidateFilter = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const {
      jobId,
      stage,
      minDate,
      maxDate,
      searchQuery,
      hasResume,
      hasPortfolio,
      sortBy = "submittedAt",
      sortOrder = "desc",
      page = 1,
      pageSize = 20,
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Build query
    let jobQuery = { owner: userObjectId };
    if (jobId && mongoose.isValidObjectId(jobId)) {
      jobQuery._id = new mongoose.Types.ObjectId(jobId);
    }

    const jobs = await JobPost.find(jobQuery).select("_id").lean();
    const jobIds = jobs.map((j) => j._id);

    if (jobIds.length === 0) {
      return res.json({
        applicants: [],
        pagination: {
          page: 1,
          pageSize: parseInt(pageSize),
          total: 0,
          totalPages: 0,
        },
      });
    }

    let applicationQuery = { job: { $in: jobIds } };

    // Filter by stage
    if (stage) {
      applicationQuery.currentStage = stage;
    }

    // Filter by date range
    if (minDate || maxDate) {
      applicationQuery.$or = [
        { submittedAt: {} },
        { createdAt: {} },
      ];
      if (minDate) {
        applicationQuery.$or[0].submittedAt.$gte = new Date(minDate);
        applicationQuery.$or[1].createdAt.$gte = new Date(minDate);
      }
      if (maxDate) {
        applicationQuery.$or[0].submittedAt.$lte = new Date(maxDate);
        applicationQuery.$or[1].createdAt.$lte = new Date(maxDate);
      }
    }

    // Filter by search query (name, headline)
    if (searchQuery && searchQuery.trim()) {
      applicationQuery.$or = applicationQuery.$or || [];
      applicationQuery.$or.push(
        { candidateName: { $regex: searchQuery.trim(), $options: "i" } },
        { candidateHeadline: { $regex: searchQuery.trim(), $options: "i" } }
      );
    }

    // Filter by resume/portfolio
    if (hasResume === "true") {
      applicationQuery.resumeUrl = { $exists: true, $ne: null, $ne: "" };
    }
    if (hasPortfolio === "true") {
      applicationQuery.portfolioUrl = { $exists: true, $ne: null, $ne: "" };
    }

    // Sort
    const sort = {};
    if (sortBy === "submittedAt") {
      sort.submittedAt = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "updatedAt") {
      sort.updatedAt = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "candidateName") {
      sort.candidateName = sortOrder === "asc" ? 1 : -1;
    } else {
      sort.createdAt = sortOrder === "asc" ? 1 : -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const [applications, total] = await Promise.all([
      JobApplication.find(applicationQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      JobApplication.countDocuments(applicationQuery),
    ]);

    // Enrich with job data
    const applicants = await Promise.all(
      applications.map(async (app) => {
        const job = await JobPost.findById(app.job).select("title company").lean();
        return {
          applicationId: app._id.toString(),
          candidateId: app.candidateId,
          candidateName: app.candidateName,
          candidateHeadline: app.candidateHeadline,
          profileUrl: app.profileUrl,
          resumeUrl: app.resumeUrl,
          portfolioUrl: app.portfolioUrl,
          currentStage: app.currentStage,
          notes: app.notes,
          submittedAt: app.submittedAt || app.createdAt,
          updatedAt: app.updatedAt,
          job: {
            id: app.job.toString(),
            title: job?.title || "Unknown",
            company: job?.company || "Unknown",
          },
        };
      })
    );

    return res.json({
      applicants,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
      filters: {
        jobId: jobId || null,
        stage: stage || null,
        minDate: minDate || null,
        maxDate: maxDate || null,
        searchQuery: searchQuery || null,
        hasResume: hasResume === "true",
        hasPortfolio: hasPortfolio === "true",
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Interview scheduling integration
 * POST /api/v1/recruiter/applicants/:applicationId/schedule-interview
 */
export const scheduleInterview = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { applicationId } = req.params;
    const { scheduledDate, scheduledTime, duration, interviewType, location, notes, interviewer } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!applicationId) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Application ID is required",
        },
      });
    }

    if (!scheduledDate || !scheduledTime) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Scheduled date and time are required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    const applicationObjectId = mongoose.isValidObjectId(applicationId)
      ? new mongoose.Types.ObjectId(applicationId)
      : null;

    if (!userObjectId || !applicationObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID or application ID",
        },
      });
    }

    // Verify application ownership
    const application = await JobApplication.findById(applicationObjectId).lean();
    if (!application) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Application not found",
        },
      });
    }

    const job = await JobPost.findOne({ _id: application.job, owner: userObjectId }).lean();
    if (!job) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You don't have permission to schedule interviews for this application",
        },
      });
    }

    // Combine date and time
    const interviewDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    // Update application with interview details
    const updatedApplication = await JobApplication.findByIdAndUpdate(
      applicationObjectId,
      {
        $set: {
          currentStage: "interview",
          "metadata.interview": {
            scheduledDate: interviewDateTime,
            duration: duration || 60, // minutes
            interviewType: interviewType || "video", // video, phone, in-person
            location: location || null,
            notes: notes || null,
            interviewer: interviewer || null,
            status: "scheduled",
            createdAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    // Create notification for candidate
    try {
      await Notification.create({
        user: application.candidateId,
        title: "Interview Scheduled",
        description: `An interview has been scheduled for ${interviewDateTime.toLocaleString()}`,
        type: "event",
        actionUrl: `/student/applications`,
        metadata: {
          jobId: application.job.toString(),
          applicationId: application._id.toString(),
          interviewDate: interviewDateTime,
          interviewType: interviewType || "video",
        },
      });
    } catch (error) {
      // Continue even if notification fails
      // eslint-disable-next-line no-console
      console.error("Error creating notification:", error);
    }

    return res.json({
      success: true,
      message: "Interview scheduled successfully",
      application: {
        id: updatedApplication._id.toString(),
        currentStage: updatedApplication.currentStage,
        interview: updatedApplication.metadata?.interview,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get interview schedule
 * GET /api/v1/recruiter/interviews
 */
export const getInterviewSchedule = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { startDate, endDate, status } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const jobs = await JobPost.find({ owner: userObjectId }).select("_id").lean();
    const jobIds = jobs.map((j) => j._id);

    let query = {
      job: { $in: jobIds },
      currentStage: "interview",
      "metadata.interview": { $exists: true },
    };

    if (status) {
      query["metadata.interview.status"] = status;
    }

    const applications = await JobApplication.find(query).lean();

    // Filter by date range if provided
    let interviews = applications.filter((app) => {
      const interview = app.metadata?.interview;
      if (!interview || !interview.scheduledDate) return false;

      const interviewDate = new Date(interview.scheduledDate);
      if (startDate && interviewDate < new Date(startDate)) return false;
      if (endDate && interviewDate > new Date(endDate)) return false;
      return true;
    });

    // Sort by scheduled date
    interviews.sort((a, b) => {
      const dateA = new Date(a.metadata?.interview?.scheduledDate || 0);
      const dateB = new Date(b.metadata?.interview?.scheduledDate || 0);
      return dateA - dateB;
    });

    // Enrich with job and candidate data
    const enrichedInterviews = await Promise.all(
      interviews.map(async (app) => {
        const job = await JobPost.findById(app.job).select("title company").lean();
        return {
          applicationId: app._id.toString(),
          candidateId: app.candidateId,
          candidateName: app.candidateName,
          candidateHeadline: app.candidateHeadline,
          job: {
            id: app.job.toString(),
            title: job?.title || "Unknown",
            company: job?.company || "Unknown",
          },
          interview: app.metadata?.interview || {},
        };
      })
    );

    return res.json({
      interviews: enrichedInterviews,
      total: enrichedInterviews.length,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update interview status
 * PATCH /api/v1/recruiter/applicants/:applicationId/interview
 */
export const updateInterviewStatus = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { applicationId } = req.params;
    const { status, feedback, rescheduleDate, rescheduleTime } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!status) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Status is required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    const applicationObjectId = mongoose.isValidObjectId(applicationId)
      ? new mongoose.Types.ObjectId(applicationId)
      : null;

    if (!userObjectId || !applicationObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID or application ID",
        },
      });
    }

    // Verify ownership
    const application = await JobApplication.findById(applicationObjectId).lean();
    if (!application) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Application not found",
        },
      });
    }

    const job = await JobPost.findOne({ _id: application.job, owner: userObjectId }).lean();
    if (!job) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You don't have permission to update this interview",
        },
      });
    }

    const updateData = {
      "metadata.interview.status": status,
      "metadata.interview.updatedAt": new Date(),
    };

    if (feedback) {
      updateData["metadata.interview.feedback"] = feedback;
    }

    if (rescheduleDate && rescheduleTime) {
      const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
      updateData["metadata.interview.scheduledDate"] = newDateTime;
      updateData["metadata.interview.rescheduledAt"] = new Date();
    }

    const updatedApplication = await JobApplication.findByIdAndUpdate(
      applicationObjectId,
      { $set: updateData },
      { new: true }
    );

    // Create notification
    try {
      await Notification.create({
        user: application.candidateId,
        title: "Interview Status Updated",
        description: `Your interview status has been updated to ${status}`,
        type: "event",
        actionUrl: `/student/applications`,
        metadata: {
          jobId: application.job.toString(),
          applicationId: application._id.toString(),
          interviewStatus: status,
        },
      });
    } catch (error) {
      // Continue even if notification fails
      // eslint-disable-next-line no-console
      console.error("Error creating notification:", error);
    }

    return res.json({
      success: true,
      message: "Interview status updated successfully",
      application: {
        id: updatedApplication._id.toString(),
        interview: updatedApplication.metadata?.interview,
      },
    });
  } catch (error) {
    return next(error);
  }
};

