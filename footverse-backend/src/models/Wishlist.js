import mongoose from "mongoose";

const WishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
    brand: { type: String, default: "" },
  },
  { _id: false }
);

const WishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    // Keep ids for quick has() checks; items carry the snapshot for rendering.
    productIds: [{ type: String }],
    items: [WishlistItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Wishlist", WishlistSchema);