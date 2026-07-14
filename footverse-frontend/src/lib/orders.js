import api, { getToken } from "./api";

const KEY = "fv-orders";

function localOrders() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Logged-in users get their DB orders (/orders/my). Guests fall back to any
 * locally-stored COD confirmations.
 */
export async function getOrders() {
  if (getToken()) {
    try {
      const r = await api.get("/orders/my");
      return r.data.orders || [];
    } catch {
      return localOrders();
    }
  }
  return localOrders();
}

export function addOrder(order) {
  const orders = localOrders();
  orders.unshift(order);
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(orders));
  return order;
}

/** Fetch a single order by its Mongo _id (used by the order-detail page). */
export async function getOrder(id) {
  const r = await api.get(`/orders/${id}`);
  return r.data.order;
}

/** Cancel an order with a reason. */
export async function cancelOrder(orderId, reason) {
  const { data } = await api.post(`/orders/${orderId}/cancel`, { reason });
  return data;
}

/** Submit a return request (Delivered orders). */
export async function requestReturn(orderId, payload) {
  // payload: { reason, comments, contact, bankDetails }
  const { data } = await api.post(`/orders/${orderId}/return`, payload);
  return data;
}

/* ---- Admin ---- */
export async function adminListReturns() {
  const { data } = await api.get("/orders/admin/returns");
  return data.orders || [];
}
export async function adminResolveReturn(orderId, decision, adminNote) {
  const { data } = await api.post(`/orders/admin/${orderId}/resolve-return`, { decision, adminNote });
  return data;
}
export async function adminMarkRefunded(orderId, note) {
  const { data } = await api.post(`/orders/admin/${orderId}/refunded`, { note });
  return data;
}

export async function adminUpdateStatus(orderId, status, note) {
  const { data } = await api.post(`/orders/admin/${orderId}/status`, { status, note });
  return data;
}
export async function adminReconcileReport() {
  const { data } = await api.get("/orders/admin/reconcile/report");
  return data;
}
export async function adminReconcileRun() {
  const { data } = await api.post("/orders/admin/reconcile/run");
  return data;
}