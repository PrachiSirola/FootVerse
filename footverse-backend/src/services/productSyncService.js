/**
 * Scheduled sync: refresh MongoDB from CJ so Mongo (source of truth) stays
 * current — price, stock, new products, and soft-deletes for products CJ no
 * longer returns. Runs on an interval and once on startup.
 *
 * DEPTH: a "deep" sync fetches many pages per keyword (~10,000 products) and
 * is meant for the very first run or a manual admin trigger. Routine hourly
 * ticks stay "shallow" (page 1 per keyword) so they run quickly and just keep
 * prices/stock/availability current for the catalog already in Mongo.
 */
import { buildPool } from "./cjPoolService.js";
import { upsertProducts, softDeleteMissing } from "./productRepository.js";
import { invalidateProductCache } from "../utils/cache.js";
import Product from "../models/Product.js";

const SYNC_INTERVAL_MS = Number(process.env.PRODUCT_SYNC_MS || 60 * 60 * 1000); // 1h default
let timer = null;
let running = false;

/** Run one sync pass: build the CJ pool, upsert into Mongo, soft-delete missing. */
export async function runProductSync({ deep = false } = {}) {
  if (running) {
    console.log("[product sync] already running, skipping this tick");
    return { skipped: true };
  }
  running = true;
  try {
    console.log(`[product sync] building CJ pool… (${deep ? "DEEP — full catalog" : "shallow — quick refresh"})`);
    const pool = await buildPool({ deep }); // fetches CJ + refreshes Redis
    if (!pool || !pool.length) {
      console.warn("[product sync] CJ returned no products — leaving Mongo untouched");
      return { ok: false, reason: "empty pool" };
    }
    const up = await upsertProducts(pool);
    const presentIds = pool.map((p) => String(p._id));
    // Only soft-delete missing products on a deep sync — a shallow (page-1-only)
    // pass doesn't see the full catalog, so it would wrongly hide everything
    // beyond page 1.
    const del = deep ? await softDeleteMissing(presentIds) : { deleted: 0 };
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
  // Initial sync shortly after boot. If Mongo is empty (first-ever run), do a
  // DEEP sync to build out the full ~10,000-product catalog; otherwise a
  // normal shallow refresh is enough — the catalog is already there.
  setTimeout(async () => {
    try {
      const existing = await Product.estimatedDocumentCount();
      const deep = existing === 0;
      if (deep) console.log("[product sync] Mongo is empty — running an initial DEEP sync to build the catalog");
      await runProductSync({ deep });
    } catch (e) {
      console.error("[product sync] initial run error:", e.message);
    }
  }, 4000);

  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    runProductSync({ deep: false }).catch((e) => console.error("[product sync] interval error:", e.message));
  }, SYNC_INTERVAL_MS);
  console.log(`[product sync] scheduled every ${Math.round(SYNC_INTERVAL_MS / 60000)} min (shallow refresh)`);
}