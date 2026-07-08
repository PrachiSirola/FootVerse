import mongoose from "mongoose";

/**
 * A full snapshot of an order at the moment it was cancelled. The original order
 * stays in the `orders` collection with status "Cancelled"; this is an
 * append-only archive for reporting/audit.
 */
const CancelledOrderSchema = new mongoose.Schema(
  {
    // link back to the original
    originalOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    orderNumber: { type: String, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // cancellation context
    reason: String,
    cancelledBy: String,
    cancelledAt: { type: Date, default: Date.now },

    // refund snapshot
    refund: {
      status: String,
      method: String,
      amount: Number,
    },

    // full copy of the order (flexible — stores whatever the order had)
    snapshot: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("CancelledOrder", CancelledOrderSchema);