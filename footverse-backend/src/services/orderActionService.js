import Order from "../models/Order.js";
import { cancelOrderAtCJ } from "./cjOrderService.js";
import CancelledOrder from "../models/CancelledOrder.js";

/** Statuses at which a user may still CANCEL (before shipping). */
const CANCELLABLE = ["Pending", "Confirmed", "Processing", "Packed"];

const REFUND_WINDOW_NOTE =
  "Refund will be processed to your original payment method within 5–7 working days.";

function pushTimeline(order, status, note) {
  order.timeline = order.timeline || [];
  order.timeline.push({ status, note, at: new Date() });
}

/**
 * Cancel an order (user or admin). Only allowed before it ships.
 * - saves reason, sets status Cancelled
 * - restores inventory (log-only: products are CJ-sourced)
 * - cancels at CJ if it was synced there
 * - sets refund info for online payments
 */
export async function cancelOrder(orderId, { reason, by = "user", userId = null }) {
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, status: 404, message: "Order not found" };

  // Ownership check for user cancellations.
  if (by === "user" && userId && String(order.user) !== String(userId)) {
    return { ok: false, status: 403, message: "Not your order" };
  }

  if (!CANCELLABLE.includes(order.orderStatus)) {
    return {
      ok: false,
      status: 400,
      message: `Order can no longer be cancelled (status: ${order.orderStatus}).`,
    };
  }
  if (!reason) return { ok: false, status: 400, message: "Cancellation reason is required." };

  // Update cancellation record + status
  order.cancellation = { reason, cancelledAt: new Date(), cancelledBy: by };
  order.orderStatus = "Cancelled";
  pushTimeline(order, "Cancelled", `Cancelled by ${by}: ${reason}`);

  // Inventory restore — products are live from CJ, so this is a log-only no-op.
  console.log(`[order] inventory restore (log-only, CJ-sourced) for ${order.orderNumber}`);

  // Online payment → mark refund pending
  let refundNote = null;
  if (order.paymentMethod === "Stripe" && order.paymentStatus === "Paid") {
    order.refund = {
      status: "Pending",
      method: "Original Payment",
      amount: order.grandTotal,
      processedAt: null,
    };
    refundNote = REFUND_WINDOW_NOTE;
    pushTimeline(order, "Refund Pending", REFUND_WINDOW_NOTE);
  }

  await order.save();
  const dbName = order.db?.name || order.constructor.db?.name || "unknown";
  console.log(`[cancel] ${order.orderNumber} → orders collection updated to "Cancelled" ✓ (db: ${dbName})`);

  // Archive a full copy into the CancelledOrder collection.
  try {
    const archived = await CancelledOrder.create({
      originalOrderId: order._id,
      orderNumber: order.orderNumber,
      user: order.user,
      reason: order.cancellation?.reason,
      cancelledBy: order.cancellation?.cancelledBy,
      cancelledAt: order.cancellation?.cancelledAt,
      refund: {
        status: order.refund?.status,
        method: order.refund?.method,
        amount: order.refund?.amount,
      },
      snapshot: order.toObject(),
    });
    const total = await CancelledOrder.countDocuments();
    console.log(`[cancel] ${order.orderNumber} → archived to 'cancelledorders' ✓ (_id=${archived._id}, collection now has ${total})`);
  } catch (err) {
    console.error(`[cancel] ${order.orderNumber} → CancelledOrder archive FAILED: ${err.message}`);
    console.error(`[cancel] full error:`, err);
  }

  // Cancel at CJ — only if it actually synced there.
  let cjResult = "not-applicable";
  const isLegacy = /^[a-f0-9]{24}$/i.test(String(order.items?.[0]?.productId || ""));
  if (order.cjOrderId) {
    const cj = await cancelOrderAtCJ(order);
    if (cj.ok) {
      cjResult = "cancelled";
      console.log(`[cancel] ${order.orderNumber} → cancelled at CJ ✓`);
    } else {
      cjResult = "failed";
      console.warn(`[cancel] ${order.orderNumber} → CJ cancel FAILED: ${cj.error} (order still cancelled in Mongo)`);
    }
  } else if (isLegacy) {
    cjResult = "skipped-legacy";
    console.log(`[cancel] ${order.orderNumber} → CJ skipped (legacy pre-CJ order, never synced)`);
  } else {
    cjResult = "skipped-not-synced";
    console.log(`[cancel] ${order.orderNumber} → CJ skipped (order was never synced to CJ)`);
  }

  // Record the CJ outcome on the timeline for visibility.
  pushTimeline(order, "CJ Cancel", `CJ result: ${cjResult}`);
  await order.save();

  return {
    ok: true,
    order,
    refundNote,
    cjResult,
    message: "Order cancelled successfully.",
  };
}

