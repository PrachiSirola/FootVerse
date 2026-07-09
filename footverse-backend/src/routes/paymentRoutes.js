import express from "express";

import {
  checkout,
  verifyPayment,
  stripeWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-checkout-session", checkout);

// NEW
router.get("/session/:sessionId", verifyPayment);
// Stripe webhook fallback (finalizes even if the redirect never happens).
router.post("/webhook", stripeWebhook);

export default router;