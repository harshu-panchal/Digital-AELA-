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

const app = express();

app.use(cors());
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

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/recruiter", recruiterRoutes);
app.use("/api/v1/recruiter/jobs", jobRoutes);
app.use("/api/v1/recruiter/blogs", blogRoutes);
app.use("/api/v1/blogs", publicBlogRoutes);
app.use("/api/v1/jobs", publicJobRoutes);
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/quizzes", quizRoutes);
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

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("[Error]", err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || "SERVER_ERROR",
      message: err.message || "Something went wrong",
    },
  });
});

export default app;

