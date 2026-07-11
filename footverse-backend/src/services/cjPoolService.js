import categoryKeywords from "../data/categoryKeywords.js";
import { getCJProductsV2 } from "./cjProductService.js";
import { transformCJLive } from "../transformers/cjLiveTransformer.js";
import { cacheGet, cacheSet, PRODUCT_PREFIX, PRODUCT_TTL } from "../utils/cache.js";

const POOL_KEY = `${PRODUCT_PREFIX}pool`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PER_PAGE = Number(process.env.CJ_POOL_PER_KEYWORD || 20); // products per CJ page

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
export async function buildPool({ deep = false } = {}) {
  const all = [];
  const seen = new Set();
  const pagesPerKeyword = deep ? SAFETY_MAX_PAGES : SHALLOW_PAGES;

  for (const { keyword, category, subcategory } of categoryKeywords) {
    let keywordCount = 0;
    for (let page = 1; page <= pagesPerKeyword; page++) {
      try {
        const res = await getCJProductsV2({ keyWord: keyword, size: PER_PAGE, page });
        const items = res?.products || [];
        for (const raw of items) {
          const p = transformCJLive(raw, category, subcategory);
          if (!p._id || seen.has(p._id)) continue; // de-dupe across keywords/pages
          seen.add(p._id);
          all.push(p);
          keywordCount++;
        }
        await sleep(1100); // respect CJ QPS limit (1 request/second)
        // CJ ran out of pages for this keyword — stop early instead of
        // wasting calls on empty pages.
        if (items.length < PER_PAGE) break;
      } catch (err) {
        console.warn(`[cj pool] "${keyword}" page ${page} failed: ${err.message}`);
        break; // move to the next keyword rather than retrying forever
      }
    }
    console.log(`[cj pool] ${keyword} → ${keywordCount} (running total: ${all.length})`);
  }

  // Mark a spread of "featured" (top-rated-ish: first per category)
  const featuredPerCat = {};
  for (const p of all) {
    if (!featuredPerCat[p.category]) { p.featured = true; featuredPerCat[p.category] = 1; }
  }

  console.log(`[cj pool] built: ${all.length} products`);
  await cacheSet(POOL_KEY, all, PRODUCT_TTL);
  return all;
}

/** Get the pool from cache; build (and cache) it on a miss. */
export async function getPool(opts = {}) {
  const cached = await cacheGet(POOL_KEY);
  if (cached && cached.length) return cached;
  return buildPool(opts);
}

export { POOL_KEY };