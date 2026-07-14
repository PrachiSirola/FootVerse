import cron from "node-cron";

/**
 * DISABLED — this job was a SECOND, independent hourly crawler.
 *
 * It called buildPool() directly, which:
 *   - bypassed productStore entirely (so the atomic-swap and
 *     never-serve-an-incomplete-pool guards did nothing against it),
 *   - wiped the product cache every hour, and
 *   - re-crawled CJ every hour, on top of productSyncService already doing so.
 *
 * That is what produced the fluctuating product counts (5000 → 2000 → 500), the
 * empty categories, and the constant CJ rate-limit pressure.
 *
 * productSyncService is now the single owner of refreshing the catalogue. This
 * file is kept as a no-op so nothing that imports it breaks.
 */
async function refreshNow() {
  console.log("[cache REFRESH] disabled — productSyncService owns catalogue refresh");
}

export function startCacheRefreshJob() {
  console.log("[cache] hourly refresh job DISABLED (productSyncService handles it)");
}

export { refreshNow };