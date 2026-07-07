import { PRODUCTS } from "@/data/products";

export const PAGE_SIZE = 12;

/** Read a params object (from useSearchParams) into plain criteria. */
export function readCriteria(sp) {
  return {
    q: sp.get("q") || "",
    category: sp.get("category") || "",
    sub: sp.get("sub") || "",
    brands: (sp.get("brand") || "").split(",").filter(Boolean),
    min: Number(sp.get("min")) || 0,
    max: Number(sp.get("max")) || 0,
    sizes: (sp.get("size") || "").split(",").filter(Boolean),
    colors: (sp.get("color") || "").split(",").filter(Boolean),
    rating: Number(sp.get("rating")) || 0,
    discount: Number(sp.get("discount")) || 0,
    stock: sp.get("stock") === "1",
    sort: sp.get("sort") || "featured",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

export function applyFilters(c) {
  let list = PRODUCTS.filter((p) => {
    if (c.q) {
      const q = c.q.toLowerCase();
      const hay = `${p.name} ${p.brand} ${p.categoryName} ${p.subcategory}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (c.category && p.category !== c.category) return false;
    if (c.sub && p.subcategory !== c.sub) return false;
    if (c.brands.length && !c.brands.includes(p.brand)) return false;
    if (c.min && p.price < c.min) return false;
    if (c.max && p.price > c.max) return false;
    if (c.sizes.length && !c.sizes.some((s) => p.sizes.includes(s))) return false;
    if (c.colors.length && !c.colors.some((s) => p.colors.includes(s))) return false;
    if (c.rating && p.rating < c.rating) return false;
    if (c.discount && p.discount < c.discount) return false;
    if (c.stock && !p.inStock) return false;
    return true;
  });

  switch (c.sort) {
    case "price-asc": list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    case "rating": list.sort((a, b) => b.rating - a.rating); break;
    case "discount": list.sort((a, b) => b.discount - a.discount); break;
    case "newest": list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    default: list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(c.page, pages);
  return { items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, pages, page };
}