/**
 * User submits a RETURN request (only after Delivered).
 * B2B: all orders are card (Stripe) — refunds go to the original payment method.
 */
export async function requestReturn(orderId, { reason, comments, bankDetails, contact, userId }) {
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, status: 404, message: "Order not found" };
  if (userId && String(order.user) !== String(userId)) {
    return { ok: false, status: 403, message: "Not your order" };
  }
  if (order.orderStatus !== "Delivered") {
    return { ok: false, status: 400, message: "Only delivered orders can be returned." };
  }
  if (order.returnRequest?.status && order.returnRequest.status !== "None") {
    return { ok: false, status: 400, message: "A return request already exists for this order." };
  }
  if (!reason) return { ok: false, status: 400, message: "Return reason is required." };

  // B2B: card-only, so refunds always go back to the original payment method.
  // (isCOD is retained as `false` so any legacy COD orders still resolve safely.)
  const isCOD = order.paymentMethod === "COD"; // legacy orders only
  if (isCOD) {
    const b = bankDetails || {};
    const hasUpi = !!b.upiId;
    const hasBank = b.accountName && b.accountNumber && b.ifsc;
    if (!hasUpi && !hasBank) {
      return {
        ok: false,
        status: 400,
        message: "For COD orders, provide a UPI ID or full bank details for the refund.",
      };
    }
  }

  order.returnRequest = {
    status: "Requested",
    reason,
    comments: comments || null,
    contact: contact || null,
    // Amount is taken from the ORDER (server-side truth), never from the client.
    amountPaid: order.grandTotal,
    bankDetails: isCOD ? bankDetails : {},
    requestedAt: new Date(),
    resolvedAt: null,
    adminNote: null,
  };
  order.refund = {
    status: "None",
    method: isCOD ? (bankDetails?.upiId ? "UPI" : "Bank Transfer") : "Original Payment",
    amount: order.grandTotal,
    processedAt: null,
  };
  pushTimeline(order, "Return Requested", `Reason: ${reason}`);
  await order.save();

  return {
    ok: true,
    order,
    message: "Return request submitted. We'll review it shortly.",
    refundNote: isCOD
      ? "Once approved, your refund will be sent to the bank/UPI details provided."
      : REFUND_WINDOW_NOTE + " (after approval)",
  };
}

/* ---------------- ADMIN ---------------- */

/** Admin approves or rejects a return request. */
/**
 * The B2B return state machine. Each step is only valid from the step before it,
 * so a return can't be refunded before the goods are back.
 *
 *   Requested ──approve──> Approved ──receive──> Item Received ──refund──> Refunded
 *        └────reject────> Rejected  (terminal)
 */
const RETURN_FLOW = {
  Requested: ["Approved", "Rejected"],
  Approved: ["Item Received"],
  "Item Received": ["Refunded"],
  Rejected: [],
  Refunded: [],
};

