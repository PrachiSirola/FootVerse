import { getRedis, isReady } from "../config/redisClient.js";

export const PRODUCT_TTL = 3600;        // 1 hour
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
export async function invalidateProductCache() {
  if (!isReady()) return;
  try {
    const keys = await getRedis().keys(`${PRODUCT_PREFIX}*`);
    if (keys.length) {
      await getRedis().del(keys);
    }
    console.log(`[cache INVALIDATE] ${keys.length} product key(s) cleared`);
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