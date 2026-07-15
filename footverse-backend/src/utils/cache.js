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

/* ============================================================================
 * SHARDED POOL STORAGE
 *
 * Managed Redis providers (Upstash, Render Key Value, etc.) cap the size of a
 * single value/request (often 1 MB on free tiers). The full product pool as one
 * JSON blob exceeds that once the catalog grows past a few thousand products, so
 * the write is REJECTED — silently, because cacheSetForever only warns. In prod
 * that left the storefront stuck on the tiny cold-start batch (~200 products)
 * while local (no size cap) worked fine.
 *
 * Fix: store the pool as N chunks of SHARD_SIZE products each, plus a small
 * manifest recording how many shards exist. No single write is ever large, so
 * there is no practical ceiling on catalog size. Readers reassemble the array;
 * every existing caller keeps working with a plain product array.
 * ==========================================================================*/

// Products per shard. 500 × ~1.5 KB/product ≈ 0.7 MB — safely under a 1 MB cap
// with headroom. Override per-provider via env if needed.
export const POOL_SHARD_SIZE = Number(process.env.POOL_SHARD_SIZE || 500);

/** Manifest key for a given base pool key, e.g. fv:products:pool → …:manifest */
function manifestKey(baseKey) {
  return `${baseKey}:manifest`;
}
function shardKey(baseKey, i) {
  return `${baseKey}:shard:${i}`;
}

/**
 * Write an array as size-bounded shards under `baseKey`. No TTL (pool must not
 * expire). Returns { ok, shards, count }. Unlike cacheSetForever this reports
 * failure so the caller/logs can SEE a rejected write instead of silently
 * serving a stale partial pool.
 */
export async function savePoolShards(baseKey, arr) {
  if (!isReady()) return { ok: false, shards: 0, count: 0, reason: "redis not ready" };
  const items = Array.isArray(arr) ? arr : [];
  const shardCount = Math.max(1, Math.ceil(items.length / POOL_SHARD_SIZE));
  try {
    const r = getRedis();

    // How many shards existed before (so we can delete leftovers if the catalog
    // shrank — otherwise stale shards would be reassembled into the new pool).
    let prevCount = 0;
    try {
      const prev = await r.get(manifestKey(baseKey));
      if (prev) prevCount = JSON.parse(prev)?.shards || 0;
    } catch { /* no prior manifest */ }

    // Write each shard. If ANY shard write throws (e.g. still over the size
    // cap), abort loudly — do NOT leave a half-written pool that reassembles
    // into a corrupt/short array.
    for (let i = 0; i < shardCount; i++) {
      const chunk = items.slice(i * POOL_SHARD_SIZE, (i + 1) * POOL_SHARD_SIZE);
      const payload = JSON.stringify(chunk);
      const bytes = Buffer.byteLength(payload, "utf8");
      if (bytes > 900 * 1024) {
        // A single shard is still near the 1 MB cap — shrink POOL_SHARD_SIZE.
        console.warn(
          `[cache SHARD] ${shardKey(baseKey, i)} is ${(bytes / 1024).toFixed(0)} KB — ` +
          `close to the 1 MB cap. Lower POOL_SHARD_SIZE (currently ${POOL_SHARD_SIZE}).`
        );
      }
      await r.set(shardKey(baseKey, i), payload);
    }

    // Publish the manifest LAST — a reader that sees the manifest is guaranteed
    // all shards it points to are already written.
    await r.set(manifestKey(baseKey), JSON.stringify({ shards: shardCount, count: items.length, savedAt: Date.now() }));

    // Clean up any now-unused higher-numbered shards from a previous larger pool.
    for (let i = shardCount; i < prevCount; i++) {
      await r.del(shardKey(baseKey, i));
    }

    console.log(`[cache SHARD] saved ${items.length} items to ${baseKey} across ${shardCount} shard(s)`);
    return { ok: true, shards: shardCount, count: items.length };
  } catch (err) {
    console.error(`[cache SHARD ERROR] savePoolShards ${baseKey}: ${err.message}`);
    return { ok: false, shards: 0, count: 0, reason: err.message };
  }
}

/**
 * Reassemble a sharded array written by savePoolShards. Returns null if there is
 * no manifest (nothing stored) so callers can distinguish "empty" from "missing".
 * Falls back to a legacy single-blob value at baseKey (pre-sharding data), so an
 * in-place upgrade keeps serving until the next save re-shards it.
 */
export async function loadPoolShards(baseKey) {
  if (!isReady()) return null;
  try {
    const r = getRedis();
    const manifestRaw = await r.get(manifestKey(baseKey));

    if (!manifestRaw) {
      // Legacy path: a pre-sharding single blob may still be at baseKey.
      const legacy = await r.get(baseKey);
      if (legacy != null) {
        console.log(`[cache SHARD] no manifest for ${baseKey} — reading legacy single blob`);
        try { return JSON.parse(legacy); } catch { return null; }
      }
      return null;
    }

    const { shards } = JSON.parse(manifestRaw);
    const out = [];
    for (let i = 0; i < shards; i++) {
      const raw = await r.get(shardKey(baseKey, i));
      if (raw == null) {
        // A shard is missing — the pool is incomplete/corrupt. Report empty
        // rather than a silently-short array.
        console.warn(`[cache SHARD] ${shardKey(baseKey, i)} missing — pool incomplete`);
        return null;
      }
      const part = JSON.parse(raw);
      if (Array.isArray(part)) out.push(...part);
    }
    console.log(`[cache SHARD] loaded ${out.length} items from ${baseKey} (${shards} shard(s))`);
    return out;
  } catch (err) {
    console.warn(`[cache SHARD ERROR] loadPoolShards ${baseKey}: ${err.message}`);
    return null;
  }
}

/** Delete a sharded pool (all shards + manifest + any legacy blob). */
export async function deletePoolShards(baseKey) {
  if (!isReady()) return;
  try {
    const r = getRedis();
    let shards = 0;
    const manifestRaw = await r.get(manifestKey(baseKey));
    if (manifestRaw) shards = JSON.parse(manifestRaw)?.shards || 0;
    const keys = [baseKey, manifestKey(baseKey)];
    for (let i = 0; i < shards; i++) keys.push(shardKey(baseKey, i));
    await r.del(keys);
  } catch (err) {
    console.warn(`[cache SHARD ERROR] delete ${baseKey}: ${err.message}`);
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
  `${PRODUCT_PREFIX}pool:lastComplete`, // was NOT protected before — a bug: a
                                        // response-cache clear could wipe the
                                        // safe fallback pool.
]);

/**
 * True for any key that is part of the pool itself (base, meta, progress,
 * lastComplete) OR a shard/manifest of one. These must survive a response-cache
 * clear. Uses a prefix test so ALL shard keys (…:shard:N) and manifests
 * (…:manifest) are covered without enumerating them.
 */
function isPoolKey(k) {
  if (POOL_KEYS.has(k)) return true;
  // fv:products:pool:*  covers pool:shard:N, pool:manifest, pool:lastComplete:*
  return k.startsWith(`${PRODUCT_PREFIX}pool:`) || k === `${PRODUCT_PREFIX}pool`;
}

export async function invalidateProductCache() {
  if (!isReady()) return;
  try {
    const all = await getRedis().keys(`${PRODUCT_PREFIX}*`);
    // Response caches only — never the pool or any of its shards.
    const keys = all.filter((k) => !isPoolKey(k));
    if (keys.length) {
      await getRedis().del(keys);
    }
    console.log(`[cache INVALIDATE] ${keys.length} product response key(s) cleared (pool + shards kept)`);
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