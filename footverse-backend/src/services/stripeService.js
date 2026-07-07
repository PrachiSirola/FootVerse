import stripe from "../config/stripeConfig.js";

/**
 * Build a Stripe Checkout session. We DO NOT stuff the cart JSON into metadata
 * (Stripe caps each metadata value at 500 chars, and CJ names + image URLs blow
 * past that). Instead we pass only our own order _id; the order already lives in
 * MongoDB with all the details.
 */
export async function createCheckoutSession({ items = [], orderId }) {
  const line_items = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        // Trim very long CJ names so the Stripe UI stays tidy (name has a 500 cap too).
        name: String(item.name || "Product").slice(0, 250),
      },
      unit_amount: Math.round((Number(item.price) || 0) * 100), // USD cents
    },
    quantity: item.quantity || item.qty || 1,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items,
    metadata: { orderId: String(orderId) },
    success_url: "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:3000/payment/cancel",
  });

  return session;
}

export async function getCheckoutSession(sessionId) {
  return stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
}