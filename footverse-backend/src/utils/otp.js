import bcrypt from "bcryptjs";

/** Cryptographically-random 6-digit OTP as a string ("000123" possible). */
export function generateOtp() {
  // 0 – 999999, zero-padded to 6 digits
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, "0");
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(otp, otpHash) {
  return bcrypt.compare(otp, otpHash);
}

export const OTP_TTL_MS = 5 * 60 * 1000;        // 5 minutes
export const RESEND_COOLDOWN_MS = 30 * 1000;     // 30s between resends
export const MAX_OTP_ATTEMPTS = 5;               // wrong tries before invalidation