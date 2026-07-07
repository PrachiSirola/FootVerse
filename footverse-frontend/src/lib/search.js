import api from "./api";
import { PRODUCTS } from "@/data/products";

/**
 * Live search. Tries the backend (/products/search) which itself falls back to
 * the bundled catalogue; if the API is unreachable we search the local
 * catalogue right here so the box always returns something.
 */
export async function searchProducts(query) {
  const q = (query || "").trim();
  if (!q) return [];

  try {
    const r = await api.get("/products/search", { params: { q, limit: 8 } });
    return r.data.products || [];
  } catch {
    const needle = q.toLowerCase();
    return PRODUCTS.filter((p) =>
      `${p.name} ${p.brand} ${p.categoryName} ${p.subcategory}`.toLowerCase().includes(needle),
    ).slice(0, 8);
  }
}