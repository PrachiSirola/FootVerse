/**
 * Scheduled sync: refresh MongoDB from CJ so Mongo (source of truth) stays
 * current — price, stock, new products, and soft-deletes for products CJ no
 * longer returns. Runs on an interval and once on startup.
 */
import { buildPool } from "./cjPoolService.js";
import { upsertProducts, softDeleteMissing } from "./productRepository.js";
import { invalidateProductCache } from "../utils/cache.js";

const SYNC_INTERVAL_MS = Number(process.env.PRODUCT_SYNC_MS || 60 * 60 * 1000); // 1h default
let timer = null;
let running = false;

/** Run one sync pass: build the CJ pool, upsert into Mongo, soft-delete missing. */
export async function runProductSync() {
  if (running) {
    console.log("[product sync] already running, skipping this tick");
    return { skipped: true };
  }
  running = true;
  try {
    console.log("[product sync] building CJ pool…");
    const pool = await buildPool(); // fetches CJ + refreshes Redis
    if (!pool || !pool.length) {
      console.warn("[product sync] CJ returned no products — leaving Mongo untouched");
      return { ok: false, reason: "empty pool" };
    }
    const up = await upsertProducts(pool);
    const presentIds = pool.map((p) => String(p._id));
    const del = await softDeleteMissing(presentIds);
    // Clear cached /products responses so the storefront serves fresh data
    // immediately (otherwise stale lists linger until TTL).
    await invalidateProductCache();
    console.log(`[product sync] done — upserted ${up.upserted}, soft-deleted ${del.deleted}, cache cleared`);
    return { ok: true, upserted: up.upserted, deleted: del.deleted };
  } catch (err) {
    console.error("[product sync] failed:", err.message);
    return { ok: false, error: err.message };
  } finally {
    running = false;
  }
}

/** Start the scheduler (called once from server startup). */
export function startProductSync() {
  // Initial sync shortly after boot (don't block server start).
  setTimeout(() => {
    runProductSync().catch((e) => console.error("[product sync] initial run error:", e.message));
  }, 4000);

  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    runProductSync().catch((e) => console.error("[product sync] interval error:", e.message));
  }, SYNC_INTERVAL_MS);
  console.log(`[product sync] scheduled every ${Math.round(SYNC_INTERVAL_MS / 60000)} min`);
}