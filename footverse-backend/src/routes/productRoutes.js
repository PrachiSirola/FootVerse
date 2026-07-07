import express from "express";
import {
  getProducts, getFacets, getProduct, getRelated,
  createProduct, updateProduct, deleteProduct,
} from "../controllers/productController.js";
import { cacheRoute } from "../middleware/cache.js";

const router = express.Router();

// Reads (cached, CJ-sourced)
router.get("/", cacheRoute(), getProducts);
router.get("/facets", cacheRoute(), getFacets);
router.get("/:id/related", cacheRoute(), getRelated);
router.get("/:id", cacheRoute(), getProduct);

// Writes disabled (CJ is the source of truth)
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;