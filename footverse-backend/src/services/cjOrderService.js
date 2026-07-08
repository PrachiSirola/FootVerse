import CJ_CONFIG from "../config/cjConfig.js";
import { apiClient } from "../utils/apiClient.js";
import Order from "../models/Order.js";

/**
 * CJ Dropshipping order sync.
 *
 * Flow: for each order line, call CJ's product-detail API to resolve the CJ
 * variant id (vid) that matches the saved size/color, build the CJ createOrder
 * payload, submit it, and record cjOrderId / cjOrderStatus / cjSyncStatus back
 * on the Mongo order. Never throws to the caller — failures are recorded as
 * "CJ Sync Failed" so the order stays intact and can be retried.
 */

// Minimal India country code for CJ (adjust if you ship elsewhere).
const DEFAULT_COUNTRY = "IN";
const FALLBACK_LOGISTICS = "CJPacket Ordinary";

/** Common country name → ISO-2 code (CJ wants the code). Falls back to IN. */
const COUNTRY_CODES = {
  india: "IN", "united states": "US", usa: "US", us: "US", uk: "GB",
  "united kingdom": "GB", canada: "CA", australia: "AU", germany: "DE",
  france: "FR", italy: "IT", spain: "ES", netherlands: "NL", "united arab emirates": "AE",
  uae: "AE", singapore: "SG", malaysia: "MY", "new zealand": "NZ", japan: "JP",
  "saudi arabia": "SA", "south africa": "ZA", brazil: "BR", mexico: "MX",
};
function countryCode(name) {
  if (!name) return DEFAULT_COUNTRY;
  const key = String(name).trim().toLowerCase();
  return COUNTRY_CODES[key] || (name.length === 2 ? name.toUpperCase() : DEFAULT_COUNTRY);
}

/**
 * Ask CJ which logistics options are valid for this destination + products, and
 * return the CHEAPEST valid one's name. Falls back to a default if the call
 * fails, so an order never gets blocked purely on shipping lookup.
 */
async function pickCheapestLogistics({ countryCode, products, zip }) {
  if (!CJ_CONFIG.SHIPPING.CALCULATE) {
    console.warn("[cj order] freight endpoint missing in cjConfig (ORDER.CALCULATE undefined) — using fallback logistics");
    return null;
  }
  try {
    const body = {
      startCountryCode: "CN",
      endCountryCode: countryCode,
      zip: zip || "",
      products: products.map((p) => ({
        quantity: p.quantity,
        vid: p.vid,
      })),
    };
    const res = await cjGetPost(CJ_CONFIG.SHIPPING.CALCULATE, body);
    const options = Array.isArray(res) ? res : res?.data || res?.freightList || [];
    if (!options.length) return null;
    // each option ~ { logisticName, logisticPrice/logisticAmount, ... }
    const priced = options
      .map((o) => ({
        name: o.logisticName || o.logisticServiceName || o.name,
        price: Number(o.logisticPrice ?? o.logisticAmount ?? o.freight ?? 0),
      }))
      .filter((o) => o.name);
    if (!priced.length) return null;
    priced.sort((a, b) => a.price - b.price);
    console.log(`[cj order] freight options: ${priced.map((p) => `${p.name}($${p.price})`).join(", ")}`);
    return priced[0].name;
  } catch (err) {
    console.warn(`[cj order] freight calculate failed: ${err.message} — using fallback logistics`);
    return null;
  }
}

/** POST helper with the same rate-limit backoff as cjGetWithRetry. */
async function cjGetPost(endpoint, body, tries = 3) {
  let lastErr;
  for (let a = 1; a <= tries; a++) {
    try {
      return await apiClient.post(endpoint, body);
    } catch (err) {
      lastErr = err;
      const rl = /too many requests|qps limit|frequently/i.test(err.message || "");
      if (!rl || a === tries) throw err;
      await new Promise((r) => setTimeout(r, 1200 * a));
    }
  }
  throw lastErr;
}


