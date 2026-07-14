/** Admin panel API — all endpoints are admin-only (see adminRequired). */
import * as admin from "../services/adminService.js";
import * as issues from "../services/issueService.js";
import * as cms from "../services/cmsService.js";
import User from "../models/User.js";

const fail = (res, r) =>
  res.status(r.status || 400).json({ success: false, message: r.message });

/* ---- Dashboard ---- */
export async function dashboard(req, res) {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    res.json({ success: true, ...(await admin.getDashboard({ days })) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

/* ---- Users ---- */
export async function users(req, res) {
  try {
    res.json({
      success: true,
      ...(await admin.listUsers({
        q: req.query.q || "",
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 25,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function userDetail(req, res) {
  try {
    const data = await admin.getUserDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function walletAdjust(req, res) {
  try {
    const me = await User.findById(req.uid).select("name email").lean();
    const r = await admin.adjustWallet(req.params.id, {
      type: req.body?.type,
      amount: Number(req.body?.amount),
      reason: req.body?.reason,
      by: me?.email || "admin",
    });
    if (!r.ok) return fail(res, r);
    res.json({ success: true, wallet: r.wallet });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

/* ---- Orders ---- */
export async function orders(req, res) {
  try {
    res.json({
      success: true,
      ...(await admin.listOrders({
        status: req.query.status || "",
        q: req.query.q || "",
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 25,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function orderAnalytics(_req, res) {
  try {
    res.json({ success: true, ...(await admin.getOrderAnalytics()) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

/* ---- Issues (admin side) ---- */
export async function issueList(req, res) {
  try {
    res.json({
      success: true,
      ...(await admin.listIssues({
        status: req.query.status || "",
        priority: req.query.priority || "",
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 25,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function issueDetail(req, res) {
  try {
    const issue = await issues.getIssue(req.params.id, { isAdmin: true });
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
    res.json({ success: true, issue });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function issueReply(req, res) {
  try {
    const me = await User.findById(req.uid).select("name").lean();
    const r = await issues.replyToIssue(req.params.id, {
      message: req.body?.message,
      author: "admin",
      authorName: me?.name || "Support",
    });
    if (!r.ok) return fail(res, r);
    res.json({ success: true, issue: r.issue });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function issueUpdate(req, res) {
  try {
    const me = await User.findById(req.uid).select("email").lean();
    const r = await issues.updateIssue(req.params.id, {
      status: req.body?.status,
      priority: req.body?.priority,
      by: me?.email || "admin",
    });
    if (!r.ok) return fail(res, r);
    res.json({ success: true, issue: r.issue });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

/* ---- Finance ---- */
export async function financeSummary(req, res) {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    res.json({ success: true, ...(await admin.getFinanceSummary({ days })) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function financeSettingsGet(_req, res) {
  try {
    res.json({ success: true, settings: await admin.getFinanceSettings() });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function financeSettingsUpdate(req, res) {
  try {
    const me = await User.findById(req.uid).select("email").lean();
    const settings = await admin.updateFinanceSettings(req.body || {}, me?.email || "admin");
    res.json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

/* ---- Hero banner CMS ---- */
export async function heroGet(_req, res) {
  try {
    res.json({ success: true, hero: await cms.getHero() });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function heroUpdate(req, res) {
  try {
    const me = await User.findById(req.uid).select("email").lean();
    const hero = await cms.updateHero(req.body || {}, me?.email || "admin");
    res.json({ success: true, hero });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

/* ---- Returns (dedicated section) ---- */
export async function returnsList(req, res) {
  try {
    res.json({
      success: true,
      ...(await admin.listReturns({
        status: req.query.status || "",
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 25,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

/** Advance a return: Approved / Item Received / Refunded / Rejected. */
export async function returnResolve(req, res) {
  try {
    const { resolveReturn } = await import("../services/orderActionService.js");
    const r = await resolveReturn(req.params.id, {
      decision: req.body?.decision,
      adminNote: req.body?.adminNote,
    });
    if (!r.ok) return res.status(r.status || 400).json({ success: false, message: r.message });
    res.json({ success: true, message: r.message, order: r.order });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

/** GET /api/admin/orders/:id — admin view of ANY order (full detail). */
export async function orderDetail(req, res) {
  try {
    const { default: Order } = await import("../models/Order.js");
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

/** POST /api/admin/orders/:id/status — admin advances fulfillment status. */
export async function orderStatusUpdate(req, res) {
  try {
    const { updateOrderStatus } = await import("../services/orderActionService.js");
    const r = await updateOrderStatus(req.params.id, {
      status: req.body?.status,
      note: req.body?.note,
    });
    if (!r.ok) return res.status(r.status || 400).json({ success: false, message: r.message });
    res.json({ success: true, message: r.message, order: r.order });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}