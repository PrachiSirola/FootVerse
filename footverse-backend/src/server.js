import dotenv from "dotenv";
dotenv.config();

console.log("SERVER:", process.env.MONGO_URI);

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { login } from "./services/cjAuthService.js";
import { connectRedis } from "./config/redisClient.js";
import { startCacheRefreshJob } from "./jobs/cacheRefresh.js";
import { startProductSync } from "./services/productSyncService.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Connect Redis (non-fatal — app runs without it)
    await connectRedis();

    try {
      await login();
    } catch (e) {
      console.warn("[cj] login skipped:", e.message);
    }

    // Start Express server
    // Start the Mongo⇄CJ product sync scheduler. This warms the pool, seeds
    // MongoDB (source of truth), and refreshes price/stock/soft-deletes hourly.
    startProductSync();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      startCacheRefreshJob();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();