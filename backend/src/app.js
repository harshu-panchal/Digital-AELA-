import express from "express";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
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
import courseModuleRoutes from "./routes/courseModuleRoutes.js";
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
// import translationRoutes from "./routes/translationRoutes.js";
import publicSettingsRoutes from "./routes/publicSettingsRoutes.js";
import joinUsApplicationRoutes from "./routes/joinUsApplicationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRatingRoutes from "./routes/userRatingRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import csrfRoutes from "./routes/csrfRoutes.js";
import { getHomePageData } from "./controllers/homeController.js";
import {
  publicRouter as galleryPublicRouter,
  adminRouter as galleryAdminRouter,
} from "./routes/galleryRoutes.js";
import {
  publicRouter as testimonialPublicRouter,
  adminRouter as testimonialAdminRouter,
} from "./routes/testimonialRoutes.js";
import { authenticate, optionalAuth } from "./middleware/authMiddleware.js";
import { trackSession } from "./middleware/sessionTracking.js";
import { checkMaintenanceMode } from "./middleware/maintenanceMiddleware.js";
import { generateCsrfToken } from "./middleware/csrfMiddleware.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { cacheMiddleware } from "./middleware/cacheMiddleware.js";
import { batchHandler } from "./middleware/batchMiddleware.js";

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
      "https://digital-aela.vercel.app",
      "https://digital-aela-2wrzjx1c8-harshvardhan-panchals-projects.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ].filter(Boolean); // Remove undefined values

    // Regex for Vercel preview URLs
    const vercelPreviewRegex = /^https:\/\/digital-aela-.*-harshvardhan-panchals-projects\.vercel\.app$/;

    // Allow if origin is in allowed list, matches regex, or if in development
    if (
      allowedOrigins.includes(origin) ||
      vercelPreviewRegex.test(origin) ||
      process.env.NODE_ENV !== "production"
    ) {
      callback(null, true);
    } else {
      // In production, reject unlisted origins for security
      console.warn(`[CORS] Blocked request from unlisted origin: ${origin}`);
      callback(new Error(`CORS: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token",
    "CSRF-Token",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range", "X-CSRF-Token"],
};

app.use(cors(corsOptions));

// Compression middleware - compress all responses
app.use(compression({
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression ratio and CPU usage (1-9, 6 is good default)
  threshold: 1024, // Only compress responses larger than 1KB
}));

// Increase body parser limits for file uploads
// Note: For multipart/form-data (file uploads), multer handles parsing
// But we still need these for other content types
// Exclude Razorpay webhook from global JSON parsing to allow signature verification on raw body
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/payments/razorpay/webhook") {
    next();
  } else {
    express.json({ limit: "10gb" })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: "10gb" })); // Added for form data
app.use(morgan("dev"));

// Serve static files from data folder
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.resolve(rootDir, "../frontend/data");

app.use("/static", express.static(dataDir, {
  setHeaders: (res, filePath) => {
    // Set appropriate content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
      ".webm": "video/webm",
      ".pdf": "application/pdf",
    };
    if (contentTypes[ext]) {
      res.setHeader("Content-Type", contentTypes[ext]);
    }
    // Enable CORS for static files
    res.setHeader("Access-Control-Allow-Origin", "*");
  },
}));

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

// CSRF token endpoint (requires authentication)
app.use("/api/v1", csrfRoutes);

// Public settings routes (no authentication required)
app.use("/api/v1/public", publicSettingsRoutes);

// Batch API request endpoint (for batching multiple API calls)
// Use specific path to avoid any potential conflicts
app.post("/api/v1/batch", apiRateLimiter, batchHandler);

// Home page data endpoint (batched, no authentication required)
app.get("/api/v1/home/data", cacheMiddleware, getHomePageData);

// Public gallery routes (no authentication required)
app.use("/api/v1/gallery", galleryPublicRouter);

// Public testimonial routes (no authentication required)
app.use("/api/v1/testimonials", testimonialPublicRouter);

// Check maintenance mode for all API routes (except auth and public)
app.use("/api/v1", checkMaintenanceMode);

// Apply general API rate limiting (100 requests per minute)
// This applies to all API routes except auth routes (which have their own limiters)
app.use("/api/v1", (req, res, next) => {
  // Skip rate limiting for auth routes (they have their own limiters)
  if (req.path.startsWith("/auth")) {
    return next();
  }
  // Apply general API rate limiter
  return apiRateLimiter(req, res, next);
});

// Apply optional authentication middleware to all other API routes
// This allows public endpoints to work without auth, but sets req.auth when token is provided
// Routes that require auth should use requireAuth() middleware explicitly
app.use("/api/v1", optionalAuth);
// Track sessions for authenticated users
app.use("/api/v1", trackSession);
// Generate CSRF tokens for authenticated users (adds X-CSRF-Token header)
app.use("/api/v1", generateCsrfToken);

// Error tracking middleware for system health monitoring (must be after trackSession)
app.use("/api/v1", async (req, res, next) => {
  // Track successful requests (async import to avoid circular dependencies)
  try {
    const { recordRequest } = await import("./utils/systemHealthMonitor.js");
    recordRequest();
  } catch (error) {
    // Ignore if health monitor not available
  }
  next();
});

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
app.use("/api/v1/users", userRatingRoutes);
app.use("/api/v1/learn-earn", learnEarnRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/live-rooms", liveRoomRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/admin", superAdminRoutes);
app.use("/api/v1/admin", adminUserRoutes);
app.use("/api/v1/admin", adminContentRoutes);
app.use("/api/v1/admin/gallery", galleryAdminRouter);
app.use("/api/v1/admin/testimonials", testimonialAdminRouter);
app.use("/api/v1/teacher", teacherCourseRoutes);
app.use("/api/v1/teacher", teacherEbookRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1", courseVideoRoutes);
app.use("/api/v1", courseModuleRoutes);
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
// Translation routes disabled
app.use("/api/v1/join-us", joinUsApplicationRoutes);
app.use("/api/v1/categories", categoryRoutes);

// eslint-disable-next-line no-unused-vars
app.use(async (err, req, res, next) => {
  // Track errors (async import to avoid circular dependencies)
  try {
    const { recordError } = await import("./utils/systemHealthMonitor.js");
    recordError();
  } catch (error) {
    // Ignore if health monitor not available
  }

  // Log error with context (but don't expose sensitive data)
  const isDevelopment = process.env.NODE_ENV === "development";
  const errorDetails = {
    message: err.message,
    code: err.code,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    ...(isDevelopment && { stack: err.stack }), // Only include stack in development
  };

  // eslint-disable-next-line no-console
  console.error("[Error]", JSON.stringify(errorDetails, null, 2));

  const status = err.status || 500;

  // Ensure CORS headers are set even on error responses
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, CSRF-Token");
  }

  // Handle specific error types
  let errorMessage;
  let errorCode = err.code || "SERVER_ERROR";

  if (status === 413 || err.statusCode === 413 || err.type === "entity.too.large" || err.code === "LIMIT_FILE_SIZE") {
    errorCode = "PAYLOAD_TOO_LARGE";
    // Check if the error is from the backend Multer or Express limit
    const isBackendLimit = err.code === "LIMIT_FILE_SIZE" || err.type === "entity.too.large";

    if (isBackendLimit) {
      errorMessage = "File size exceeds the backend limit (10GB). Please check if your file is truly larger than 10GB.";
    } else {
      errorMessage = "Request entity too large. This error is likely coming from your web server or proxy (Nginx, Apache, or Cloudflare) rather than the backend application. Please check 'client_max_body_size' in Nginx or 'LimitRequestBody' in Apache.";
    }
    // Ensure status is 413 for payload too large errors
    status = 413;
  } else if (status === 500) {
    errorMessage = isDevelopment
      ? err.message || "Internal server error"
      : "Internal server error";
  } else {
    errorMessage = isDevelopment
      ? err.message || "Something went wrong"
      : err.message || "Something went wrong";
  }

  res.status(status).json({
    error: {
      code: errorCode,
      message: errorMessage,
      ...(isDevelopment && err.stack && { details: err.stack }), // Only in development
    },
  });
});

export default app;
