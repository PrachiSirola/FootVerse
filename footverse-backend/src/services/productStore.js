/**
 * Redis-only product store (no MongoDB).
 *
 *   User → memory → Redis → CJ
 *
 * Design goals: never make a user wait on CJ (1 req/sec = minutes for a full
 * catalog), and never let the cache go cold.
 *
 *  1. IN-PROCESS MEMORY CACHE — the hottest layer. Repeat requests skip Redis
 *     entirely (microseconds instead of a network round-trip).
 *  2. REDIS POOL WITH NO TTL — the pool never expires, so it can't go cold and
 *     dump users onto CJ. Freshness comes from a background refresh, not expiry.
 *  3. STALE-WHILE-REVALIDATE — if the pool is older than REFRESH_AFTER_MS, it's
 *     served INSTANTLY anyway and refreshed in the background.
 *  4. PROGRESSIVE COLD START — on a truly empty Redis, fetch a small first batch
 *     from CJ (seconds), serve it immediately, and keep loading the FULL catalog
 *     in the background. Users browse right away.
 *  5. SINGLE-PRODUCT MISS — fetch just that one product from CJ (~1 request)
 *     instead of rebuilding the whole pool, and cache it immediately.
 */
import { buildPool, buildFirstBatch, fetchSingleProductFromCJ } from "./cjPoolService.js";
import { cacheGet, cacheSet, cacheSetForever, cacheDel, invalidateProductCache, PRODUCT_PREFIX } from "../utils/cache.js";

const POOL_KEY = `${PRODUCT_PREFIX}pool`;
const META_KEY = `${PRODUCT_PREFIX}pool:meta`;       // { builtAt, count, complete }
const PROGRESS_KEY = `${PRODUCT_PREFIX}pool:progress`; // { products, doneKeywords } — resume point
// The last pool that was crawled to COMPLETION. The storefront falls back to
// this whenever the working pool is incomplete, so a half-built catalogue (with
// whole categories missing) is never served.
const LAST_COMPLETE_KEY = `${PRODUCT_PREFIX}pool:lastComplete`;

/** Serve instantly, but kick off a background refresh once the pool is this old. */
const REFRESH_AFTER_MS = Number(process.env.PRODUCT_REFRESH_AFTER_MS || 60 * 60 * 1000); // 1h

/* ---------------- Layer 1: in-process memory ---------------- */
let memPool = null;       // the product array
let memMeta = null;       // { builtAt, count, complete }
let memLoadedAt = 0;      // when this process last read Redis
// The Redis pool has NO TTL and only changes when a sync COMPLETES (which also
// clears this cache explicitly). Re-reading and re-parsing ~5,000 products every
// 30s was the main cause of slow page loads, so the in-process copy is held for
// much longer — correctness is preserved because completion invalidates it.
const MEM_TTL_MS = Number(process.env.PRODUCT_MEM_TTL_MS || 10 * 60 * 1000); // 10 min

/** Guards so we never run two CJ builds at once. */
let refreshing = false;
let coldFilling = false;

function setMemory(pool, meta) {
  memPool = pool;
  memMeta = meta;
  memLoadedAt = Date.now();
}

/** Clear the in-process cache (called after a rebuild so all readers see fresh data). */
export function clearMemoryCache() {
  memPool = null;
  memMeta = null;
  memLoadedAt = 0;
}

/* ---------------- Writing ---------------- */

async function savePool(pool, { complete = true } = {}) {
  const meta = { builtAt: Date.now(), count: pool.length, complete };
  // No TTL — the pool must never expire out from under us.
  await cacheSetForever(POOL_KEY, pool);
  await cacheSetForever(META_KEY, meta);
  // Archive every COMPLETE pool as the safe fallback the storefront can serve
  // if a later crawl leaves the working pool half-built.
  if (complete) await cacheSetForever(LAST_COMPLETE_KEY, pool);
  setMemory(pool, meta);
  console.log(`[products] pool saved to Redis — ${pool.length} products (complete: ${complete})`);
  return meta;
}

