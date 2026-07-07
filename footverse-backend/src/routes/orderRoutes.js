import express from "express";
import {
  getOrders,
  getOrder,
  placeCodOrder,
  getMyOrders,
  retryCjSync,
  retryAllCjSyncs,
} from "../controllers/orderController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Authenticated user endpoints
router.post("/cod", authRequired, placeCodOrder);
router.get("/my", authRequired, getMyOrders);

// Admin / lookup
router.get("/", getOrders);
router.get("/:id", getOrder);

// CJ sync retry (manual)
router.post("/cj-retry-all", authRequired, retryAllCjSyncs);
router.post("/:id/cj-retry", authRequired, retryCjSync);

export default router;