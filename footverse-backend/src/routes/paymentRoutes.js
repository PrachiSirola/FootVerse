import express from "express";

import {
  checkout,
  verifyPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-checkout-session", checkout);

// NEW
router.get("/session/:sessionId", verifyPayment);

export default router;