import { getCJProductsV2 } from "../services/cjProductService.js";
import { transformCJLive } from "../transformers/cjLiveTransformer.js";

/**
 * GET /api/cj/search — live CJ search passthrough (no DB writes).
 */
export async function searchProducts(req, res) {
  try {
    const { products, relatedCategories } = await getCJProductsV2({
      keyWord: req.query.keyWord || req.query.q || "",
      page: req.query.page || 1,
      size: req.query.size || 20,
    });
    const transformed = (products || []).map((p) => transformCJLive(p));
    res.json({ success: true, products: transformed, relatedCategories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Import is removed — CJ is now the live source of truth and products are no
 * longer stored in MongoDB. Endpoint kept as a clear 410 so old callers get a
 * meaningful response instead of a crash.
 */
export async function importProduct(_req, res) {
  res.status(410).json({
    success: false,
    message: "Product import has been removed. Products are served live from CJ.",
  });
}