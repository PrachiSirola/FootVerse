import api from "./api";

/**
 * Live product search. Uses the real backend catalogue (/products/search) as the
 * ONLY source. If the backend returns no matches (or is unreachable), we return
 * an empty array so the UI shows "No products found" — we deliberately do NOT
 * fall back to any bundled/demo catalogue, which previously surfaced phantom
 * products with incorrect prices.
 */
export async function searchProducts(query) {
  const q = (query || "").trim();
  if (!q) return [];

  try {
    const r = await api.get("/products/search", { params: { q, limit: 8 } });
    return r.data.products || [];
  } catch (err) {
    console.error("[search] backend search failed:", err?.message || err);
    return [];
  }
}