import cron from "node-cron";
import { invalidateProductCache } from "../utils/cache.js";
import { isReady } from "../config/redisClient.js";
import { buildPool } from "../services/cjPoolService.js";

/**
 * Hourly: clear product cache, then rebuild the CJ pool from the live CJ API.
 * Rebuilding the pool re-warms listings, facets, featured, search, and related
 * (they all derive from the pool). Safe if Redis is down — buildPool still
 * returns fresh data to callers; it just won't persist.
 */
async function refreshNow() {
  console.log("[cache REFRESH] hourly CJ pool rebuild starting…");
  try {
    if (isReady()) await invalidateProductCache();
    await buildPool();
    console.log("[cache REFRESH] hourly CJ pool rebuild complete");
  } catch (err) {
    console.warn(`[cache ERROR] refresh: ${err.message}`);
  }
}

export function startCacheRefreshJob() {
  cron.schedule("0 * * * *", refreshNow); // minute 0 each hour
  console.log("[cache] hourly CJ pool refresh scheduled");
}

export { refreshNow };