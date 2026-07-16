import { getCJProductsV2 } from "./cjProductService.js";
import { transformCJLive } from "../transformers/cjLiveTransformer.js";
import { isFootwear } from "../utils/categoryClassifier.js";
import { cacheGet, cacheSet, PRODUCT_PREFIX, PRODUCT_TTL } from "../utils/cache.js";
import { apiClient, getLastPointsInfo, isPointsPaused } from "../utils/apiClient.js";
import CJ_CONFIG from "../config/cjConfig.js";
import { buildFootwearCrawlList } from "./cjCategoryService.js";
import { NICHE_KEYWORDS, FOOTWEAR_CATEGORY_SEED } from "../data/footwearCategories.js";

// Stop the crawl while at least this many points remain, so a single request can
// never drain the balance below zero mid-flight. 150 ≈ 3 requests of headroom.
const POINTS_RESERVE = Number(process.env.CJ_POINTS_RESERVE || 150);
// First-batch is allowed to run unless points are critically low (< one request).
const POINTS_MIN_ONE_REQUEST = Number(process.env.CJ_POINTS_MIN || 50);

/**
 * Should we STOP before making the next CJ request to protect the points
 * reserve? Returns a reason string to stop, or null to proceed.
 */
function pointsStopReason() {
  if (isPointsPaused()) return "points-paused";
  const pi = getLastPointsInfo();
  // No info yet (first request of the process) → allow; we'll learn after it.
  if (!pi || typeof pi.remaining !== "number") return null;
  // Stop when remaining would drop to or below the reserve. `<=` makes RESERVE a
  // true floor: at exactly 150 we stop, keeping 150 in reserve.
  if (pi.remaining <= POINTS_RESERVE) return "points-reserve";
  return null;
}

const POOL_KEY = `${PRODUCT_PREFIX}pool`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// CJ rate-limits by REQUESTS per second, not products. So a bigger page size
// fetches far more product in the same wall-clock time. 200 is CJ's practical max.
const PER_PAGE = Number(process.env.CJ_POOL_PER_KEYWORD || 200);
// If CJ rejects the large page size, retry at this known-good size (the value
// that was working before) rather than ending up with an empty catalogue.
const FALLBACK_PAGE_SIZE = Number(process.env.CJ_POOL_FALLBACK_SIZE || 20);

// Deep sync (initial / manual): loop each keyword until CJ runs out of pages
// (a partial/empty page = natural end), fetching the TRUE maximum available —
// not a fixed target. SAFETY_MAX_PAGES is only a runaway-loop guard (e.g. if
// CJ ever misbehaves and keeps returning full pages forever); it is far above
// any realistic keyword depth and should never be hit in normal operation.
// Shallow sync (hourly refresh): just page 1, so the routine sync stays fast.
const SAFETY_MAX_PAGES = Number(process.env.CJ_POOL_SAFETY_MAX_PAGES || 500);
const SHALLOW_PAGES = 1;

/**
 * Builds the master product pool from CJ by CATEGORY ID (not keywords).
 *
 * For each footwear category (seed IDs ∪ auto-discovered from getCategory), page
 * through CJ using CJ's REAL totalPages/totalRecords — captured from the
 * response, not guessed — and stop exactly at the last page. Then run a small
 * niche-keyword supplement (football/hiking/kids) for styles CJ files under
 * generic categories. Every product is transformed, deduped globally, and
 * footwear-filtered, exactly as before. The tagged pool is what every listing /
 * facet / filter / featured / related operation runs against.
 *
 * Category IDs partition CJ's catalog, so they don't overlap the way keyword
 * searches did — this is the core efficiency win (no more 834-duplicate pages).
 *
 * Classification is UNCHANGED: transformCJLive resolves the real Men/Women/Kids
 * bucket from the product NAME; each category's category/subcategory is only a
 * fallback hint, same role keywords used to play.
 *
 * @param {{ deep?, onProgress?, resume?, control? }} opts
 *   deep:true pages each category to its true end (full catalog).
 *   deep:false fetches page 1 per category only (fast hourly refresh).
 *   control: mutable out-param — {stopReason, complete} — return shape is
 *   still the products array, so every existing caller works unchanged.
 */
