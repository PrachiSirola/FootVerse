import rateLimit from "express-rate-limit";

const msg = (m) => ({ success: false, message: m });

/** Tight limit on OTP/email-sending endpoints (register, resend, forgot). */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 8,                    // per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many requests. Please try again in a few minutes."),
});

/** Login/verify attempts. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many attempts. Please try again later."),
});