/* ---------------- Background work ---------------- */

/** Refresh the pool from CJ in the background. Never blocks a request. */
async function refreshInBackground(reason = "stale") {
  if (refreshing) return;
  refreshing = true;
  console.log(`[products] background refresh started (${reason})`);
  try {
    const pool = await buildPool({ deep: true });
    if (pool && pool.length) {
      await savePool(pool, { complete: true });
      console.log(`[products] background refresh done — ${pool.length} products`);
    } else {
      console.warn("[products] background refresh got no products — keeping existing pool");
    }
  } catch (err) {
    console.error(`[products] background refresh failed: ${err.message} — keeping existing pool`);
  } finally {
    refreshing = false;
  }
}

/**
 * Build the FULL catalog in the background, RESUMING from the last checkpoint if
 * a previous run was interrupted (crash, restart, deploy). Progress is saved to
 * Redis after every keyword, so nothing is ever re-crawled unnecessarily.
 * Retries automatically until the catalog is complete — no manual step.
 */
async function fillFullCatalogInBackground(attempt = 1) {
  if (coldFilling) return;
  coldFilling = true;

  const MAX_ATTEMPTS = 5;
  try {
    // Load any saved progress so we resume instead of starting over.
    const saved = await cacheGet(PROGRESS_KEY);
    if (saved?.doneKeywords?.length) {
      console.log(
        `[products] resuming catalog build — ${saved.doneKeywords.length} keyword(s) already done, ${saved.products?.length || 0} products so far`
      );
    } else {
      console.log("[products] building the full catalog from CJ…");
    }

    const pool = await buildPool({
      deep: true,
      resume: saved || null,
      // Checkpoint after each keyword: save BOTH the resume point and a live
      // partial pool, so the storefront immediately benefits from progress and
      // a restart resumes exactly here.
      // CHECKPOINT — save the RESUME POINT only.
      //
      // It must NOT overwrite the live pool. Keywords are crawled in order
      // (broad → Men → Women → Kids → Sports), so a partial pool is missing
      // whole CATEGORIES. Publishing it made Kids/Sports pages go empty
      // mid-crawl and reappear later — and stay empty forever if the crawl
      // never finished. The storefront keeps serving the last COMPLETE pool
      // until the new one is finished, then it is swapped in atomically.
      onProgress: async ({ products, doneKeywords, totalKeywords }) => {
        await cacheSetForever(PROGRESS_KEY, { products, doneKeywords });
        console.log(
          `[products] checkpoint — ${doneKeywords.length}/${totalKeywords} keywords, ${products.length} products (not yet published)`
        );
      },
    });

    if (pool && pool.length) {
      // ATOMIC SWAP: the completed pool replaces the old one in one step, and
      // only now — the storefront never sees a half-built catalogue.
      await savePool(pool, { complete: true });
      await cacheDel(PROGRESS_KEY); // done — clear the resume point

      // Cached RESPONSES (e.g. /api/products?category=Kids) may have been
      // computed against the previous pool. If any were cached while the old
      // pool lacked a category, that page would stay empty forever. Clear them
      // so every category is recomputed against the new complete catalogue.
      await invalidateProductCache();
      clearMemoryCache();

      console.log(`[products] FULL catalog ready — ${pool.length} products ✓ (published, caches cleared)`);
    } else {
      throw new Error("CJ returned no products");
    }
  } catch (err) {
    console.error(`[products] catalog build failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${err.message}`);
    coldFilling = false;
    // Auto-retry with backoff — progress is checkpointed, so the retry resumes.
    if (attempt < MAX_ATTEMPTS) {
      const wait = Math.min(60000, 5000 * attempt);
      console.log(`[products] retrying the catalog build in ${wait / 1000}s (will resume from checkpoint)…`);
      setTimeout(() => fillFullCatalogInBackground(attempt + 1), wait);
    } else {
      console.error("[products] catalog build exhausted retries — will retry on the next request/sync");
    }
    return;
  } finally {
    coldFilling = false;
  }
}

