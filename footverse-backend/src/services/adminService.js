/**
 * Admin service — all read/aggregate logic for the admin panel.
 * Reuses the existing Order/User/Transaction models; no product data here
 * (products live in Redis).
 */
import Order from "../models/Order.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Issue from "../models/Issue.js";
import FinanceSettings from "../models/FinanceSettings.js";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/* ============================ DASHBOARD ============================ */

/** Headline KPIs + graph series + recent orders + pending actions. */
export async function getDashboard({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [orders, users, openIssues, pendingReturns] = await Promise.all([
    Order.find({ createdAt: { $gte: since } }).lean(),
    User.countDocuments(),
    Issue.countDocuments({ status: { $in: ["Open", "In Progress"] } }),
    Order.countDocuments({ "returnRequest.status": "Requested" }),
  ]);

  const paid = orders.filter((o) => o.paymentStatus === "Paid");
  const revenue = round2(paid.reduce((s, o) => s + (o.grandTotal || 0), 0));
  const cancelled = orders.filter((o) => o.orderStatus === "Cancelled").length;
  const delivered = orders.filter((o) => o.orderStatus === "Delivered").length;

  // Daily series for the revenue/orders graphs.
  const byDay = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    byDay.set(d.toISOString().slice(0, 10), { date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const k = new Date(o.createdAt).toISOString().slice(0, 10);
    const row = byDay.get(k);
    if (!row) continue;
    row.orders += 1;
    if (o.paymentStatus === "Paid") row.revenue = round2(row.revenue + (o.grandTotal || 0));
  }

  const recent = await Order.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .select("orderNumber customer grandTotal orderStatus paymentStatus createdAt")
    .lean();

  return {
    kpis: {
      revenue,
      orders: orders.length,
      paidOrders: paid.length,
      avgOrderValue: paid.length ? round2(revenue / paid.length) : 0,
      users,
      delivered,
      cancelled,
      cancelRate: orders.length ? round2((cancelled / orders.length) * 100) : 0,
    },
    series: [...byDay.values()],
    recentOrders: recent,
    pendingActions: {
      openIssues,
      pendingReturns,
      unsyncedOrders: await Order.countDocuments({ cjSyncStatus: "CJ Sync Failed" }),
    },
    rangeDays: days,
  };
}

/* ============================== USERS ============================== */

export async function listUsers({ q = "", page = 1, limit = 25 } = {}) {
  const filter = q
    ? { $or: [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }] }
    : {};
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select("name email isVerified isAdmin wallet addresses createdAt")
    .lean();

  // Attach order counts/spend per user (one aggregate, not N queries).
  const ids = users.map((u) => u._id);
  const stats = await Order.aggregate([
    { $match: { user: { $in: ids }, paymentStatus: "Paid" } },
    { $group: { _id: "$user", orders: { $sum: 1 }, spend: { $sum: "$grandTotal" } } },
  ]);
  const byUser = Object.fromEntries(stats.map((s) => [String(s._id), s]));

  return {
    users: users.map((u) => ({
      ...u,
      orderCount: byUser[String(u._id)]?.orders || 0,
      totalSpend: round2(byUser[String(u._id)]?.spend || 0),
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** One user with their full profile, order history, wallet and addresses. */
export async function getUserDetail(userId) {
  const user = await User.findById(userId)
    .select("name email isVerified isAdmin wallet addresses createdAt")
    .lean();
  if (!user) return null;

  const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .select("orderNumber grandTotal orderStatus paymentStatus createdAt")
    .lean();

  const spend = round2(
    orders.filter((o) => o.paymentStatus === "Paid").reduce((s, o) => s + (o.grandTotal || 0), 0)
  );

  return { user, orders, stats: { orderCount: orders.length, totalSpend: spend } };
}

/** Credit or debit a user's wallet (admin action, fully audited). */
export async function adjustWallet(userId, { type, amount, reason, by }) {
  const user = await User.findById(userId);
  if (!user) return { ok: false, status: 404, message: "User not found" };
  const amt = round2(amount);
  if (!["credit", "debit"].includes(type) || amt <= 0) {
    return { ok: false, status: 400, message: "Provide a valid type (credit/debit) and a positive amount." };
  }
  if (!user.wallet) user.wallet = { balance: 0, currency: "USD", transactions: [] };
  if (type === "debit" && user.wallet.balance < amt) {
    return { ok: false, status: 400, message: "Insufficient wallet balance." };
  }

  user.wallet.balance = round2(user.wallet.balance + (type === "credit" ? amt : -amt));
  user.wallet.transactions.push({ type, amount: amt, reason: reason || "", by: by || "admin" });
  await user.save();
  return { ok: true, wallet: user.wallet };
}

/* ============================== ORDERS ============================= */

/** Orders with status tabs + filters + pagination. */
export async function listOrders({ status = "", q = "", page = 1, limit = 25 } = {}) {
  const filter = {};
  if (status && status !== "All") filter.orderStatus = status;
  if (q) {
    filter.$or = [
      { orderNumber: new RegExp(q, "i") },
      { "customer.name": new RegExp(q, "i") },
      { "customer.email": new RegExp(q, "i") },
    ];
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select("orderNumber customer grandTotal orderStatus paymentStatus cjSyncStatus createdAt")
    .lean();

  return { orders, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Counts per status (for the tab badges) + a simple conversion funnel. */
export async function getOrderAnalytics() {
  const rows = await Order.aggregate([
    { $group: { _id: "$orderStatus", count: { $sum: 1 }, value: { $sum: "$grandTotal" } } },
  ]);
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, { count: r.count, value: round2(r.value) }]));

  const all = ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];
  const counts = Object.fromEntries(all.map((s) => [s, byStatus[s]?.count || 0]));

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const paid = await Order.countDocuments({ paymentStatus: "Paid" });

  // Funnel: placed → paid → shipped → delivered
  const shipped = counts.Shipped + counts.Delivered;
  const funnel = [
    { stage: "Placed", count: total },
    { stage: "Paid", count: paid },
    { stage: "Shipped", count: shipped },
    { stage: "Delivered", count: counts.Delivered },
  ];

  return { counts, byStatus, funnel, total };
}

/* ============================== ISSUES ============================= */

export async function listIssues({ status = "", priority = "", page = 1, limit = 25 } = {}) {
  const filter = {};
  if (status && status !== "All") filter.status = status;
  if (priority && priority !== "All") filter.priority = priority;

  const total = await Issue.countDocuments(filter);
  const issues = await Issue.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const counts = Object.fromEntries(
    (await Issue.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])).map((r) => [r._id, r.n])
  );

  return { issues, counts, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/* ============================= FINANCE ============================= */

async function getSettings() {
  let s = await FinanceSettings.findOne({ key: "default" });
  if (!s) s = await FinanceSettings.create({ key: "default" });
  return s;
}

export async function getFinanceSettings() {
  return getSettings();
}

export async function updateFinanceSettings(patch, by = "") {
  const s = await getSettings();
  for (const k of [
    "gstRate",
    "commissionRate",
    "gatewayFeePercent",
    "gatewayFeeFixed",
    "settlementCycleDays",
  ]) {
    if (patch[k] !== undefined) s[k] = Number(patch[k]);
  }
  s.updatedBy = by;
  await s.save();
  return s;
}

/**
 * Commission & finance summary computed from real paid orders + the configured
 * rates: gross revenue, GST, gateway fees, commission, coupon cost, and the
 * net settlement amount.
 */
export async function getFinanceSummary({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const cfg = await getSettings();

  const orders = await Order.find({
    paymentStatus: "Paid",
    createdAt: { $gte: since },
  })
    .select("grandTotal subtotal discount createdAt orderNumber")
    .lean();

  const gross = round2(orders.reduce((s, o) => s + (o.grandTotal || 0), 0));
  const couponCost = round2(orders.reduce((s, o) => s + (o.discount || 0), 0));

  // GST is computed as the tax portion inside the gross (tax-inclusive pricing).
  const gst = round2((gross * cfg.gstRate) / (100 + cfg.gstRate));
  const netOfGst = round2(gross - gst);

  // Stripe-style gateway fee: % + fixed, per transaction.
  const gatewayFees = round2(
    orders.reduce(
      (s, o) => s + ((o.grandTotal || 0) * cfg.gatewayFeePercent) / 100 + cfg.gatewayFeeFixed,
      0
    )
  );

  const commission = round2((netOfGst * cfg.commissionRate) / 100);
  const settlement = round2(gross - gst - gatewayFees - commission);

  // Refunds issued in the window (money out).
  const refunded = round2(
    (
      await Order.find({
        "refund.status": "Refunded",
        "refund.processedAt": { $gte: since },
      }).select("refund.amount").lean()
    ).reduce((s, o) => s + (o.refund?.amount || 0), 0)
  );

  return {
    rangeDays: days,
    currency: cfg.currency,
    rates: {
      gstRate: cfg.gstRate,
      commissionRate: cfg.commissionRate,
      gatewayFeePercent: cfg.gatewayFeePercent,
      gatewayFeeFixed: cfg.gatewayFeeFixed,
      settlementCycleDays: cfg.settlementCycleDays,
    },
    summary: {
      orders: orders.length,
      grossRevenue: gross,
      gst,
      netOfGst,
      gatewayFees,
      commission,
      couponCost,
      refunded,
      netSettlement: round2(settlement - refunded),
    },
  };
}

/* ============================= RETURNS ============================= */

/**
 * Return requests only (NOT cancellations) — the dedicated admin Returns
 * section. Grouped by where each request sits in the workflow.
 */
export async function listReturns({ status = "", page = 1, limit = 25 } = {}) {
  const filter = { "returnRequest.status": { $nin: ["None", null] } };
  if (status && status !== "All") filter["returnRequest.status"] = status;

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ "returnRequest.requestedAt": -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select(
      "orderNumber customer grandTotal orderStatus paymentMethod returnRequest refund items createdAt"
    )
    .lean();

  // Counts per workflow stage (for the tab badges).
  const rows = await Order.aggregate([
    { $match: { "returnRequest.status": { $nin: ["None", null] } } },
    { $group: { _id: "$returnRequest.status", n: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(rows.map((r) => [r._id, r.n]));

  return {
    returns: orders,
    counts,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}