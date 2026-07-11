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

import * as orderActions from "../services/orderActionService.js";

/* -------- USER: cancel + return -------- */
export async function cancelOrder(req, res) {
  const r = await orderActions.cancelOrder(req.params.id, {
    reason: req.body?.reason,
    by: "user",
    userId: req.uid,
  });
  if (!r.ok) return res.status(r.status || 400).json({ success: false, message: r.message });
  res.json({ success: true, message: r.message, refundNote: r.refundNote, order: r.order });
}

export async function requestReturn(req, res) {
  const r = await orderActions.requestReturn(req.params.id, {
    reason: req.body?.reason,
    comments: req.body?.comments,
    bankDetails: req.body?.bankDetails,
    userId: req.uid,
  });
  if (!r.ok) return res.status(r.status || 400).json({ success: false, message: r.message });
  res.json({ success: true, message: r.message, refundNote: r.refundNote, order: r.order });
}

/* -------- ADMIN -------- */
export async function adminListReturns(_req, res) {
  const orders = await orderActions.listReturnsAndCancellations();
  res.json({ success: true, orders });
}

export async function adminResolveReturn(req, res) {
  const r = await orderActions.resolveReturn(req.params.id, {
    decision: req.body?.decision,
    adminNote: req.body?.adminNote,
  });
  if (!r.ok) return res.status(r.status || 400).json({ success: false, message: r.message });
  res.json({ success: true, message: r.message, order: r.order });
}

export async function adminMarkRefunded(req, res) {
  const r = await orderActions.markRefunded(req.params.id, { note: req.body?.note });
  if (!r.ok) return res.status(r.status || 400).json({ success: false, message: r.message });
  res.json({ success: true, message: r.message, order: r.order });
}

import * as reconcile from "../services/reconcileService.js";

/** GET /api/orders/admin/reconcile/report — show Mongo↔CJ consistency (read-only). */
export async function reconcileReport(_req, res) {
  try {
    res.json({ success: true, ...(await reconcile.reconcileReport()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/** POST /api/orders/admin/reconcile/run — fix inconsistent orders. */
export async function reconcileRun(_req, res) {
  try {
    res.json({ success: true, ...(await reconcile.reconcileRun()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/** POST /api/orders/admin/:id/status — admin updates fulfillment status. */
export async function adminUpdateStatus(req, res) {
  const r = await orderActions.updateOrderStatus(req.params.id, {
    status: req.body?.status,
    note: req.body?.note,
  });
  if (!r.ok) return res.status(r.status || 400).json({ success: false, message: r.message });
  res.json({ success: true, message: r.message, order: r.order });
}