/* ---------------- Reading ---------------- */

/**
 * The full product set. Always returns as fast as possible:
 *   memory → Redis → (cold) a quick CJ first batch, with the rest in background.
 */
export async function getAllProducts() {
  // 1. Memory (fastest — no network at all)
  if (memPool && Date.now() - memLoadedAt < MEM_TTL_MS) {
    maybeRefresh(memMeta);
    return memPool;
  }

  // 2. Redis
  const pool = await cacheGet(POOL_KEY);
  if (pool && pool.length) {
    const meta = (await cacheGet(META_KEY)) || { builtAt: 0, count: pool.length, complete: true };

    // ---- NEVER SERVE AN INCOMPLETE POOL ----
    // A partial pool is missing whole CATEGORIES (keywords are crawled in order:
    // broad → Men → Women → Kids → Sports), which is what made Kids/Sports pages
    // go empty. If the working pool is incomplete, serve the last COMPLETE pool
    // instead and let the crawl finish in the background.
    if (meta.complete === false) {
      const lastComplete = await cacheGet(LAST_COMPLETE_KEY);
      if (lastComplete && lastComplete.length) {
        console.log(
          `[products] pool is incomplete (${pool.length}) — serving the last COMPLETE pool (${lastComplete.length}) instead`
        );
        maybeRefresh(meta); // keep the crawl going
        return lastComplete;
      }
      // No complete pool yet (very first crawl) — serve what we have rather than
      // nothing, and keep filling in the background.
      console.log(`[products] pool incomplete (${pool.length}) and no complete pool yet — serving partial`);
    }

    setMemory(pool, meta);
    maybeRefresh(meta);          // stale? refresh behind the scenes, serve now
    return pool;                 // ← instant, user never waits
  }

  // 3. COLD: Redis is empty. Fetch a fast first batch so the user sees products
  //    within seconds, then load the full catalog in the background.
  console.log("[products] Redis is COLD — fetching a quick first batch from CJ…");
  try {
    const firstBatch = await buildFirstBatch();
    if (firstBatch && firstBatch.length) {
      await savePool(firstBatch, { complete: false }); // partial, more coming
      fillFullCatalogInBackground();                   // don't await
      console.log(`[products] serving ${firstBatch.length} products now; full catalog loading…`);
      return firstBatch;
    }
  } catch (err) {
    console.error(`[products] first-batch fetch failed: ${err.message}`);
  }

  // 4. Absolute worst case: CJ unreachable and nothing cached.
  console.warn("[products] no products available (Redis empty + CJ unreachable)");
  return [];
}

/** Kick off a background refresh if the pool is stale (never blocks). */
function maybeRefresh(meta) {
  if (!meta) return;

  // INCOMPLETE pool (a cold-start batch, or a fill that was interrupted by a
  // crash/restart/deploy). Previously this returned early — which meant a
  // half-built pool was NEVER retried and stayed stuck forever. Now we resume
  // the fill in the background so it always reaches the full catalog.
  if (meta.complete === false) {
    if (!coldFilling) {
      console.log("[products] pool is INCOMPLETE — resuming the full catalog fill");
      fillFullCatalogInBackground();
    }
    return;
  }

  if (Date.now() - (meta.builtAt || 0) > REFRESH_AFTER_MS) {
    refreshInBackground("stale");
  }
}

/**
 * One product by CJ id. On a miss we fetch ONLY that product from CJ (~1
 * request) instead of rebuilding the whole pool, and cache it immediately.
 */
