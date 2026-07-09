import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";

/**
 * Generate Order Number
 * Example:
 * DF-2026-1719425012345
 */
function generateOrderNumber() {
  return `DF-${new Date().getFullYear()}-${Date.now()}`;
}

/**
 * Create Order from Stripe Session
 */
export async function createOrderFromStripeSession(session, userId = null) {
  // Prevent duplicate orders
  const existingOrder = await Order.findOne({
    stripeSessionId: session.id,
  });

  if (existingOrder) {
    return existingOrder;
  }

  const subtotal = session.amount_subtotal / 100;
  const grandTotal = session.amount_total / 100;
  const tax = grandTotal - subtotal;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),

    user: userId,

    paymentMethod: "Stripe",

    stripeSessionId: session.id,

    paymentIntent: session.payment_intent?.id || "",

    customer: {
      name:
        session.customer_details?.name ||
        session.metadata?.customerName ||
        "",

      email:
        session.customer_details?.email ||
        session.metadata?.customerEmail ||
        "",

      phone:
        session.metadata?.customerPhone ||
        "",

      address:
        session.metadata?.address ||
        "",

      city:
        session.metadata?.city ||
        "",

      state:
        session.metadata?.state ||
        "",

      pin:
        session.metadata?.pin ||
        "",
    },

    // We will populate this in the next step
    items:
      session.metadata?.items
        ? JSON.parse(session.metadata.items).map((item) => ({
            productId: item.id,
            name: item.name,
            image: item.image || "",
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          }))
          :[],



    subtotal,

    tax,

    shippingCharge: 0,

    discount: 0,

    grandTotal,

    currency: session.currency.toUpperCase(),

    paymentStatus: "Paid",

    orderStatus: "Confirmed",
  });

  await Transaction.create({
    orderId: order._id,

    stripeSessionId: session.id,

    paymentIntent:
      session.payment_intent?.id || "",

    amount: grandTotal,

    currency: session.currency.toUpperCase(),

    paymentMethod: "Stripe",

    status: "Paid",
  });

  return order;
}
export async function getAllOrders() {
  return await Order.find()
    .sort({
      createdAt: -1,
    });
}

export async function getOrderById(id) {
  return await Order.findById(id);
}
/**
 * ============================================
 * COD Order — built server-side from the user's cart.
 * Prices come from the catalogue, never the client, so totals can't be forged.
 * ============================================
 */
import Cart from "../models/Cart.js";
import { syncOrderToCJInBackground } from "./cjOrderService.js";

/** Round money to 2 decimals (USD cents precision). */
function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

const TAX_RATE = 0; // no tax (USD store)
const FREE_SHIPPING_ABOVE = 50; // USD
const SHIPPING_FEE = 5; // USD flat

export async function createCodOrderForUser(uid, customer = {}) {
  const cart = await Cart.findOne({ user: uid });
  if (!cart || cart.items.length === 0) {
    const e = new Error("Your cart is empty.");
    e.status = 400;
    throw e;
  }

  const items = cart.items.map((i) => ({
    productId: i.productId,
    size: i.size || "",
    color: i.color || "",
    name: i.name || "",
    image: i.image || "",
    price: Number(i.price) || 0,
    quantity: i.qty,
    subtotal: (Number(i.price) || 0) * i.qty,
  }));

  if (items.length === 0) {
    const e = new Error("Cart items are no longer available.");
    e.status = 400;
    throw e;
  }

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const tax = round2(subtotal * TAX_RATE);
  const shippingCharge = subtotal > FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const grandTotal = round2(subtotal + tax + shippingCharge);

  const order = await Order.create({
    user: uid,
    orderNumber: generateOrderNumber(),
    paymentMethod: "COD",
    customer,
    items,
    subtotal,
    tax,
    shippingCharge,
    discount: 0,
    grandTotal,
    currency: "USD",
    paymentStatus: "Pending",
    orderStatus: "Confirmed",
  });

  // empty the cart now that the order exists
  cart.items = [];
  await cart.save();

  // Sync to CJ in the background — customer doesn't wait on it.
  console.log(`[order] COD order ${order.orderNumber} SAVED to Mongo:`);
  console.log(`         _id=${order._id}  user=${order.user}  status=${order.orderStatus}`);
  // Immediately verify it's queryable by the same filter history uses.
  const check = await Order.countDocuments({ user: uid });
  console.log(`[order] this user (${uid}) now has ${check} order(s) in Mongo`);
  syncOrderToCJInBackground(order._id);

  return order;
}

export async function getOrdersForUser(uid) {
  const orders = await Order.find({ user: uid }).sort({ createdAt: -1 });
  console.log(`[order history] querying user=${uid} → found ${orders.length} order(s)`);
  if (orders.length === 0) {
    const total = await Order.countDocuments();
    console.log(`[order history] (DB has ${total} orders total across all users)`);
  }
  return orders;
}

/**
 * ============================================
 * Stripe flow (size-safe): create the order in Mongo FIRST, then pass only its
 * _id to Stripe metadata. On success we look it up and mark it Paid — no giant
 * item JSON in metadata (Stripe caps metadata values at 500 chars).
 * ============================================
 */
const TAX_RATE_STRIPE = 0; // no tax (USD store)
const FREE_SHIP_ABOVE = 50; // USD
const SHIP_FEE = 5; // USD flat

export async function createPendingOrder({ items = [], customer = {}, userId = null }) {
  const norm = items
    .map((i) => {
      const price = Number(i.price) || 0;
      const quantity = Math.max(1, Number(i.quantity || i.qty) || 1);
      return {
        productId: i.id || i.productId || "",
        size: i.size || "",
        color: i.color || "",
        name: i.name || "",
        image: i.image || "",
        price,
        quantity,
        subtotal: price * quantity,
      };
    })
    .filter((i) => i.name || i.productId);

  if (norm.length === 0) {
    const e = new Error("Cart is empty.");
    e.status = 400;
    throw e;
  }

  const subtotal = norm.reduce((s, i) => s + i.subtotal, 0);
  const tax = round2(subtotal * TAX_RATE_STRIPE);
  const shippingCharge = subtotal > FREE_SHIP_ABOVE ? 0 : SHIP_FEE;
  const grandTotal = round2(subtotal + tax + shippingCharge);

  const order = await Order.create({
    user: userId,
    orderNumber: generateOrderNumber(),
    paymentMethod: "Stripe",
    customer: {
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      pin: customer.pin || "",
    },
    items: norm,
    subtotal,
    tax,
    shippingCharge,
    discount: 0,
    grandTotal,
    currency: "USD",
    paymentStatus: "Pending",
    orderStatus: "Confirmed",
  });

  return order;
}

export async function markOrderPaid(orderId, session) {
  const order = await Order.findById(orderId);
  if (!order) return null;

  if (order.paymentStatus !== "Paid") {
    order.paymentStatus = "Paid";
    order.stripeSessionId = session.id;
    order.paymentIntent = session.payment_intent?.id || session.payment_intent || "";
    await order.save();

    await Transaction.create({
      orderId: order._id,
      stripeSessionId: session.id,
      paymentIntent: order.paymentIntent,
      amount: order.grandTotal,
      currency: order.currency,
      paymentMethod: "Stripe",
      status: "Paid",
    });

    // Payment confirmed — sync to CJ in the background.
    console.log(`[order] Stripe order ${order.orderNumber} paid → firing CJ sync`);
    syncOrderToCJInBackground(order._id);
  }
  return order;
}