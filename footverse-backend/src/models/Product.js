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
import {
  cacheGet, cacheSet, cacheSetForever, cacheDel, invalidateProductCache, PRODUCT_PREFIX,
  savePoolShards, loadPoolShards,
} from "../utils/cache.js";
import { getLastPointsInfo, isPointsPaused, pointsPauseRemainingMs } from "../utils/apiClient.js";

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
// In-memory mirror of the Redis resume checkpoint (fast reads / status endpoint).
let progressMirror = null;

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

  // SHARDED WRITE — the pool is split into size-bounded chunks so managed Redis
  // (Upstash / Render KV) never rejects an oversized value. savePoolShards
  // REPORTS failure (unlike the old silent cacheSetForever), so a rejected write
  // is visible in logs instead of leaving prod stuck on the cold-start batch.
  const res = await savePoolShards(POOL_KEY, pool);
  if (!res.ok) {
    // Do NOT publish meta for a pool that didn't persist — otherwise readers
    // would trust a count that isn't actually in Redis.
    console.error(`[products] pool save FAILED (${res.reason}) — meta not updated, keeping previous pool`);
    return null;
  }
  await cacheSetForever(META_KEY, meta);

  // Archive every COMPLETE pool as the safe fallback the storefront serves if a
  // later crawl leaves the working pool half-built. Also sharded.
  if (complete) await savePoolShards(LAST_COMPLETE_KEY, pool);

  setMemory(pool, meta);
  console.log(`[products] pool saved to Redis — ${pool.length} products across ${res.shards} shard(s) (complete: ${complete})`);
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
 * Merge freshly-fetched products into the existing pool by _id (UPSERT), never
 * shrinking. Used when a crawl stops early (points exhausted): the partial we
 * DID fetch is folded in, so progress is never lost, but the pool can only grow
 * or update — a points-starved short run can never collapse the catalog.
 */
function mergeUpsert(existing, incoming) {
  const byId = new Map(existing.map((p) => [String(p._id), p]));
  for (const p of incoming) {
    if (!p || !p._id) continue;
    byId.set(String(p._id), p); // update if present, insert if new
  }
  return [...byId.values()];
}