export async function getProductById(id) {
  const key = String(id);

  // 1. From the pool we already have (memory or Redis) — no extra call.
  const pool = await getAllProducts();
  const hit = (pool || []).find((p) => String(p._id) === key);
  if (hit) return hit;

  // 2. Not in the pool: maybe we fetched it individually before.
  const singleKey = `${PRODUCT_PREFIX}item:${key}`;
  const cachedSingle = await cacheGet(singleKey);
  if (cachedSingle) return cachedSingle;

  // 3. Fetch JUST this product from CJ (fast — one request, not a rebuild).
  console.log(`[products] ${key} not cached — fetching this single product from CJ`);
  try {
    const product = await fetchSingleProductFromCJ(key);
    if (product) {
      await cacheSet(singleKey, product); // TTL cache is fine for one-offs
      return product;
    }
  } catch (err) {
    console.warn(`[products] single-product fetch failed for ${key}: ${err.message}`);
  }
  return null;
}

/** Force a full rebuild now (admin). Returns the new pool size. */
export async function rebuildPool() {
  const pool = await buildPool({ deep: true });
  if (pool && pool.length) {
    await savePool(pool, { complete: true });
    return { ok: true, count: pool.length };
  }
  return { ok: false, count: 0 };
}

/** Current pool status (for admin/debug). */
export async function getPoolStatus() {
  const meta = (await cacheGet(META_KEY)) || null;
  return {
    cached: !!meta,
    count: meta?.count || 0,
    complete: meta?.complete ?? null,
    builtAt: meta?.builtAt ? new Date(meta.builtAt).toISOString() : null,
    ageMinutes: meta?.builtAt ? Math.round((Date.now() - meta.builtAt) / 60000) : null,
    refreshing,
    coldFilling,
  };
}

/**
 * Resume an interrupted catalog build from its last checkpoint. Safe to call
 * repeatedly — it's a no-op if a fill is already running.
 */
export async function resumeIncompleteBuild() {
  await fillFullCatalogInBackground();
}

/**
 * Re-classify every product ALREADY in the Redis pool — no CJ calls at all.
 *
 * The category/subcategory is baked into each product when it's fetched, so a
 * classifier fix has no effect on data already cached. Flushing Redis to force a
 * re-crawl works, but it burns the CJ rate limit for no reason: the product NAME
 * is already stored, and that's all the classifier needs.
 *
 * This reads the pool, re-runs the classifier over every product's name, writes
 * it back, and clears the response cache. Zero CJ requests, runs in milliseconds.
 */
export async function reclassifyPool() {
  const { classifyCategory, classifySubcategory } = await import("../utils/categoryClassifier.js");

  const pool = (await cacheGet(POOL_KEY)) || [];
  if (!pool.length) {
    return { ok: false, message: "The Redis pool is empty — nothing to re-classify." };
  }

  const before = {};
  const after = {};
  let changed = 0;

  const updated = pool.map((p) => {
    const oldKey = `${p.category} > ${p.subcategory}`;
    before[oldKey] = (before[oldKey] || 0) + 1;

    // Re-classify from the product NAME (already cached — no CJ call needed).
    const category = classifyCategory(p.name, p.category);
    const subcategory = classifySubcategory(p.name, p.subcategory, category);

    const newKey = `${category} > ${subcategory}`;
    after[newKey] = (after[newKey] || 0) + 1;
    if (newKey !== oldKey) changed++;

    return { ...p, category, categoryName: category, subcategory };
  });

  // Publish the re-classified pool and clear cached responses so category pages
  // are recomputed against it.
  await savePool(updated, { complete: true });
  await invalidateProductCache();
  clearMemoryCache();

  console.log(`[reclassify] ${updated.length} products re-classified — ${changed} moved category`);
  console.log("[reclassify] ── NEW BREAKDOWN ──");
  for (const k of Object.keys(after).sort()) {
    console.log(`[reclassify]   ${k}: ${after[k]}`);
  }

  return { ok: true, total: updated.length, changed, before, after };
}