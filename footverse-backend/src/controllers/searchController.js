import { getPool } from "../services/cjPoolService.js";

/**
 * GET /api/products/search?q=...&limit=8
 * Searches the cached CJ pool (live product data).
 */
export async function searchProducts(req, res) {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
  if (!q) return res.json({ success: true, products: [], source: "empty" });

  try {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const pool = await getPool();
    const products = pool
      .filter((p) => rx.test(`${p.name} ${p.brand} ${p.category} ${p.subcategory}`))
      .slice(0, limit);
    return res.json({ success: true, products, source: "cj" });
  } catch (err) {
    console.error("search error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}