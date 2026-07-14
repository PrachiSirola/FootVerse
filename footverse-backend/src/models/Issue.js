import mongoose from "mongoose";

/** A reply on an issue thread (from the customer or an admin). */
const ReplySchema = new mongoose.Schema(
  {
    author: { type: String, enum: ["user", "admin"], required: true },
    authorName: { type: String, default: "" },
    message: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * A customer issue / support ticket. Customers raise payment or order problems;
 * admins triage, reply, and resolve them.
 */
const IssueSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },

    // Optional link to the order the issue is about.
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    orderNumber: { type: String, default: null },

    category: {
      type: String,
      enum: ["Payment", "Order", "Delivery", "Product", "Refund", "Other"],
      default: "Other",
      index: true,
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },

    replies: [ReplySchema],
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: String, default: null },
  },
  { timestamps: true }
);

IssueSchema.index({ status: 1, priority: 1, createdAt: -1 });

export default mongoose.model("Issue", IssueSchema);