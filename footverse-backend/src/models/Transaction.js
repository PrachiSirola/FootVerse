import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    /**
     * Link to Order
     */

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    /**
     * Stripe
     */

    stripeSessionId: {
      type: String,
      required: true,
    },

    paymentIntent: {
      type: String,
      required: true,
    },

    /**
     * Money
     */

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    /**
     * Payment
     */

    paymentMethod: {
      type: String,
      default: "Stripe",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    /**
     * Refund
     */

    refunded: {
      type: Boolean,
      default: false,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Transaction",
  TransactionSchema
);