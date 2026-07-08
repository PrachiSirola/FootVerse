/**
 * Product data access with a 3-tier read flow:
 *   MongoDB (source of truth) → Redis (cache) → CJ API (fallback/refresh)
 * On a Redis hit that missed Mongo, we write back to Mongo. On a CJ fetch,
 * we write to both Mongo and Redis. Mongo is authoritative for the storefront.
 */
import Product from "../models/Product.js";
import { getPool, buildPool } from "./cjPoolService.js";
import { cacheGet, cacheSet, PRODUCT_PREFIX } from "../utils/cache.js";

const POOL_KEY = `${PRODUCT_PREFIX}pool`;

/** Upsert an array of transformed CJ products into Mongo (source of truth). */
export async function upsertProducts(items = []) {
  if (!items.length) return { upserted: 0 };
  const ops = items
    .filter((p) => p && p._id != null && String(p._id) !== "undefined")
    .map((p) => {
      const { _id, ...rest } = p; // never put _id in $set (Mongo can't modify it)
      return {
        updateOne: {
          filter: { _id: String(_id) },
          update: {
            $set: {
              ...rest,
              isDeleted: false,
              active: true,
              lastSyncedAt: new Date(),
              cjRaw: p.cjRaw || p,
            },
            $setOnInsert: { _id: String(_id) },
          },
          upsert: true,
        },
      };
    });
  if (!ops.length) {
    console.warn("[products] upsert: no valid products (all missing _id)");
    return { upserted: 0 };
  }
  const res = await Product.bulkWrite(ops, { ordered: false });
  return { upserted: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
}

/**
 * Soft-delete products that CJ no longer returns. `presentIds` is the set of CJ
 * ids seen in the latest sync; anything active in Mongo but absent is flagged.
 */
export async function softDeleteMissing(presentIds = []) {
  if (!presentIds.length) return { deleted: 0 };
  const res = await Product.updateMany(
    { _id: { $nin: presentIds.map(String) }, isDeleted: false },
    { $set: { isDeleted: true, active: false, lastSyncedAt: new Date() } }
  );
  return { deleted: res.modifiedCount || 0 };
}

/** All visible products from Mongo (source of truth for listing/facets). */
async function fromMongo() {
  return Product.find({ isDeleted: false, active: true }).lean();
}

/**
 * Get the full product set using the tiered flow.
 *   1. MongoDB — if we have products, return them (and refresh Redis if stale).
 *   2. Redis   — if Mongo empty but Redis has the pool, save to Mongo + return.
 *   3. CJ API  — if both empty, fetch/build pool, save to Mongo + Redis, return.
 */
export async function getAllProducts() {
  // 1. MongoDB (primary)
  const mongoProducts = await fromMongo();
  if (mongoProducts.length > 0) {
    // keep Redis warm for other consumers (best-effort, non-blocking)
    cacheGet(POOL_KEY).then((cached) => {
      if (!cached) cacheSet(POOL_KEY, mongoProducts).catch(() => {});
    }).catch(() => {});
    return mongoProducts;
  }

  // 2. Redis (cache) — Mongo was empty
  const cachedPool = await cacheGet(POOL_KEY);
  if (cachedPool && cachedPool.length) {
    console.log("[products] Mongo empty → Redis hit → seeding Mongo");
    await upsertProducts(cachedPool);
    return fromMongo();
  }

  // 3. CJ API (fallback) — both empty
  console.log("[products] Mongo + Redis empty → fetching from CJ");
  const pool = await buildPool();           // builds pool + caches in Redis
  if (pool && pool.length) {
    await upsertProducts(pool);
    return fromMongo();
  }
  return [];
}

/**
 * Single product by CJ id, same tiered flow.
 *   Mongo → Redis(pool) → CJ pool build.
 */
export async function getProductById(id) {
  const key = String(id);

  // 1. MongoDB
  const doc = await Product.findOne({ _id: key, isDeleted: false }).lean();
  if (doc) return doc;

  // 2. Redis pool
  const cachedPool = await cacheGet(POOL_KEY);
  if (cachedPool && cachedPool.length) {
    const hit = cachedPool.find((p) => String(p._id) === key);
    if (hit) {
      await upsertProducts([hit]);
      return Product.findOne({ _id: key }).lean();
    }
  }

  // 3. CJ (build pool, then look again)
  const pool = await getPool();
  const hit = (pool || []).find((p) => String(p._id) === key);
  if (hit) {
    await upsertProducts([hit]);
    return Product.findOne({ _id: key }).lean();
  }
  return null;
}