export async function buildPool({ deep = false, onProgress = null, resume = null, control = null } = {}) {
  if (control) { control.stopReason = null; control.complete = false; }

  // Resume support: `resume` carries { products, doneCategories } from a previous
  // (interrupted) run. `doneKeywords` is read too, for backward-compat with an
  // old checkpoint, but the migration clears incompatible old state on first run.
  const all = resume?.products ? [...resume.products] : [];
  const seen = new Set(all.map((p) => String(p._id)));
  const doneUnits = new Set(resume?.doneCategories || resume?.doneKeywords || []);
  const maxPages = deep ? SAFETY_MAX_PAGES : SHALLOW_PAGES;

  // Build the crawl list: footwear categories (seed ∪ discovered), then the
  // niche-keyword supplement. Each unit has a stable `unitKey` for checkpointing.
  const categories = await buildFootwearCrawlList();
  const categoryUnits = categories.map((c) => ({
    kind: "category",
    unitKey: `cat:${c.categoryId}`,
    label: c.name,
    categoryId: c.categoryId,
    category: c.category || "",
    subcategory: c.subcategory || "",
  }));
  const keywordUnits = NICHE_KEYWORDS.map((k) => ({
    kind: "keyword",
    unitKey: `kw:${k.keyword}`,
    label: k.keyword,
    keyword: k.keyword,
    category: k.category || "",
    subcategory: k.subcategory || "",
  }));
  const units = [...categoryUnits, ...keywordUnits];

  if (doneUnits.size) {
    console.log(`[cj pool] RESUMING — ${doneUnits.size}/${units.length} units already done, ${all.length} products so far`);
  }
  console.log(`[cj pool] crawl plan: ${categoryUnits.length} categories + ${keywordUnits.length} niche keywords = ${units.length} units`);

  let rejected = 0;      // non-footwear filtered out at ingestion
  let loggedPageSize = false;

  for (const unit of units) {
    if (doneUnits.has(unit.unitKey)) continue;

    // POINTS GATE: stop BEFORE spending points we don't have. Checkpointed per
    // unit, so resume picks up exactly here. Pool so far is kept (merged
    // upstream), never discarded.
    const stop = pointsStopReason();
    if (stop) {
      console.warn(
        `[cj pool] ⏸ stopping crawl (${stop}) at "${unit.label}" — ` +
        `${doneUnits.size}/${units.length} units done, ${all.length} products so far. ` +
        `Will resume when points replenish.`
      );
      if (control) { control.stopReason = stop; control.complete = false; }
      if (onProgress) {
        try {
          await onProgress({
            products: all,
            doneCategories: [...doneUnits],
            totalCategories: units.length,
            complete: false,
            paused: stop,
          });
        } catch (e) {
          console.warn(`[cj pool] checkpoint save failed on pause: ${e.message}`);
        }
      }
      return all; // graceful stop; caller merges partial, never shrinks
    }

    let unitCount = 0;         // new unique footwear from this unit
    let unitDupes = 0;         // already claimed by an earlier unit
    let effectivePageSize = 0; // CJ's REAL page size, learned from its response
    let pageSize = PER_PAGE;
    let cjTotalPages = null;   // CJ's REAL total pages for this unit (captured)

    // Per-unit CJ query: categoryId for categories, keyWord for niche keywords.
    const baseQuery =
      unit.kind === "category" ? { categoryId: unit.categoryId } : { keyWord: unit.keyword };

    for (let page = 1; page <= maxPages; page++) {
      try {
        let res = await getCJProductsV2({ ...baseQuery, size: pageSize, page });
        let items = res?.products || [];

        // SAFETY NET: a large page size returning nothing on page 1 may mean CJ
        // rejected the size. Fall back to a conservative size once.
        if (page === 1 && items.length === 0 && pageSize > FALLBACK_PAGE_SIZE) {
          console.warn(
            `[cj pool] size=${pageSize} returned nothing for "${unit.label}" — retrying at size=${FALLBACK_PAGE_SIZE}`
          );
          await sleep(1100);
          pageSize = FALLBACK_PAGE_SIZE;
          res = await getCJProductsV2({ ...baseQuery, size: pageSize, page });
          items = res?.products || [];
        }

        // Capture CJ's REAL paging metadata on page 1 (the whole point of the
        // migration): we now KNOW how many pages exist and stop exactly there.
        if (page === 1) {
          if (typeof res?.totalPages === "number" && res.totalPages > 0) {
            cjTotalPages = res.totalPages;
          }
          if (items.length > 0) {
            effectivePageSize = items.length;
            if (!loggedPageSize) {
              console.log(`[cj pool] CJ page size — requested ${PER_PAGE}, actually returns ${effectivePageSize}`);
              loggedPageSize = true;
            }
          }
        }

        for (const raw of items) {
          const p = transformCJLive(raw, unit.category, unit.subcategory);
          if (!p._id) continue;
          if (seen.has(p._id)) { unitDupes++; continue; } // global dedup — unchanged
          if (!isFootwear(p.name)) { rejected++; continue; } // purity filter — unchanged
          seen.add(p._id);
          all.push(p);
          unitCount++;
        }
        await sleep(1100); // respect CJ QPS limit (1 request/second) — unchanged

        // ---- WHERE TO STOP (now driven by CJ's REAL totals) ----
        // 1. CJ told us the real last page → stop exactly there (no guessing,
        //    no paging into emptiness, no wasted points).
        if (cjTotalPages && page >= cjTotalPages) break;
        // 2. Fallbacks if CJ didn't provide totalPages: empty page, or a page
        //    shorter than CJ's consistent page size = natural end.
        if (items.length === 0) break;
        if (effectivePageSize && items.length < effectivePageSize) break;
      } catch (err) {
        console.warn(`[cj pool] "${unit.label}" page ${page} failed: ${err.message}`);
        break; // move to the next unit rather than retrying forever
      }
    }

    console.log(
      `[cj pool] ${unit.kind}:${unit.label} → ${unitCount} new, ${unitDupes} dup` +
      `${cjTotalPages ? ` (CJ pages: ${cjTotalPages})` : ""}  (total: ${all.length})`
    );

    // CHECKPOINT after every unit — resume continues from here on interruption.
    doneUnits.add(unit.unitKey);
    if (onProgress) {
      try {
        await onProgress({
          products: all,
          doneCategories: [...doneUnits],
          totalCategories: units.length,
          complete: doneUnits.size === units.length,
        });
      } catch (e) {
        console.warn(`[cj pool] checkpoint save failed: ${e.message}`);
      }
    }
  }

  console.log(`[cj pool] ALL units done — ${all.length} unique FOOTWEAR products (${rejected} non-footwear rejected) across ${units.length} categories+keywords`);
  if (control) { control.stopReason = null; control.complete = true; }

  // ---- Category breakdown, so you can SEE that products landed correctly ----
  const breakdown = {};
  for (const p of all) {
    const cat = p.category || "?";
    const sub = p.subcategory || "?";
    breakdown[cat] = breakdown[cat] || { _total: 0 };
    breakdown[cat][sub] = (breakdown[cat][sub] || 0) + 1;
    breakdown[cat]._total++;
  }
  console.log("[cj pool] ── CATEGORY BREAKDOWN ──");
  for (const cat of Object.keys(breakdown).sort()) {
    const subs = breakdown[cat];
    console.log(`[cj pool]   ${cat}: ${subs._total}`);
    for (const sub of Object.keys(subs).filter((k) => k !== "_total").sort()) {
      console.log(`[cj pool]      ${sub}: ${subs[sub]}`);
    }
  }
  console.log("[cj pool] ───────────────────────");
  // Mark a spread of "featured" (top-rated-ish: first per category)
  const featuredPerCat = {};
  for (const p of all) {
    if (!featuredPerCat[p.category]) { p.featured = true; featuredPerCat[p.category] = 1; }
  }

  console.log(`[cj pool] built: ${all.length} products`);
  // NOTE: the pool is NOT written here any more.
  //
  // It used to be `cacheSet(POOL_KEY, all, PRODUCT_TTL)` — a write with a 1-hour
  // TTL that bypassed productStore entirely. Two things went wrong:
  //   1. The pool EXPIRED after an hour. The next request then found Redis empty,
  //      fell to the COLD path and called CJ live — which is the multi-second
  //      "takes so long to load".
  //   2. It never set the `complete` flag or the lastComplete backup, so
  //      productStore's guards (atomic swap, never-serve-a-partial-pool) were
  //      bypassed and partial pools were published — the fluctuating counts.
  //
  // productStore.savePool() is now the single owner of the pool: no TTL, sets
  // `complete`, and keeps a lastComplete backup. buildPool just RETURNS the
  // products and lets the store publish them.
  return all;
}

