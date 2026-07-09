import {
  createCheckoutSession,
  getCheckoutSession,
} from "../services/stripeService.js";

import {
  createPendingOrder,
  markOrderPaid,
} from "../services/orderService.js";

import jwt from "jsonwebtoken";

function uidFromReq(req) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme === "Bearer" && token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || "footverse-dev-secret-change-me").uid;
    } catch {
      return null;
    }
  }
  return null;
}

export async function checkout(req, res) {
  try {
    const { items, customer, shipping } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const mergedCustomer = { ...(customer || {}), ...(shipping || {}) };

    const order = await createPendingOrder({
      items,
      customer: mergedCustomer,
      userId: uidFromReq(req),
    });

    const session = await createCheckoutSession({ items, orderId: order._id });

    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await getCheckoutSession(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ success: false, message: "Payment not completed." });
    }

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.warn("[payment] verify: no orderId in session metadata", sessionId);
      return res.status(400).json({ success: false, message: "Order reference missing." });
    }

    console.log(`[payment] verify session ${sessionId} → order ${orderId} → marking paid`);
    const order = await markOrderPaid(orderId, session);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function stripeWebhook(req, res) {
  try {
    const event = req.body; // raw JSON (see route note about signature verification)
    if (event?.type === "checkout.session.completed") {
      const session = event.data?.object;
      const orderId = session?.metadata?.orderId;
      if (orderId && session.payment_status === "paid") {
        console.log(`[payment webhook] checkout.session.completed → finalizing order ${orderId}`);
        await markOrderPaid(orderId, session);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("[payment webhook] error:", err.message);
    res.status(400).json({ received: false, error: err.message });
  }
}