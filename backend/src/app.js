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

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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

