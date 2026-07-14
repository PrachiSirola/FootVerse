import mongoose from "mongoose";

/**
 * Temporary home for a signup awaiting OTP verification. The real User is NOT
 * created until the OTP is confirmed. Documents auto-expire via a TTL index on
 * `expiresAt` (Mongo purges them ~once a minute after expiry).
 */
const PendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true }, // already bcrypt-hashed
    otpHash: { type: String, required: true },      // bcrypt hash of the 6-digit OTP
    // Set at REGISTRATION when a valid admin secret was supplied. Carried through
    // the OTP step and applied when the real User is created. The secret itself
    // is NEVER stored — only this boolean result.
    isAdmin: { type: Boolean, default: false },
    otpPlain: { type: String },                      // DEV ONLY: plaintext OTP for local visibility
    otpExpires: { type: Date, required: true },      // OTP validity (5 min)
    attempts: { type: Number, default: 0 },          // wrong-OTP guard
    lastSentAt: { type: Date, default: () => new Date() }, // resend throttle
    expiresAt: { type: Date, required: true },        // TTL: whole record lifetime
  },
  { timestamps: true }
);

// TTL index — Mongo deletes the doc once `expiresAt` passes.
PendingUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingUser", PendingUserSchema);