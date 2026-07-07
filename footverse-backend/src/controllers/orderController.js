import {
  getAllOrders,
  getOrderById,
} from "../services/orderService.js";

export async function getOrders(req, res) {
  try {
    const orders = await getAllOrders();

    res.json({
      success: true,
      orders,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}

export async function getOrder(req, res) {
  try {

    const order = await getOrderById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
}
import {
  createCodOrderForUser,
  getOrdersForUser,
} from "../services/orderService.js";

/**
 * POST /api/orders/cod   (auth required)
 * Places a Cash-on-Delivery order from the logged-in user's cart.
 */
export async function placeCodOrder(req, res) {
  try {
    const { customer = {} } = req.body || {};
    if (!customer.name || !customer.address || !customer.pin) {
      return res.status(400).json({
        success: false,
        message: "Name, address and PIN code are required.",
      });
    }
    const order = await createCodOrderForUser(req.uid, customer);
    return res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("placeCodOrder error:", err);
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/orders/my   (auth required)
 */
export async function getMyOrders(req, res) {
  try {
    const orders = await getOrdersForUser(req.uid);
    return res.json({ success: true, orders });
  } catch (err) {
    console.error("getMyOrders error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

import { syncOrderToCJ, retryFailedCjSyncs } from "../services/cjOrderService.js";

/** POST /api/orders/:id/cj-retry — manually re-sync one order to CJ. */
export async function retryCjSync(req, res) {
  try {
    const result = await syncOrderToCJ(req.params.id);
    if (result.ok) {
      return res.json({ success: true, cjOrderId: result.cjOrderId, message: "Order synced to CJ." });
    }
    return res.status(502).json({ success: false, message: result.error || "CJ sync failed." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** POST /api/orders/cj-retry-all — re-sync every failed order. */
export async function retryAllCjSyncs(req, res) {
  try {
    const results = await retryFailedCjSyncs();
    return res.json({ success: true, count: results.length, results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}