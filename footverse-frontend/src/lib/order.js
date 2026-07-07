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