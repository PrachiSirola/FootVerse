/**
 * Transforms a raw CJ product into the exact shape the FootVerse frontend
 * already expects (matching the old MongoDB documents), so nothing on the
 * frontend has to change.
 *
 * Frontend reads: _id, name, brand, category, categoryName, subcategory,
 * price, comparePrice, images:[{url,isPrimary}], variants, rating, stock, etc.
 */
export function transformCJLive(raw, category = "", subcategory = "") {
  const price = Number(String(raw.sellPrice ?? "").split("--")[0].trim()) || 0;

  return {
    // Use the CJ product id as the stable id the frontend routes on.
    _id: raw.id || raw.pid || raw.productId,
    id: raw.id || raw.pid || raw.productId,

    source: "cj",
    sku: raw.sku || "",
    name: raw.nameEn || raw.productNameEn || raw.name || "Unnamed Product",
    brand: raw.brandName || "",

    category,
    categoryName: category,
    subcategory,

    description: raw.description || raw.productDescription || "",

    price,
    comparePrice: null,
    discount: 0,

    rating: 0,
    reviews: 0,

    stock: raw.warehouseInventoryNum ?? raw.inventoryNum ?? 0,
    inStock: (raw.warehouseInventoryNum ?? 1) > 0,

    featured: false,      // set later by the pool builder (top slice)
    bestseller: false,
    newArrival: true,
    active: true,

    images: [
      { url: raw.bigImage || raw.productImage || raw.image || "", isPrimary: true },
    ].filter((i) => i.url),

    variants: [], // CJ list endpoint doesn't return variants; detail call fills these

    createdAt: raw.createAt || raw.createdAt || new Date().toISOString(),
  };
}