import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import connectDatabase from "./config/db.js";
import { setupSocketIO } from "./config/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDatabase();

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setupSocketIO(io);

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

