import { getRedis, isReady } from "../config/redisClient.js";

// Cached API RESPONSES (listings, facets…). The catalogue itself only changes
// when a sync completes — and that explicitly invalidates these keys — so a short
// TTL just meant the first visitor after each hour paid the full re-computation
// cost. Longer TTL = far fewer slow requests; correctness is preserved because a
// completed sync clears them.
export const PRODUCT_TTL = Number(process.env.PRODUCT_RESPONSE_TTL || 6 * 3600); // 6 hours
export const PRODUCT_PREFIX = "fv:products:"; // all product-cache keys share this

/** Read JSON from cache. Returns null on miss, error, or Redis-down. */
export async function cacheGet(key) {
  if (!isReady()) return null;
  try {
    const raw = await getRedis().get(key);
    if (raw == null) {
      console.log(`[cache MISS] ${key}`);
      return null;
    }
    console.log(`[cache HIT] ${key}`);
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[cache ERROR] get ${key}: ${err.message}`);
    return null;
  }
}

/** Write JSON to cache with a TTL. Never throws. */
export async function cacheSet(key, value, ttl = PRODUCT_TTL) {
  if (!isReady()) return;
  try {
    await getRedis().set(key, JSON.stringify(value), { EX: ttl });
    console.log(`[cache SET] ${key} (ttl ${ttl}s)`);
  } catch (err) {
    console.warn(`[cache ERROR] set ${key}: ${err.message}`);
  }
}

/** Delete every product-cache key. Used on any product write/import. */
/**
 * Store a value with NO expiry. Used for the product pool: it must never go
 * cold, because a cold pool means the next user falls through to CJ (1 req/sec
 * = minutes). Freshness is handled by a background refresh instead of a TTL.
 */
export async function cacheSetForever(key, value) {
  if (!isReady()) return;
  try {
    await getRedis().set(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[cache ERROR] setForever ${key}: ${err.message}`);
  }
}

/** Delete a single cache key. */
export async function cacheDel(key) {
  if (!isReady()) return;
  try {
    await getRedis().del(key);
  } catch (err) {
    console.warn(`[cache ERROR] del ${key}: ${err.message}`);
  }
}

/**
 * Clear cached API RESPONSES (listings, facets, detail) so the storefront picks
 * up a freshly-synced pool immediately.
 *
 * IMPORTANT: this must NOT delete the pool itself. The pool keys live under the
 * same prefix, and blindly deleting `fv:products:*` wiped the pool the sync had
 * just written — leaving the catalogue and the facet counts out of step (e.g.
 * "Sandals: 228" while "All Products: 200"). Pool keys are now protected.
 */
const POOL_KEYS = new Set([
  `${PRODUCT_PREFIX}pool`,
  `${PRODUCT_PREFIX}pool:meta`,
  `${PRODUCT_PREFIX}pool:progress`,
]);

export async function invalidateProductCache() {
  if (!isReady()) return;
  try {
    const all = await getRedis().keys(`${PRODUCT_PREFIX}*`);
    // Response caches only — never the pool.
    const keys = all.filter((k) => !POOL_KEYS.has(k));
    if (keys.length) {
      await getRedis().del(keys);
    }
    console.log(`[cache INVALIDATE] ${keys.length} product response key(s) cleared (pool kept)`);
  } catch (err) {
    console.warn(`[cache ERROR] invalidate: ${err.message}`);
  }
}

/** Build a stable cache key from a request path + sorted query. */
export function keyFromRequest(req) {
  const entries = Object.entries(req.query || {}).sort(([a], [b]) => a.localeCompare(b));
  const qs = entries.map(([k, v]) => `${k}=${v}`).join("&");
  // req.baseUrl + req.path gives e.g. /api/products, /api/products/facets, /api/products/:id
  return `${PRODUCT_PREFIX}${req.baseUrl}${req.path}${qs ? `?${qs}` : ""}`;
}