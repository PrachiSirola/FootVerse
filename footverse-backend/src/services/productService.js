/**
 * CJ-sourced product service. Same function signatures + return shapes as the
 * old MongoDB version, so controllers and the frontend are untouched — but data
 * now comes from the hourly CJ pool (cached in Redis) and is filtered/faceted
 * in memory. Single product detail hits CJ's detail API by CJ id.
 */
import { getPool } from "./cjPoolService.js";
import { getCJProductsV2 } from "./cjProductService.js";
import { transformCJLive } from "../transformers/cjLiveTransformer.js";
import { apiClient } from "../utils/apiClient.js";
import CJ_CONFIG from "../config/cjConfig.js";
import { cacheGet, cacheSet, PRODUCT_PREFIX } from "../utils/cache.js";
import { getAllProducts, getProductById } from "./productStore.js";

/* ---- LISTING (mirrors old getProducts filter semantics) ---- */
export const getProducts = async (query = {}) => {
  // Mongo-first (source of truth) → Redis → CJ, handled by the repository.
  let list = await getAllProducts();

  if (query.category) list = list.filter((p) => p.category === query.category);
  if (query.sub) list = list.filter((p) => p.subcategory === query.sub);
  if (query.featured === "true" || query.featured === true) list = list.filter((p) => p.featured);

  if (query.q) {
    const rx = new RegExp(String(query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    list = list.filter((p) => rx.test(`${p.name} ${p.brand} ${p.category} ${p.subcategory}`));
  }

  // price range
  const min = Number(query.min) || 0;
  const max = Number(query.max) || 0;
  if (min) list = list.filter((p) => p.price >= min);
  if (max) list = list.filter((p) => p.price <= max);

  // sort (same keys the frontend already sends)
  switch (query.sort) {
    case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
    case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
    case "newest": list = [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))); break;
    default: break;
  }

  // ---- pagination (15 per page — the storefront default) ----
  const total = list.length;
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 15)); // 15/page default, hard cap 100
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.max(1, Math.min(totalPages, Number(query.page) || 1));
  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);

  return {
    items,
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/** Strip HTML tags/entities → clean plain text (CJ descriptions are raw HTML). */
function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>/g, " ")           // tags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")               // collapse whitespace
    .trim();
}


/**
 * Generate a clean, professional product description from the product's name,
 * category and subcategory - used instead of CJ's raw HTML marketing copy.
 */
function generateDescription(product) {
  const name = product && product.name ? product.name : "This pair";
  const cat = (product && product.category ? product.category : "").toLowerCase();
  const sub = (product && product.subcategory ? product.subcategory : "").toLowerCase();

  let opener;
  if (cat.includes("women")) opener = name + " blends an elegant silhouette with all-day comfort.";
  else if (cat.includes("kids")) opener = name + " is built for active kids - lightweight, durable and easy to wear.";
  else if (cat.includes("men")) opener = name + " pairs everyday durability with a refined, versatile design.";
  else opener = name + " is crafted to balance comfort, durability and style.";

  let mid;
  if (sub.includes("sneaker") || sub.includes("running") || sub.includes("sport") || sub.includes("training"))
    mid = "A cushioned footbed and breathable upper keep you comfortable through long days and active sessions, while a grippy outsole delivers confident traction on any surface.";
  else if (sub.includes("formal") || sub.includes("loafer"))
    mid = "A clean profile and premium finish make it easy to dress up, with a supportive insole that keeps you comfortable from the office to evening plans.";
  else if (sub.includes("boot"))
    mid = "Sturdy construction and a rugged sole offer dependable support and grip, while the padded collar adds comfort for all-day wear.";
  else if (sub.includes("sandal") || sub.includes("slipper"))
    mid = "A soft, contoured footbed and flexible sole make it effortless to slip on for relaxed, everyday comfort.";
  else if (sub.includes("heel") || sub.includes("flat"))
    mid = "A flattering shape and cushioned base bring together style and comfort so you can wear it from morning to evening.";
  else
    mid = "Quality materials, a comfortable fit and a durable sole make it a dependable choice for everyday wear.";

  const closer = "Thoughtfully made with attention to detail, it is a reliable addition to your everyday rotation.";
  return opener + " " + mid + " " + closer;
}

