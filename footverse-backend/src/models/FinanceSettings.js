import mongoose from "mongoose";

/**
 * Configurable financial rates used by the Commission & Finance module. A single
 * document — admins tune the rates, and all finance reports recompute from them.
 */
const FinanceSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },

    // Percentages (0–100).
    gstRate: { type: Number, default: 18 },            // GST / sales tax
    commissionRate: { type: Number, default: 10 },     // platform commission
    gatewayFeePercent: { type: Number, default: 2.9 }, // Stripe % per txn
    gatewayFeeFixed: { type: Number, default: 0.3 },   // Stripe fixed fee (USD)

    settlementCycleDays: { type: Number, default: 7 }, // payout cycle
    currency: { type: String, default: "USD" },

    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("FinanceSettings", FinanceSettingsSchema);