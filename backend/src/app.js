import express from "express";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import recruiterRoutes from "./routes/recruiterRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";

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
app.use("/api/v1/resources", resourceRoutes);

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

