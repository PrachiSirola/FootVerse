import express from "express";
import { adminRequired } from "../middleware/auth.js";
import * as a from "../controllers/adminController.js";

const router = express.Router();

// Everything here is admin-only.
router.use(adminRequired);

// Dashboard
router.get("/dashboard", a.dashboard);

// Users
router.get("/users", a.users);
router.get("/users/:id", a.userDetail);
router.post("/users/:id/wallet", a.walletAdjust);

// Orders
router.get("/orders", a.orders);
router.get("/orders/analytics", a.orderAnalytics);
router.get("/orders/:id", a.orderDetail);
router.post("/orders/:id/status", a.orderStatusUpdate);

// Return requests (dedicated section)
router.get("/returns", a.returnsList);
router.post("/returns/:id/resolve", a.returnResolve);

// Customer issues
router.get("/issues", a.issueList);
router.get("/issues/:id", a.issueDetail);
router.post("/issues/:id/reply", a.issueReply);
router.patch("/issues/:id", a.issueUpdate);

// Commission & finance
router.get("/finance/summary", a.financeSummary);
router.get("/finance/settings", a.financeSettingsGet);
router.patch("/finance/settings", a.financeSettingsUpdate);

// Hero banner CMS
router.get("/cms/hero", a.heroGet);
router.patch("/cms/hero", a.heroUpdate);

export default router;