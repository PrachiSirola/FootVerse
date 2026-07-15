/**
 * Keeps the Redis product pool fresh — Redis-only (no MongoDB).
 *
 * The pool itself has NO TTL, so it never expires and users are never dumped
 * onto CJ. Freshness is maintained here instead: a background refresh rebuilds
 * the pool on a schedule, and the store also triggers a refresh on read if the
 * pool is stale (stale-while-revalidate). Either way, requests are served from
 * cache immediately and never block on CJ.
 */
import { rebuildPool, incrementalSync, getPoolStatus, resumeIncompleteBuild } from "./productStore.js";
import { invalidateProductCache } from "../utils/cache.js";

// A FULL re-crawl of ~143 keywords at CJ's 1 request/second takes a long time.
// Running it every hour hammered CJ and (with the old checkpoint behaviour)
// republished a partial pool the whole way through — which is why the product
// count cycled 500 → 2000 → 5000 → 500. The catalogue does not change hourly, so
// refresh it once a day by default.
const SYNC_INTERVAL_MS = Number(process.env.PRODUCT_SYNC_MS || 24 * 60 * 60 * 1000); // 24h
let timer = null;
let running = false;

/** Rebuild the Redis pool from CJ. Runs in the background — never blocks a user. */
export async function runProductSync() {
  if (running) {
    console.log("[product sync] already running, skipping this tick");
    return { skipped: true };
  }
  running = true;
  try {
    console.log("[product sync] rebuilding the Redis product pool from CJ…");
    // INCREMENTAL — merges into the existing catalogue instead of replacing it.
    // rebuildPool() used to crawl all 143 keywords and REPLACE the pool, so an
    // interrupted crawl shrank the catalogue and emptied categories.
    const r = await incrementalSync();
    if (!r.ok) {
      console.warn("[product sync] CJ returned no products — keeping the existing cached pool");
      return { ok: false, reason: "empty pool" };
    }
    console.log(`[product sync] done — ${r.count} products cached in Redis`);
    return { ok: true, count: r.count };
  } catch (err) {
    console.error("[product sync] failed:", err.message);
    return { ok: false, error: err.message };
  } finally {
    running = false;
  }
}

/** Start the background refresh scheduler (called once from server startup). */
export function startProductSync() {
  // On boot, check the pool's health and act:
  //   - cold (nothing cached)      → warm it
  //   - INCOMPLETE (interrupted)   → RESUME the fill from the last checkpoint
  //   - warm & complete            → serve instantly, nothing to do
  setTimeout(async () => {
    try {
      const status = await getPoolStatus();
      if (!status.cached || status.count === 0) {
        console.log("[product sync] Redis pool is cold — warming it now");
        await runProductSync();
      } else if (status.complete === false) {
        console.log(
          `[product sync] pool is INCOMPLETE (${status.count} products) — resuming the catalog build from the last checkpoint`
        );
        await resumeIncompleteBuild();
      } else {
        console.log(
          `[product sync] Redis pool warm & complete — ${status.count} products (${status.ageMinutes}m old), serving instantly`
        );
      }
    } catch (e) {
      console.error("[product sync] startup check failed:", e.message);
    }
  }, 3000);

  if (timer) clearInterval(timer);
  timer = setInterval(async () => {
    try {
      // Safety net: if the pool is somehow still incomplete, keep pushing it to
      // completion instead of leaving it half-built.
      const status = await getPoolStatus();
      if (status.complete === false) {
        console.log("[product sync] pool still incomplete — resuming the build");
        await resumeIncompleteBuild();
      } else {
        await runProductSync();
      }
    } catch (e) {
      console.error("[product sync] interval error:", e.message);
    }
  }, SYNC_INTERVAL_MS);
  console.log(`[product sync] background refresh scheduled every ${Math.round(SYNC_INTERVAL_MS / 60000)} min`);
}