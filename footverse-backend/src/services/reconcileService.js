import Order from "../models/Order.js";
import { syncOrderToCJ } from "./cjOrderService.js";

const isLegacyMongoId = (id) => /^[a-f0-9]{24}$/i.test(String(id || ""));

/**
 * Classify one order's Mongo↔CJ consistency.
 * Returns a category + whether it's auto-fixable.
 */
function classify(order) {
  const legacy = (order.items || []).every((i) => isLegacyMongoId(i.productId));
  const status = order.orderStatus;
  const sync = order.cjSyncStatus;

  // Cancelled/Returned orders shouldn't be (re)synced.
  if (["Cancelled", "Returned"].includes(status)) {
    return { category: "closed", consistent: true, fixable: false };
  }
  // Legacy pre-CJ orders can never sync — consistent by design once marked skipped.
  if (legacy) {
    return {
      category: "legacy",
      consistent: sync === "CJ Sync Skipped",
      fixable: sync !== "CJ Sync Skipped", // fix = mark skipped
    };
  }
  // Successfully synced.
  if (sync === "Synced" && order.cjOrderId) {
    return { category: "synced", consistent: true, fixable: false };
  }
  // In Mongo but NOT in CJ (failed or never completed) → the drift we fix.
  if (sync === "CJ Sync Failed" || sync === "Pending" || !order.cjOrderId) {
    return { category: "mongo-only", consistent: false, fixable: true };
  }
  return { category: "unknown", consistent: false, fixable: true };
}

/**
 * Scan all active orders and report consistency. Does NOT change anything.
 * GET /api/orders/admin/reconcile/report
 */
export async function reconcileReport() {
  const orders = await Order.find({}).select(
    "orderNumber orderStatus cjSyncStatus cjOrderId cjSyncError items createdAt"
  );
  const buckets = { synced: [], "mongo-only": [], legacy: [], closed: [], unknown: [] };
  for (const o of orders) {
    const c = classify(o);
    (buckets[c.category] || buckets.unknown).push({
      orderNumber: o.orderNumber,
      orderStatus: o.orderStatus,
      cjSyncStatus: o.cjSyncStatus,
      cjOrderId: o.cjOrderId,
      consistent: c.consistent,
      fixable: c.fixable,
      error: o.cjSyncError || null,
    });
  }
  const inconsistent = orders.filter((o) => !classify(o).consistent).length;
  return {
    total: orders.length,
    inconsistent,
    counts: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
    buckets,
  };
}

/**
 * Fix inconsistent orders:
 *  - mongo-only → re-run syncOrderToCJ (creates it at CJ)
 *  - legacy not-marked → mark "CJ Sync Skipped"
 * POST /api/orders/admin/reconcile/run
 * Respects CJ's rate limit by spacing calls.
 */
export async function reconcileRun() {
  const orders = await Order.find({}).select(
    "orderNumber orderStatus cjSyncStatus cjOrderId items"
  );
  const results = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const o of orders) {
    const c = classify(o);
    if (c.consistent || !c.fixable) continue;

    if (c.category === "legacy") {
      o.cjSyncStatus = "CJ Sync Skipped";
      o.cjSyncError = "Legacy pre-CJ order — reconciled as skipped.";
      await o.save();
      results.push({ orderNumber: o.orderNumber, action: "marked-skipped" });
      console.log(`[reconcile] ${o.orderNumber} → marked skipped (legacy)`);
      continue;
    }

    // mongo-only / unknown → attempt a real CJ sync (spaced for rate limit)
    console.log(`[reconcile] ${o.orderNumber} → re-syncing to CJ…`);
    const r = await syncOrderToCJ(o._id);
    results.push({
      orderNumber: o.orderNumber,
      action: r.ok ? "synced" : "sync-failed",
      cjOrderId: r.cjOrderId || null,
      error: r.error || null,
    });
    await sleep(1500); // stay under CJ's 1 req/sec across the batch
  }

  const fixed = results.filter((r) => ["synced", "marked-skipped"].includes(r.action)).length;
  console.log(`[reconcile] done — ${fixed}/${results.length} fixed`);
  return { attempted: results.length, fixed, results };
}
