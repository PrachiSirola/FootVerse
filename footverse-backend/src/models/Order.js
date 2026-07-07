import mongoose from "mongoose";

/**
 * Product Snapshot
 * This stores what the customer actually purchased.
 * Even if the product changes later,
 * the order remains unchanged.
 */
const OrderItemSchema = new mongoose.Schema(
  {
    productId: String,

    size: String,

    color: String,

    name: String,

    image: String,

    price: Number,

    quantity: Number,

    subtotal: Number,
  },
  {
    _id: false,
  }
);

/**
 * Shipping Address
 */
const ShippingSchema = new mongoose.Schema(
  {
    name: String,

    email: String,

    phone: String,

    address: String,

    city: String,

    state: String,

    pin: String,

    country: {
      type: String,
      default: "India",
    },
  },
  {
    _id: false,
  }
);

/**
 * Order
 */

const OrderSchema = new mongoose.Schema(
  {
    /**
     * Optional — set when a logged-in user places the order, so it shows up
     * under their account. Guest Stripe orders leave this null.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /**
     * DF-2026-000001
     */

    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["Stripe", "COD"],
      default: "Stripe",
    },

    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    paymentIntent: String,

    customer: ShippingSchema,

    items: [OrderItemSchema],

    subtotal: Number,

    tax: Number,

    shippingCharge: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    grandTotal: Number,

    currency: {
      type: String,
      default: "USD",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Confirmed",
    },

    // ---- CJ Dropshipping sync ----
    cjOrderId: { type: String, default: null },
    cjOrderStatus: { type: String, default: null },
    cjSyncStatus: {
      type: String,
      enum: ["Pending", "Synced", "CJ Sync Failed", "CJ Sync Skipped"],
      default: "Pending",
    },
    cjSyncError: { type: String, default: null },
    cjSyncedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Order",
  OrderSchema
);