import express from "express";
import { searchProducts } from "../controllers/searchController.js";
import { cacheRoute } from "../middleware/cache.js";

const router = express.Router();
router.get("/", cacheRoute(), searchProducts);

export default router;