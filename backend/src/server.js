import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import connectDatabase from "./config/db.js";
import { setupSocketIO } from "./config/socket.js";
import { setSocketIO } from "./utils/socketEmitter.js";
import { setupJobExpirationCron } from "./utils/jobExpirationCron.js";
import { initializeWorkers } from "./services/mediasoupService.js";
import { initializeHealthMonitoring } from "./utils/systemHealthMonitor.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDatabase();

  // Initialize mediasoup workers (optional - server will start even if this fails)
  try {
    await initializeWorkers();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[Server] mediasoup initialization failed, continuing without voice features:", error.message);
    // eslint-disable-next-line no-console
    console.warn("[Server] Voice room features will not be available, but the server will continue to run.");
  }

  const httpServer = createServer(app);
  
  // Get allowed origins for Socket.IO
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "https://digitalaela.com",
    "https://www.digitalaela.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);
        
        // Allow if origin is in allowed list or if in development
        if (allowedOrigins.some(allowed => origin.includes(allowed.replace(/^https?:\/\//, ''))) || process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          // In production, be more permissive for Socket.IO
          callback(null, true);
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    // Additional options for production stability
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    // Handle connection errors gracefully
    connectTimeout: 45000,
  });

  // Store io instance globally for use in controllers
  setSocketIO(io);

  setupSocketIO(io);

  // Setup cron jobs
  setupJobExpirationCron();

  // Initialize system health monitoring
  initializeHealthMonitoring();

  httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[Server] Listening on port ${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`[Socket.IO] Server initialized`);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});