// Schedule a resume of the points-paused crawl. Re-checks every 2–3 min (or
// waits out CJ's reset hint) rather than a long fixed delay, so the catalog
// finishes as soon as points return.
let pointsResumeTimer = null;
function schedulePointsResume() {
  if (pointsResumeTimer) return; // already scheduled
  const pauseMs = pointsPauseRemainingMs();
  const wait = pauseMs > 0 ? pauseMs + 1000 : (150 * 1000); // reset hint, else ~2.5 min
  console.log(`[products] points low — will re-check & resume the crawl in ${(wait / 1000 | 0)}s`);
  pointsResumeTimer = setTimeout(() => {
    pointsResumeTimer = null;
    fillFullCatalogInBackground();
  }, wait);
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

    const control = {};
    const pool = await buildPool({
      deep: true,
      resume: saved || null,
      control, // learn WHY the crawl stopped (points vs complete)
      onProgress: async ({ products, doneKeywords, totalKeywords }) => {
        // Redis primary + memory mirror of the resume point.
        await cacheSetForever(PROGRESS_KEY, { products, doneKeywords });
        progressMirror = { products, doneKeywords };
        console.log(
          `[products] checkpoint — ${doneKeywords.length}/${totalKeywords} keywords, ${products.length} products (not yet published)`
        );
      },
    });

    // ---- POINTS-PAUSED: crawl stopped early to protect the reserve ----
    // Do NOT atomic-swap (partial is missing categories). Instead UPSERT the
    // partial into the existing pool so progress shows without shrinking, keep
    // lastComplete as the safe fallback, and schedule a resume. The progress
    // checkpoint is retained so the resume continues from the exact keyword.
    if (control.stopReason && !control.complete) {
      coldFilling = false;
      if (pool && pool.length) {
        const existing = (await loadPoolShards(POOL_KEY)) || [];
        const merged = mergeUpsert(existing, pool);
        if (merged.length >= existing.length) {
          // never shrink; publish as a NON-complete pool (getAllProducts still
          // prefers lastComplete when serving, so users see a full catalog)
          await savePool(merged, { complete: false });
          console.log(
            `[products] ⏸ crawl paused (${control.stopReason}) — merged ${pool.length} fetched into pool ` +
            `(${existing.length} → ${merged.length}), lastComplete kept as fallback.`
          );
        }
      } else {
        console.log(`[products] ⏸ crawl paused (${control.stopReason}) with no new products — pool unchanged.`);
      }
      schedulePointsResume();
      return; // resume timer will continue; do NOT clear PROGRESS_KEY
    }

    if (pool && pool.length && control.complete) {
      // ATOMIC SWAP: the completed pool replaces the old one in one step, and
      // only now — the storefront never sees a half-built catalogue.
      await savePool(pool, { complete: true });
      await cacheDel(PROGRESS_KEY); // done — clear the resume point
      progressMirror = null;

      await invalidateProductCache();
      clearMemoryCache();

      console.log(`[products] FULL catalog ready — ${pool.length} products ✓ (published, caches cleared)`);
    } else if (!control.stopReason) {
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

  // 2. Redis (sharded)
  const pool = await loadPoolShards(POOL_KEY);
  if (pool && pool.length) {
    const meta = (await cacheGet(META_KEY)) || { builtAt: 0, count: pool.length, complete: true };

    // ---- NEVER SERVE AN INCOMPLETE POOL ----
    // A partial pool is missing whole CATEGORIES (keywords are crawled in order:
    // broad → Men → Women → Kids → Sports), which is what made Kids/Sports pages
    // go empty. If the working pool is incomplete, serve the last COMPLETE pool
    // instead and let the crawl finish in the background.
    if (meta.complete === false) {
      const lastComplete = await loadPoolShards(LAST_COMPLETE_KEY);
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
  const points = getLastPointsInfo();
  const saved = progressMirror || (await cacheGet(PROGRESS_KEY));
  return {
    cached: !!meta,
    count: meta?.count || 0,
    complete: meta?.complete ?? null,
    builtAt: meta?.builtAt ? new Date(meta.builtAt).toISOString() : null,
    ageMinutes: meta?.builtAt ? Math.round((Date.now() - meta.builtAt) / 60000) : null,
    refreshing,
    coldFilling,
    // ---- points-aware sync observability ----
    points: points
      ? { remaining: points.remaining, ...points }
      : null,
    pointsPaused: isPointsPaused(),
    pointsPauseInSec: Math.round(pointsPauseRemainingMs() / 1000),
    resumePending: !!pointsResumeTimer,
    checkpoint: saved?.doneKeywords
      ? { keywordsDone: saved.doneKeywords.length, productsSoFar: saved.products?.length || 0 }
      : null,
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

  const pool = (await loadPoolShards(POOL_KEY)) || [];
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
    // Pass _id so the gender-neutral 50/50 split is stable across refreshes.
    const category = classifyCategory(p.name, p.category, p._id || p.id);
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
/* ==================== INCREMENTAL SYNC ====================
   Previously every sync ran buildPool({deep:true}) and REPLACED the whole pool.
   That meant a full 143-keyword crawl each time, and if it was interrupted the
   catalogue shrank or lost whole categories.

   The incremental sync instead MERGES into the existing pool:
     - ADD    products CJ returned that we don't have
     - UPDATE products we have whose price/stock/name changed
     - REMOVE products CJ no longer returns (only on a COMPLETE crawl)
   The existing pool is never discarded — if the crawl fails, the catalogue is
   left exactly as it was.
*/

/**
 * Merge freshly-crawled products into the existing pool.
 *
 * @param {Array}  fresh      products from this crawl
 * @param {Object} opts
 * @param {boolean} opts.complete  true only when the crawl finished ALL keywords.
 *   Removals are applied ONLY on a complete crawl — a partial crawl hasn't seen
 *   the whole catalogue, so anything "missing" from it may simply not have been
 *   reached yet. Removing on a partial crawl is what emptied categories.
 */
export async function mergePool(fresh, { complete = false } = {}) {
  const existing = (await loadPoolShards(POOL_KEY)) || [];

  if (!fresh || !fresh.length) {
    console.warn("[merge] the crawl returned no products — keeping the existing pool untouched");
    return { ok: false, added: 0, updated: 0, removed: 0, total: existing.length };
  }

  const byId = new Map(existing.map((p) => [String(p._id), p]));
  const freshIds = new Set();

  let added = 0;
  let updated = 0;

  for (const p of fresh) {
    const id = String(p._id);
    freshIds.add(id);

    const old = byId.get(id);
    if (!old) {
      byId.set(id, p);
      added++;
      continue;
    }

    // Update only if something meaningful actually changed.
    const changed =
      old.price !== p.price ||
      old.stock !== p.stock ||
      old.name !== p.name ||
      old.category !== p.category ||
      old.subcategory !== p.subcategory;

    if (changed) {
      byId.set(id, { ...old, ...p });
      updated++;
    }
  }

  // Removals ONLY on a complete crawl (see the note above).
  let removed = 0;
  if (complete) {
    for (const id of [...byId.keys()]) {
      if (!freshIds.has(id)) {
        byId.delete(id);
        removed++;
      }
    }
  }

  const merged = [...byId.values()];

  // SAFETY: never let an incremental sync gut the catalogue. If a "complete"
  // crawl somehow returns far fewer products than we already have, treat it as
  // suspect and keep the existing pool rather than shrinking.
  if (existing.length > 0 && merged.length < existing.length * 0.5) {
    console.warn(
      `[merge] REFUSED — the merge would drop the catalogue from ${existing.length} to ${merged.length} products. Keeping the existing pool.`
    );
    return { ok: false, refused: true, added: 0, updated: 0, removed: 0, total: existing.length };
  }

  await savePool(merged, { complete: true });
  await invalidateProductCache();
  clearMemoryCache();

  console.log(
    `[merge] ${merged.length} products — +${added} added, ~${updated} updated, -${removed} removed (was ${existing.length})`
  );
  return { ok: true, added, updated, removed, total: merged.length };
}

/**
 * Incremental sync: crawl CJ, then MERGE (never replace).
 * The existing catalogue is preserved if anything goes wrong.
 */
export async function incrementalSync() {
  const existing = (await loadPoolShards(POOL_KEY)) || [];
  console.log(`[sync] incremental sync starting (existing catalogue: ${existing.length} products)`);

  try {
    const fresh = await buildPool({ deep: true });
    // buildPool only returns a full set when it completed every keyword.
    return await mergePool(fresh, { complete: true });
  } catch (err) {
    console.error(`[sync] crawl failed: ${err.message} — the existing catalogue is untouched`);
    return { ok: false, error: err.message, total: existing.length };
  }
}