/** Get the pool from cache; build (and cache) it on a miss. */
export async function getPool(opts = {}) {
  const cached = await cacheGet(POOL_KEY);
  if (cached && cached.length) return cached;
  return buildPool(opts);
}

export { POOL_KEY };

/**
 * A FAST first batch for a cold cache: fetch page 1 of the first few keywords
 * only (a handful of CJ calls, a few seconds) so users can start browsing
 * immediately while the full catalog loads in the background.
 */
export async function buildFirstBatch() {
  const FIRST_BATCH_KEYWORDS = Number(process.env.CJ_FIRST_BATCH_KEYWORDS || 5);
  const all = [];
  const seen = new Set();

  // First-batch runs even when points are low (an empty storefront is worse than
  // spending points), EXCEPT when critically low — below the cost of one request
  // — where the call would just fail with insufficient points anyway.
  const pi = getLastPointsInfo();
  if (isPointsPaused() || (pi && typeof pi.remaining === "number" && pi.remaining < POINTS_MIN_ONE_REQUEST)) {
    console.warn(
      `[cj pool] first-batch skipped — points critically low` +
      (pi ? ` (remaining: ${pi.remaining} < ${POINTS_MIN_ONE_REQUEST})` : " (paused)") +
      `. Serving existing pool; will build when points return.`
    );
    return all; // empty; caller keeps serving the last good pool, never overwrites
  }

  // Seed the first batch from the first few CATEGORY ids (page 1 each) — a
  // handful of CJ calls, a few seconds, so users can browse immediately while
  // the full category crawl runs in the background.
  const slice = FOOTWEAR_CATEGORY_SEED.slice(0, FIRST_BATCH_KEYWORDS);
  for (const { categoryId, name, category, subcategory } of slice) {
    try {
      const res = await getCJProductsV2({ categoryId, size: PER_PAGE, page: 1 });
      for (const raw of res?.products || []) {
        const p = transformCJLive(raw, category, subcategory);
        if (!p._id || seen.has(p._id)) continue;
        if (!isFootwear(p.name)) continue; // keep the first batch pure too
        seen.add(p._id);
        all.push(p);
      }
      await sleep(1100); // CJ QPS limit
    } catch (err) {
      console.warn(`[cj pool] first-batch "${name}" failed: ${err.message}`);
    }
  }
  console.log(`[cj pool] first batch ready — ${all.length} products (from ${slice.length} categories)`);
  return all;
}

/**
 * Fetch ONE product from CJ by its id — used when a product detail page is
 * opened for something not in the cached pool. One request, not a rebuild.
 */
export async function fetchSingleProductFromCJ(productId) {
  try {
    const res = await apiClient.get(`${CJ_CONFIG.PRODUCT.DETAILS}?pid=${encodeURIComponent(productId)}`);
    const raw = res?.data || res;
    if (!raw || (!raw.pid && !raw.id && !raw.productId)) return null;
    // Category/sub are resolved from the product name by the transformer.
    return transformCJLive(raw, "", "");
  } catch (err) {
    console.warn(`[cj pool] single product ${productId} failed: ${err.message}`);
    return null;
  }
}