import categoryKeywords from "../data/categoryKeywords.js";
import { getCJProductsV2 } from "./cjProductService.js";
import { transformCJLive } from "../transformers/cjLiveTransformer.js";
import { cacheGet, cacheSet, PRODUCT_PREFIX, PRODUCT_TTL } from "../utils/cache.js";

const POOL_KEY = `${PRODUCT_PREFIX}pool`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PER_KEYWORD = Number(process.env.CJ_POOL_PER_KEYWORD || 20); // products per category/sub

/**
 * Builds the master product pool from CJ: for each of your category/subcategory
 * keywords, fetch a page from CJ, transform to the frontend shape, and tag with
 * YOUR category + subcategory. The tagged pool is what every listing / facet /
 * filter / featured / related operation runs against in memory — mirroring the
 * old MongoDB behaviour while sourcing live data from CJ.
 */
export async function buildPool() {
  const all = [];
  const seen = new Set();

  for (const { keyword, category, subcategory } of categoryKeywords) {
    try {
      const res = await getCJProductsV2({ keyWord: keyword, size: PER_KEYWORD, page: 1 });
      const items = res?.products || [];
      for (const raw of items) {
        const p = transformCJLive(raw, category, subcategory);
        if (!p._id || seen.has(p._id)) continue; // de-dupe across keywords
        seen.add(p._id);
        all.push(p);
      }
      console.log(`[cj pool] ${keyword} → ${items.length}`);
      await sleep(1100); // respect CJ QPS limit (1 request/second)
    } catch (err) {
      console.warn(`[cj pool] "${keyword}" failed: ${err.message}`);
      // keep going — a single keyword failure shouldn't sink the whole pool
    }
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
export async function getPool() {
  const cached = await cacheGet(POOL_KEY);
  if (cached && cached.length) return cached;
  return buildPool();
}

export { POOL_KEY };