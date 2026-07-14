import categoryKeywords from "../data/categoryKeywords.js";
import { getCJProductsV2 } from "./cjProductService.js";
import { transformCJLive } from "../transformers/cjLiveTransformer.js";
import { isFootwear } from "../utils/categoryClassifier.js";
import { cacheGet, cacheSet, PRODUCT_PREFIX, PRODUCT_TTL } from "../utils/cache.js";
import { apiClient } from "../utils/apiClient.js";
import CJ_CONFIG from "../config/cjConfig.js";

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
 * Builds the master product pool from CJ: for each of your category/subcategory
 * keywords, fetch one or more pages from CJ, transform to the frontend shape,
 * and tag with YOUR category + subcategory. The tagged pool is what every
 * listing / facet / filter / featured / related operation runs against,
 * mirroring the old MongoDB behaviour while sourcing live data from CJ.
 *
 * @param {{ deep?: boolean }} opts  deep:true loops each keyword until CJ is
 *   exhausted (a partial/empty page) — fetches the TRUE maximum footwear
 *   catalog available, not a fixed target. deep:false (default for the hourly
 *   scheduler) fetches only page 1 per keyword — fast refresh of what's
 *   already in Mongo.
 */
export async function buildPool({ deep = false, onProgress = null, resume = null } = {}) {
  // Resume support: `resume` carries { products, doneKeywords } from a previous
  // (interrupted) run, so a restart continues instead of starting over.
  const all = resume?.products ? [...resume.products] : [];
  const seen = new Set(all.map((p) => String(p._id)));
  const doneKeywords = new Set(resume?.doneKeywords || []);
  const pagesPerKeyword = deep ? SAFETY_MAX_PAGES : SHALLOW_PAGES;

  if (doneKeywords.size) {
    console.log(`[cj pool] RESUMING — ${doneKeywords.size}/${categoryKeywords.length} keywords already done, ${all.length} products so far`);
  }

  let rejected = 0; // non-footwear filtered out at ingestion
  let loggedPageSize = false;

  for (const { keyword, category, subcategory } of categoryKeywords) {
    // Skip keywords already completed in a previous run.
    if (doneKeywords.has(keyword)) continue;
    let keywordCount = 0;
    let effectivePageSize = 0; // CJ's REAL page size, learned from its response
    let pageSize = PER_PAGE;   // may fall back if CJ rejects a large size
    for (let page = 1; page <= pagesPerKeyword; page++) {
      try {
        let res = await getCJProductsV2({ keyWord: keyword, size: pageSize, page });
        let items = res?.products || [];

        // SAFETY NET: if a large page size returns nothing on the very first
        // page, CJ may be rejecting it outright. Fall back to a conservative
        // size rather than silently producing an empty catalogue. (This is what
        // makes the bigger page size safe to try at all.)
        if (page === 1 && items.length === 0 && pageSize > FALLBACK_PAGE_SIZE) {
          console.warn(
            `[cj pool] size=${pageSize} returned nothing for "${keyword}" — retrying at size=${FALLBACK_PAGE_SIZE}`
          );
          await sleep(1100);
          pageSize = FALLBACK_PAGE_SIZE;
          res = await getCJProductsV2({ keyWord: keyword, size: pageSize, page });
          items = res?.products || [];
        }
        for (const raw of items) {
          const p = transformCJLive(raw, category, subcategory);
          if (!p._id || seen.has(p._id)) continue; // de-dupe across keywords/pages
          // Broad keywords also return bags, socks, shoe racks and apparel.
          // Keep the catalog pure — only genuine footwear is admitted.
          if (!isFootwear(p.name)) {
            rejected++;
            continue;
          }
          seen.add(p._id);
          all.push(p);
          keywordCount++;
        }
        await sleep(1100); // respect CJ QPS limit (1 request/second)

        // ---- WHERE TO STOP ----
        // Never compare against the size we REQUESTED: if CJ caps its page size
        // below our request (e.g. we ask 200, CJ gives 100), then every page
        // looks "short" and we'd stop after page 1 for every keyword — which is
        // exactly what collapsed the catalogue. Instead, learn CJ's ACTUAL page
        // size from its first full response and compare against that.
        if (page === 1 && items.length > 0) {
          effectivePageSize = items.length;
          if (!loggedPageSize) {
            console.log(
              `[cj pool] CJ page size — requested ${PER_PAGE}, actually returns ${effectivePageSize}`
            );
            loggedPageSize = true;
          }
        }

        // Genuinely out of results: an empty page, or a page shorter than the
        // size CJ has been consistently giving us.
        if (items.length === 0) break;
        if (effectivePageSize && items.length < effectivePageSize) break;
      } catch (err) {
        console.warn(`[cj pool] "${keyword}" page ${page} failed: ${err.message}`);
        break; // move to the next keyword rather than retrying forever
      }
    }
    console.log(`[cj pool] ${keyword} → ${keywordCount} (running total: ${all.length})`);

    // CHECKPOINT: persist progress after every keyword so an interrupted run
    // (crash, restart, deploy) resumes from here instead of starting over.
    doneKeywords.add(keyword);
    if (onProgress) {
      try {
        await onProgress({
          products: all,
          doneKeywords: [...doneKeywords],
          totalKeywords: categoryKeywords.length,
          complete: doneKeywords.size === categoryKeywords.length,
        });
      } catch (e) {
        console.warn(`[cj pool] checkpoint save failed: ${e.message}`);
      }
    }
  }

  console.log(`[cj pool] ALL keywords done — ${all.length} unique FOOTWEAR products (${rejected} non-footwear rejected) across ${categoryKeywords.length} keywords`);

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

  const slice = categoryKeywords.slice(0, FIRST_BATCH_KEYWORDS);
  for (const { keyword, category, subcategory } of slice) {
    try {
      const res = await getCJProductsV2({ keyWord: keyword, size: PER_PAGE, page: 1 });
      for (const raw of res?.products || []) {
        const p = transformCJLive(raw, category, subcategory);
        if (!p._id || seen.has(p._id)) continue;
        seen.add(p._id);
        all.push(p);
      }
      await sleep(1100); // CJ QPS limit
    } catch (err) {
      console.warn(`[cj pool] first-batch "${keyword}" failed: ${err.message}`);
    }
  }
  console.log(`[cj pool] first batch ready — ${all.length} products (from ${slice.length} keywords)`);
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