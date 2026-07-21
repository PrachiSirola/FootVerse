// Use productStore, not cjPoolService.getPool(): getPool() falls through to a
// LIVE CJ crawl on a cache miss, which made search take many seconds. The store
// serves from the in-process memory cache / Redis and never blocks on CJ.
import { getAllProducts } from "../services/productStore.js";

/**
 * GET /api/products/search?q=...&limit=8
 * Searches the cached CJ pool (live product data).
 *
 * Multi-word AND matching with WORD BOUNDARIES: every word in the query must
 * appear as a whole word somewhere in the product's name/brand/category/
 * subcategory. Word boundaries are essential — a substring match made "men"
 * match inside "women", so "men sneakers" wrongly returned every women's
 * sneaker. Each product carries its category ("Men"/"Women"/"Kids"/"Sports")
 * as a field, so a gender word in the query filters correctly.
 */
export async function searchProducts(req, res) {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
  if (!q) return res.json({ success: true, products: [], source: "empty" });

  try {
    // Split the query into words; build a whole-word regex per word.
    const words = q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}\\b`, "i");
      });

    if (words.length === 0) {
      return res.json({ success: true, products: [], source: "empty" });
    }

    const pool = await getAllProducts();
    const products = pool
      .filter((p) => {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.subcategory}`;
        // AND semantics: every query word must match somewhere.
        return words.every((rx) => rx.test(hay));
      })
      .slice(0, limit);

    return res.json({ success: true, products, source: "cj" });
  } catch (err) {
    console.error("search error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}