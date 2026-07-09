import express from "express";
import {
  getOrders,
  getOrder,
  placeCodOrder,
  getMyOrders,
  retryCjSync,
  retryAllCjSyncs,
  cancelOrder,
  requestReturn,
  adminListReturns,
  adminResolveReturn,
  adminMarkRefunded,
  reconcileReport,
  reconcileRun,
  adminUpdateStatus,
  adminSyncProducts,
  adminListAllOrders,
} from "../controllers/orderController.js";
import { authRequired, adminRequired } from "../middleware/auth.js";

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

// User: cancel + return
router.post("/:id/cancel", authRequired, cancelOrder);
router.post("/:id/return", authRequired, requestReturn);

// Admin: returns/cancellations dashboard
router.get("/admin/returns", adminRequired, adminListReturns);
router.post("/admin/:id/resolve-return", adminRequired, adminResolveReturn);
router.post("/admin/:id/refunded", adminRequired, adminMarkRefunded);

// Admin: Mongo↔CJ reconciliation
router.get("/admin/reconcile/report", adminRequired, reconcileReport);
router.post("/admin/reconcile/run", adminRequired, reconcileRun);
router.post("/admin/:id/status", adminRequired, adminUpdateStatus);
router.post("/admin/products/sync", adminRequired, adminSyncProducts);
router.get("/admin/all", adminRequired, adminListAllOrders);

export default router;