/** Admin advances a return to its next valid state. */
export async function resolveReturn(orderId, { decision, adminNote }) {
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, status: 404, message: "Order not found" };

  const current = order.returnRequest?.status;
  if (!current || current === "None") {
    return { ok: false, status: 400, message: "This order has no return request." };
  }

  const allowed = RETURN_FLOW[current] || [];
  if (!allowed.includes(decision)) {
    return {
      ok: false,
      status: 400,
      message: allowed.length
        ? `A ${current} return can only move to: ${allowed.join(" or ")}.`
        : `This return is already ${current} — no further action is possible.`,
    };
  }

  order.returnRequest.status = decision;
  order.returnRequest.adminNote = adminNote || order.returnRequest.adminNote || null;
  const note = adminNote || "";

  switch (decision) {
    case "Approved":
      order.returnRequest.approvedAt = new Date();
      // The customer is told to send the goods back; no money moves yet.
      order.refund.status = "Pending";
      pushTimeline(order, "Return Approved", note || "Approved — awaiting the returned item.");
      break;

    case "Item Received":
      order.returnRequest.itemReceivedAt = new Date();
      order.orderStatus = "Returned";           // goods are back with us
      order.refund.status = "Processing";       // now the refund can be processed
      pushTimeline(order, "Item Received", note || "Returned item received — processing the refund.");
      break;

    case "Refunded":
      order.returnRequest.resolvedAt = new Date();
      order.refund.status = "Refunded";
      order.refund.processedAt = new Date();
      pushTimeline(order, "Refunded", note || `Refund of ${order.refund?.amount ?? ""} completed.`);
      break;

    case "Rejected":
      order.returnRequest.resolvedAt = new Date();
      order.refund.status = "None";             // no money moves on a rejection
      pushTimeline(order, "Return Rejected", note || "Return request rejected.");
      break;
  }

  await order.save();
  console.log(`[return] ${order.orderNumber}: ${current} → ${decision}`);
  return { ok: true, order, message: `Return marked ${decision}.` };
}

/** Admin marks a refund as completed. */
export async function markRefunded(orderId, { note }) {
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, status: 404, message: "Order not found" };
  if (!["Pending", "Processing"].includes(order.refund?.status)) {
    return { ok: false, status: 400, message: "No refund in progress for this order." };
  }
  order.refund.status = "Refunded";
  order.refund.processedAt = new Date();
  pushTimeline(order, "Refunded", note || "Refund completed.");
  await order.save();
  return { ok: true, order, message: "Refund marked as completed." };
}

/** Admin: list all orders with a cancellation or return (for the dashboard). */
export async function listReturnsAndCancellations() {
  return Order.find({
    $or: [
      { "returnRequest.status": { $ne: "None" } },
      { orderStatus: "Cancelled" },
    ],
  })
    .sort({ updatedAt: -1 })
    .select("orderNumber orderStatus paymentMethod grandTotal cancellation returnRequest refund createdAt");
}

/** Valid forward status transitions an admin can set. */
const STATUS_FLOW = {
  Confirmed: ["Processing", "Packed", "Shipped"],
  Processing: ["Packed", "Shipped"],
  Packed: ["Shipped"],
  Shipped: ["Delivered"],
};

/**
 * Admin updates an order's fulfillment status (Processing/Packed/Shipped/Delivered).
 * Updates Mongo + timeline. CJ's own shipping status is pulled FROM CJ (not pushed),
 * so we log the change; a future CJ tracking sync can reconcile it.
 */
export async function updateOrderStatus(orderId, { status, note }) {
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, status: 404, message: "Order not found" };

  const allowed = STATUS_FLOW[order.orderStatus] || [];
  if (!allowed.includes(status)) {
    return {
      ok: false,
      status: 400,
      message: `Cannot change ${order.orderStatus} → ${status}. Allowed: ${allowed.join(", ") || "none"}.`,
    };
  }

  const prev = order.orderStatus;
  order.orderStatus = status;
  pushTimeline(order, status, note || `Status changed ${prev} → ${status} by admin.`);
  await order.save();

  console.log(`[order status] ${order.orderNumber}: ${prev} → ${status} ✓ (MongoDB)`);
  // CJ shipping/delivery is authoritative on CJ's side and pulled from them; we
  // log the local change so a future CJ tracking sync can reconcile.
  if (order.cjOrderId) {
    console.log(`[order status] ${order.orderNumber}: CJ order ${order.cjOrderId} — status is tracked on CJ side (pull-based).`);
  }

  return { ok: true, order, message: `Order marked ${status}.` };
}