/** A legacy MongoDB _id is 24 hex chars; CJ product ids are long numeric strings. */
function isLegacyMongoId(id) {
  return /^[a-f0-9]{24}$/i.test(String(id || ""));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * CJ allows only 1 request/second. When a call is rate-limited ("Too Many
 * Requests"), wait and retry with backoff instead of failing the sync.
 */
async function cjGetWithRetry(endpoint, tries = 4) {
  let lastErr;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await apiClient.get(endpoint);
    } catch (err) {
      lastErr = err;
      const rateLimited = /too many requests|qps limit|frequently/i.test(err.message || "");
      if (!rateLimited || attempt === tries) throw err;
      const wait = 1200 * attempt; // 1.2s, 2.4s, 3.6s…
      console.warn(`[cj order] rate-limited (attempt ${attempt}/${tries}) — waiting ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}



/** Try to find the CJ variant id for a line, from its size/color. */
/**
 * Resolve the CJ variant for an order line from the customer's saved size/color.
 * CJ variantKey looks like "Black-Size39" / "White-Size39" (Color-SizeNN), and
 * variantSku like "CJNS1583554-Black-Size39". We match on both color and the
 * numeric size, and return { vid, variantSku } — CJ's order API accepts either.
 */
function normalize(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Pull just the digits from a size like "UK 8" / "Size39" / "39" → "39" / "8". */
function sizeDigits(str) {
  const m = String(str || "").match(/\d+/);
  return m ? m[0] : "";
}

async function resolveVariant(item) {
  // Simplified: always use the product's FIRST variant (ignore size/color).
  // CJ still requires a vid, so we fetch the product and take variant[0].
  try {
    const detail = await cjGetWithRetry(
      `${CJ_CONFIG.PRODUCT.DETAILS}?pid=${encodeURIComponent(item.productId)}`
    );
    const variants = detail?.variants || detail?.variantList || [];
    if (!variants.length) return { vid: null, variantSku: null };
    const first = variants[0];
    return {
      vid: first?.vid || null,
      variantSku: first?.variantSku || null,
      variantKey: first?.variantKey || "",
    };
  } catch (err) {
    console.warn(`[cj order] variant lookup failed for ${item.productId}: ${err.message}`);
    return { vid: null, variantSku: null };
  }
}

/** Build the CJ createOrder request body from a Mongo order. */
async function buildCjPayload(order) {
  const products = [];
  for (const item of order.items) {
    const { vid, variantSku, variantKey } = await resolveVariant(item);
    if (!vid && !variantSku) {
      throw new Error(`No CJ variant found for product ${item.productId}`);
    }
    console.log(`[cj order] ${item.productId} → ${variantKey} (default variant)`);
    products.push({
      vid: vid || undefined,
      variantSku: variantSku || undefined,
      quantity: item.quantity,
    });
  }

  const c = order.customer || {};
  const cc = countryCode(c.country);

  // Ask CJ for a valid, cheapest logistics option for this destination.
  const cheapest = await pickCheapestLogistics({
    countryCode: cc,
    products,
    zip: c.pin || "",
  });
  const logisticName = cheapest || FALLBACK_LOGISTICS;
  console.log(`[cj order] logistics for ${cc}: ${logisticName}${cheapest ? "" : " (fallback)"}`);

  // Basic order + customer + shipping info. Size/color are NOT sent — CJ uses
  // the default variant chosen above.
  return {
    orderNumber: order.orderNumber,
    shippingCountryCode: cc,
    shippingCountry: c.country || "India",
    shippingProvince: c.state || "",
    shippingCity: c.city || "",
    shippingAddress: c.address || "",
    shippingCustomerName: c.name || "",
    shippingPhone: c.phone || "",
    shippingZip: c.pin || "",
    email: c.email || "",
    remark: `FootVerse ${order.orderNumber} | ${order.paymentMethod || "N/A"} | Paid: ${order.currency || "USD"} ${order.grandTotal ?? ""}`,
    fromCountryCode: "CN",
    logisticName,
    products,
  };
}

/**
 * Sync a single order to CJ. Safe: records status on the order, never throws.
 * @returns {Promise<{ok:boolean, cjOrderId?:string, error?:string}>}
 */
export async function syncOrderToCJ(orderId) {
  console.log(`[cj order] STEP 1 — looking up order ${orderId}`);
  const order = await Order.findById(orderId);
  if (!order) {
    console.error(`[cj order] ✗ order ${orderId} not found in DB`);
    return { ok: false, error: "Order not found" };
  }
  console.log(`[cj order] STEP 2 — order ${order.orderNumber}, ${order.items?.length || 0} item(s), payment ${order.paymentMethod}`);

  // Don't double-sync.
  if (order.cjSyncStatus === "Synced" && order.cjOrderId) {
    console.log(`[cj order] already synced (CJ ${order.cjOrderId}) — skipping`);
    return { ok: true, cjOrderId: order.cjOrderId };
  }

  // Legacy orders (placed on old MongoDB product ids) can never resolve a CJ
  // variant — CJ doesn't know those ids. Mark them skipped so they stop retrying.
  const hasCjItem = (order.items || []).some((i) => !isLegacyMongoId(i.productId));
  if (!hasCjItem) {
    order.cjSyncStatus = "CJ Sync Skipped";
    order.cjSyncError = "Legacy order — products predate CJ live sourcing (no CJ id).";
    await order.save();
    console.log(`[cj order] SKIPPED ${order.orderNumber} (legacy Mongo-id products)`);
    return { ok: false, skipped: true, error: "legacy order" };
  }

  try {
    console.log(`[cj order] STEP 3 — building CJ payload…`);
    const payload = await buildCjPayload(order);
    console.log(`[cj order] STEP 4 — POST ${CJ_CONFIG.ORDER.CREATE}`);
    console.log(`[cj order]   payload:`, JSON.stringify(payload));
    const data = await apiClient.post(CJ_CONFIG.ORDER.CREATE, payload);
    console.log(`[cj order] STEP 5 — CJ response:`, JSON.stringify(data));

    // CJ returns an order id (field name varies across API versions).
    const cjOrderId = data?.orderId || data?.cjOrderId || data?.id || data?.orderNum || null;

    order.cjOrderId = cjOrderId;
    order.cjOrderStatus = data?.orderStatus || "CREATED";
    order.cjSyncStatus = "Synced";
    order.cjSyncError = null;
    order.cjSyncedAt = new Date();
    await order.save();

    console.log(`[cj order] synced ${order.orderNumber} → CJ ${cjOrderId}`);
    return { ok: true, cjOrderId };
  } catch (err) {
    order.cjSyncStatus = "CJ Sync Failed";
    order.cjSyncError = err.message?.slice(0, 500) || "Unknown CJ error";
    await order.save();
    console.error(`[cj order] sync FAILED ${order.orderNumber}: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

/**
 * Fire-and-forget wrapper — call this from the checkout paths. Returns
 * immediately; the sync runs in the background and records its own status.
 */
export function syncOrderToCJInBackground(orderId) {
  console.log(`[cj order] ► sync TRIGGERED for order ${orderId} (starting in 2s)`);
  // Small delay so the order sync doesn't collide with a pool build hitting
  // CJ's 1-req/sec limit at the same moment.
  setTimeout(() => {
    syncOrderToCJ(orderId).catch((e) =>
      console.error(`[cj order] ✗ background sync error: ${e.message}`)
    );
  }, 2000);
}

/** Re-sync every order currently marked "CJ Sync Failed". */
export async function retryFailedCjSyncs() {
  const failed = await Order.find({ cjSyncStatus: "CJ Sync Failed" }).select("_id orderNumber");
  console.log(`[cj order] retrying ${failed.length} failed sync(s)`);
  const results = [];
  for (const o of failed) {
    results.push({ orderNumber: o.orderNumber, ...(await syncOrderToCJ(o._id)) });
  }
  return results;
}

/**
 * Cancel an order at CJ (used when a user cancels a synced order).
 * CJ's deleteOrder cancels an unshipped order. Safe: never throws to caller.
 */
export async function cancelOrderAtCJ(order) {
  // Legacy pre-CJ orders never synced — nothing to cancel at CJ.
  const isLegacy = (order?.items || []).every((i) => isLegacyMongoId(i.productId));
  if (isLegacy) {
    console.log(`[cj order] cancel skipped for ${order.orderNumber} (legacy pre-CJ order)`);
    return { ok: false, skipped: true, reason: "legacy order" };
  }
  if (!order?.cjOrderId) return { ok: false, skipped: true, reason: "no CJ order id" };
  try {
    await apiClient.post(CJ_CONFIG.ORDER.DELETE, { orderId: order.cjOrderId });
    order.cjSyncStatus = "CJ Sync Skipped";
    order.cjSyncError = "Order cancelled at CJ by user request.";
    await order.save();
    console.log(`[cj order] cancelled at CJ: ${order.orderNumber} (${order.cjOrderId})`);
    return { ok: true };
  } catch (err) {
    console.warn(`[cj order] CJ cancel failed for ${order.orderNumber}: ${err.message}`);
    return { ok: false, error: err.message };
  }
}