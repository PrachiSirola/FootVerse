import mongoose from "mongoose";

/**
 * Product = a Mongo snapshot of a CJ product. Mongo is now the PRIMARY source of
 * truth for the storefront; Redis is a cache and CJ is the fallback/refresh source.
 *
 * _id is the CJ product id (a String), so lookups by CJ id are direct.
 */
const ProductSchema = new mongoose.Schema(
  {
    _id: { type: String }, // CJ product id
    id: { type: String, index: true },
    source: { type: String, default: "cj" },
    sku: { type: String, default: "" },
    name: { type: String, default: "Unnamed Product" },
    brand: { type: String, default: "" },

    category: { type: String, index: true, default: "" },
    categoryName: { type: String, default: "" },
    subcategory: { type: String, index: true, default: "" },

    price: { type: Number, default: 0, index: true },
    comparePrice: { type: Number, default: null },
    discount: { type: Number, default: 0 },

    stock: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },

    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: true },

    images: [{ url: String, isPrimary: Boolean }],
    variants: { type: mongoose.Schema.Types.Mixed, default: [] },
    description: { type: String, default: "" },

    // ---- sync / lifecycle tracking ----
    active: { type: Boolean, default: true },     // false = hidden from storefront
    isDeleted: { type: Boolean, default: false }, // true = CJ no longer returns it
    lastSyncedAt: { type: Date, default: Date.now },
    cjRaw: { type: mongoose.Schema.Types.Mixed }, // full CJ payload snapshot
  },
  { timestamps: true } // _id is our custom String (the CJ id) defined above
);

// Common storefront query: visible products by category/sub, sorted by price.
ProductSchema.index({ isDeleted: 1, active: 1, category: 1, subcategory: 1 });

export default mongoose.model("Product", ProductSchema);