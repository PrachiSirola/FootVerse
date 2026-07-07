import mongoose from "mongoose";

/**
 * One cart per user. Each line stores a snapshot (name/image/price) taken at
 * add-time, so cart/checkout render without re-fetching the product and work
 * regardless of where the product came from (DB or static catalogue).
 * A line is unique by product + size + color.
 */
const CartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    qty: { type: Number, default: 1, min: 1, max: 99 },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
    brand: { type: String, default: "" },
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Cart", CartSchema);