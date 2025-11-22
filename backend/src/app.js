import express from "express";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import recruiterRoutes from "./routes/recruiterRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import publicBlogRoutes from "./routes/publicBlogRoutes.js";
import publicJobRoutes from "./routes/publicJobRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import questionBankRoutes from "./routes/questionBankRoutes.js";
import socialRoutes from "./routes/socialRoutes.js";
import learnEarnRoutes from "./routes/learnEarnRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import liveRoomRoutes from "./routes/liveRoomRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminContentRoutes from "./routes/adminContentRoutes.js";
import teacherCourseRoutes from "./routes/teacherCourseRoutes.js";
import teacherEbookRoutes from "./routes/teacherEbookRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import courseVideoRoutes from "./routes/courseVideoRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import earningRoutes from "./routes/earningRoutes.js";
import crmRoutes from "./routes/crmRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import doubtTicketRoutes from "./routes/doubtTicketRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import rewardRoutes from "./routes/rewardRoutes.js";
import redemptionRequestRoutes from "./routes/redemptionRequestRoutes.js";
import translationRoutes from "./routes/translationRoutes.js";
import publicSettingsRoutes from "./routes/publicSettingsRoutes.js";
import { authenticate, optionalAuth } from "./middleware/authMiddleware.js";
import { trackSession } from "./middleware/sessionTracking.js";

const app = express();

// Configure CORS with explicit settings for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "https://digitalaela.com",
      "https://www.digitalaela.com",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ].filter(Boolean); // Remove undefined values
    
    // Allow if origin is in allowed list or if in development
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      // In production, log but still allow (you can change this to reject)
      console.warn(`[CORS] Request from unlisted origin: ${origin}`);
      callback(null, true); // Allow all origins for now, change to callback(new Error(...)) to reject
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    message: "Digital AELA Backend API",
    version: "1.0.0",
    status: "running",
    health: "/health",
    api: "/api/v1",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API info endpoint
app.get("/api/v1", (_req, res) => {
  res.json({
    message: "Digital AELA Backend API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: "/api/v1/auth",
      students: "/api/v1/students",
      teachers: "/api/v1/teachers",
      courses: "/api/v1/courses",
      quizzes: "/api/v1/quizzes",
      blogs: "/api/v1/blogs",
      jobs: "/api/v1/jobs",
      resources: "/api/v1/resources",
      admin: "/api/v1/admin",
      upload: "/api/v1/upload",
    },
    health: "/health",
  });
});

// Auth routes (no authentication required)
app.use("/api/v1/auth", authRoutes);

// Public settings routes (no authentication required)
app.use("/api/v1/public", publicSettingsRoutes);

// Apply optional authentication middleware to all other API routes
// This allows public endpoints to work without auth, but sets req.auth when token is provided
// Routes that require auth should use requireAuth() middleware explicitly
app.use("/api/v1", optionalAuth);
// Track sessions for authenticated users
app.use("/api/v1", trackSession);
app.use("/api/v1/recruiter", recruiterRoutes);
app.use("/api/v1/recruiter/jobs", jobRoutes);
app.use("/api/v1/recruiter/blogs", blogRoutes);
app.use("/api/v1/blogs", publicBlogRoutes);
app.use("/api/v1/jobs", publicJobRoutes);
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/quizzes", quizRoutes);
app.use("/api/v1/question-bank", questionBankRoutes);
app.use("/api/v1/social", socialRoutes);
app.use("/api/v1/learn-earn", learnEarnRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/live-rooms", liveRoomRoutes);
app.use("/api/v1/admin", superAdminRoutes);
app.use("/api/v1/admin", adminUserRoutes);
app.use("/api/v1/admin", adminContentRoutes);
app.use("/api/v1/teacher", teacherCourseRoutes);
app.use("/api/v1/teacher", teacherEbookRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1", courseVideoRoutes);
app.use("/api/v1", reviewRoutes);
app.use("/api/v1", assignmentRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/certificates", certificateRoutes);
app.use("/api/v1/earnings", earningRoutes);
app.use("/api/v1/crm", crmRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/doubt-tickets", doubtTicketRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/backups", backupRoutes);
app.use("/api/v1/batches", batchRoutes);
app.use("/api/v1/rewards", rewardRoutes);
app.use("/api/v1/redemption-requests", redemptionRequestRoutes);
app.use("/api/v1/translate", translationRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error("[Error]", err);
  const status = err.status || 500;
  
  // Ensure CORS headers are set even on error responses
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  
  res.status(status).json({
    error: {
      code: err.code || "SERVER_ERROR",
      message: err.message || "Something went wrong",
    },
  });
});

export default app;

