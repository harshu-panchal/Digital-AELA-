import dotenv from "dotenv";
import app from "./app.js";
import connectDatabase from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[Server] Listening on port ${PORT}`);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});