/**
 * Parse a CJ variantKey like "Black-Size39" or "Coffee-39" into { color, size }.
 * Falls back gracefully for odd formats like "10style-37".
 */
function parseVariantKey(key) {
  const raw = String(key || "").trim();
  if (!raw) return { color: "", size: "" };
  const parts = raw.split("-");
  let color = parts[0] || "";
  let sizePart = parts.slice(1).join("-") || "";
  // size = digits found in the size part (e.g. "Size39" → "39", "37" → "37")
  const sizeMatch = sizePart.match(/\d+/);
  const size = sizeMatch ? sizeMatch[0] : "";
  // clean color: drop leading digits/"style" noise if present ("10style" → "")
  if (/^\d/.test(color) || /style/i.test(color)) color = color.replace(/\d+/g, "").replace(/style/i, "").trim();
  return { color: color, size };
}

/* ---- SINGLE PRODUCT (CJ detail API by CJ id, cached) ---- */
export const getProduct = async (id) => {
  const key = `${PRODUCT_PREFIX}detail:${id}`;
  const cached = await cacheGet(key);
  if (cached) return cached;

  // Mongo-first (source of truth) → Redis → CJ, via the repository.
  const fromPool = await getProductById(id);

  let product = fromPool || null;

  // Enrich with CJ detail (description, variants) when possible.
  try {
    const detail = await apiClient.get(`${CJ_CONFIG.PRODUCT.DETAILS}?pid=${encodeURIComponent(id)}`);
    if (detail) {
      const t = transformCJLive(detail, fromPool?.category || "", fromPool?.subcategory || "");
      // Keep the working price from the pool; CJ detail sometimes lacks a clean price.
      const goodPrice = Number(fromPool?.price) || Number(t.price) || 0;
      product = { ...(fromPool || {}), ...t, _id: id, id, price: goodPrice };

      // Professional auto-generated description (replaces CJ raw HTML copy).
      product.description = generateDescription(product);

      // Parse CJ variants into clean color + size, dedupe.
      if (Array.isArray(detail.variants) && detail.variants.length) {
        const seen = new Set();
        const clean = [];
        for (const v of detail.variants) {
          const { color, size } = parseVariantKey(v.variantKey);
          const dedupeKey = `${color}|${size}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);
          clean.push({
            color,
            size,
            vid: v.vid || "",
            variantSku: v.variantSku || "",
            price: Number(v.variantSellPrice) || goodPrice,
          });
        }
        product.variants = clean;
      } else {
        product.variants = [];
      }
    }
  } catch (err) {
    // CJ detail failed — fall back to the pool entry (option 3 from your choices)
    if (!product) throw err;
  }

  if (product) await cacheSet(key, product);
  return product;
};

/* ---- FACETS (in-memory category→sub tree with counts) ---- */
export const getFacets = async () => {
  const pool = await getAllProducts();
  const map = new Map();
  for (const p of pool) {
    const cat = p.category || "Other";
    const sub = p.subcategory || "Other";
    if (!map.has(cat)) map.set(cat, { name: cat, count: 0, subMap: new Map() });
    const e = map.get(cat);
    e.count += 1;
    e.subMap.set(sub, (e.subMap.get(sub) || 0) + 1);
  }
  return [...map.values()].map((c) => ({
    name: c.name,
    count: c.count,
    subs: [...c.subMap.entries()].map(([name, count]) => ({ name, count })),
  }));
};

/* ---- RELATED (same category/sub, in-memory) ---- */
export const getRelated = async (id, limit = 4) => {
  const pool = await getAllProducts();
  const base = pool.find((p) => String(p._id) === String(id));
  if (!base) return [];
  return pool
    .filter((p) => String(p._id) !== String(id) && (p.subcategory === base.subcategory || p.category === base.category))
    .slice(0, limit);
};

/* ---- Writes are no longer supported (CJ is the source of truth) ---- */
const readOnly = () => {
  const e = new Error("Products are sourced live from CJ and are read-only.");
  e.status = 405;
  throw e;
};
export const createProduct = readOnly;
export const updateProduct = readOnly;
export const deleteProduct = readOnly;