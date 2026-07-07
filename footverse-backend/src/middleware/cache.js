import { cacheGet, cacheSet, keyFromRequest, PRODUCT_TTL } from "../utils/cache.js";

/**
 * Transparent read-through cache for GET routes.
 * - HIT  → returns cached JSON immediately.
 * - MISS → lets the controller run, then caches whatever it res.json()s
 *          (only for 200 responses), before sending it on.
 * Controllers/services are untouched; if Redis is down this is a no-op.
 */
export function cacheRoute(ttl = PRODUCT_TTL) {
  return async (req, res, next) => {
    // Only cache GETs.
    if (req.method !== "GET") return next();

    const key = keyFromRequest(req);

    const hit = await cacheGet(key);
    if (hit !== null) {
      return res.json(hit);
    }

    // Wrap res.json to capture the payload on a cache miss.
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Cache only successful responses.
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, body, ttl); // fire-and-forget
      }
      return originalJson(body);
    };

    next();
  };
}