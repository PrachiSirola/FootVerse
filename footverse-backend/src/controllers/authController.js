import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import { signToken } from "../middleware/auth.js";
import {
  generateOtp, hashOtp, verifyOtp,
  OTP_TTL_MS, RESEND_COOLDOWN_MS, MAX_OTP_ATTEMPTS,
} from "../utils/otp.js";
import { sendOtpEmail, sendResetEmail } from "../utils/mailer.js";

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
const normEmail = (e) => String(e || "").toLowerCase().trim();

/* ─────────────────────────────────────────────
   REGISTER  →  create/refresh a PendingUser + email an OTP
   (the real User is NOT created yet)
   ───────────────────────────────────────────── */
export async function register(req, res) {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normEmail(req.body?.email);
    const { password } = req.body || {};

    if (name.length < 2) return res.status(400).json({ success: false, message: "Please enter your name." });
    if (!emailOk(email)) return res.status(400).json({ success: false, message: "Please enter a valid email." });
    if ((password || "").length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const otp = generateOtp();
    const now = Date.now();
    const doc = {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      otpHash: await hashOtp(otp),
      otpPlain: otp, // DEV ONLY: visible in Mongo for local testing
      otpExpires: new Date(now + OTP_TTL_MS),
      attempts: 0,
      lastSentAt: new Date(now),
      expiresAt: new Date(now + OTP_TTL_MS),
    };

    // Upsert: if they restart signup before verifying, replace the pending record.
    await PendingUser.findOneAndUpdate({ email }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });

    console.log(`[OTP] ${email} → code: ${otp} (also stored as otpPlain in Mongo)`);
    await sendOtpEmail(email, otp, name).catch((e) => console.warn(`[OTP] email failed (code still in Mongo/console): ${e.message}`));

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
      email,
      expiresInMs: OTP_TTL_MS,
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ success: false, message: "Could not start registration. Try again." });
  }
}

/* ─────────────────────────────────────────────
   VERIFY OTP  →  create the real User (isVerified=true)
   ───────────────────────────────────────────── */
export async function verifyOtpAndRegister(req, res) {
  try {
    const email = normEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      return res.status(400).json({ success: false, message: "No pending signup found. Please register again." });
    }
    if (pending.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please resend a new code." });
    }
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      await PendingUser.deleteOne({ email });
      return res.status(429).json({ success: false, message: "Too many wrong attempts. Please register again." });
    }

    const ok = await verifyOtp(otp, pending.otpHash);
    if (!ok) {
      pending.attempts += 1;
      await pending.save();
      const left = Math.max(0, MAX_OTP_ATTEMPTS - pending.attempts);
      return res.status(400).json({ success: false, message: `Incorrect OTP. ${left} attempt${left === 1 ? "" : "s"} left.` });
    }

    // Double-check email wasn't claimed meanwhile.
    if (await User.findOne({ email })) {
      await PendingUser.deleteOne({ email });
      return res.status(409).json({ success: false, message: "Account already exists. Please log in." });
    }

    // Password is already hashed in the pending record — move it straight over.
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
      isVerified: true,
    });
    await PendingUser.deleteOne({ email });

    return res.status(201).json({
      success: true,
      message: "Email verified. You can now log in.",
      user: user.toSafe(),
    });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ success: false, message: "Verification failed. Try again." });
  }
}

/* ─────────────────────────────────────────────
   RESEND OTP  (throttled)
   ───────────────────────────────────────────── */
export async function resendOtp(req, res) {
  try {
    const email = normEmail(req.body?.email);
    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      return res.status(400).json({ success: false, message: "No pending signup found. Please register again." });
    }

    const since = Date.now() - new Date(pending.lastSentAt).getTime();
    if (since < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - since) / 1000);
      return res.status(429).json({ success: false, message: `Please wait ${wait}s before resending.` });
    }

    const otp = generateOtp();
    const now = Date.now();
    pending.otpHash = await hashOtp(otp);
    pending.otpExpires = new Date(now + OTP_TTL_MS);
    pending.expiresAt = new Date(now + OTP_TTL_MS);
    pending.lastSentAt = new Date(now);
    pending.attempts = 0;
    await pending.save();

    await sendOtpEmail(email, otp, pending.name);
    return res.json({ success: true, message: "A new OTP has been sent.", expiresInMs: OTP_TTL_MS });
  } catch (err) {
    console.error("resendOtp error:", err);
    return res.status(500).json({ success: false, message: "Could not resend OTP." });
  }
}

/* ─────────────────────────────────────────────
   LOGIN  (verified users only)
   ───────────────────────────────────────────── */
export async function login(req, res) {
  try {
    const email = normEmail(req.body?.email);
    const { password } = req.body || {};

    const user = await User.findOne({ email });
    if (!user || !(await user.verifyPassword(password || ""))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
    }

    return res.json({ success: true, token: signToken(user._id.toString()), user: user.toSafe() });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
}

/* ─────────────────────────────────────────────
   FORGOT PASSWORD  →  email a reset link
   (always returns success to avoid leaking which emails exist)
   ───────────────────────────────────────────── */
export async function forgotPassword(req, res) {
  try {
    const email = normEmail(req.body?.email);
    const user = await User.findOne({ email });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      await user.save();

      const base = process.env.CLIENT_URL || "http://localhost:3000";
      const resetUrl = `${base}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
      await sendResetEmail(email, resetUrl, user.name);
    }

    return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ success: false, message: "Could not process request." });
  }
}

/* ─────────────────────────────────────────────
   RESET PASSWORD  (via token from email)
   ───────────────────────────────────────────── */
export async function resetPassword(req, res) {
  try {
    const email = normEmail(req.body?.email);
    const { token, password } = req.body || {};
    if (!token || (password || "").length < 6) {
      return res.status(400).json({ success: false, message: "Invalid request or weak password (min 6 chars)." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Reset link is invalid or has expired." });
    }

    await user.setPassword(password);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    return res.json({ success: true, message: "Password updated. You can now log in." });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ success: false, message: "Could not reset password." });
  }
}

/* ─────────────────────────────────────────────
   Session helpers (unchanged behaviour)
   ───────────────────────────────────────────── */
export async function me(req, res) {
  const user = await User.findById(req.uid);
  if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
  return res.json({ success: true, user: user.toSafe() });
}

export async function updateMe(req, res) {
  try {
    const user = await User.findById(req.uid);
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
    const { name, phone } = req.body || {};
    if (name?.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = String(phone);
    await user.save();
    return res.json({ success: true, user: user.toSafe() });
  } catch {
    return res.status(500).json({ success: false, message: "Update failed." });
  }
}

/* ─────────────────────────────────────────────
   PROFILE: avatar, addresses, change password
   ───────────────────────────────────────────── */

const MAX_AVATAR_CHARS = 2_800_000; // ~2MB base64 ceiling

/** PATCH /api/auth/avatar  { avatar: "data:image/...base64," } */
export async function updateAvatar(req, res) {
  try {
    const { avatar } = req.body || {};
    if (typeof avatar !== "string" || !avatar.startsWith("data:image/")) {
      return res.status(400).json({ success: false, message: "Please upload a valid image." });
    }
    if (avatar.length > MAX_AVATAR_CHARS) {
      return res.status(413).json({ success: false, message: "Image too large. Please use one under 2MB." });
    }
    const user = await User.findById(req.uid);
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
    user.avatar = avatar;
    await user.save();
    return res.json({ success: true, user: user.toSafe() });
  } catch (err) {
    console.error("updateAvatar error:", err);
    return res.status(500).json({ success: false, message: "Could not update photo." });
  }
}

/** POST /api/auth/change-password { currentPassword, newPassword } */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if ((newPassword || "").length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    const user = await User.findById(req.uid);
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

    const ok = await user.verifyPassword(currentPassword || "");
    if (!ok) return res.status(400).json({ success: false, message: "Current password is incorrect." });

    await user.setPassword(newPassword);
    await user.save();
    return res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ success: false, message: "Could not change password." });
  }
}

/** GET /api/auth/addresses */
export async function getAddresses(req, res) {
  const user = await User.findById(req.uid);
  if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
  return res.json({ success: true, addresses: user.addresses || [] });
}

/** POST /api/auth/addresses  { ...address } */
export async function addAddress(req, res) {
  try {
    const user = await User.findById(req.uid);
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

    const a = req.body || {};
    if (!a.name || !a.line1 || !a.city || String(a.pin || "").length !== 6) {
      return res.status(400).json({ success: false, message: "Name, address, city and a 6-digit PIN are required." });
    }
    const makeDefault = a.isDefault || user.addresses.length === 0;
    if (makeDefault) user.addresses.forEach((ad) => (ad.isDefault = false));
    user.addresses.push({
      label: a.label || "Home", name: a.name, phone: a.phone || "",
      line1: a.line1, line2: a.line2 || "", city: a.city, state: a.state || "",
      pin: a.pin, isDefault: makeDefault,
    });
    await user.save();
    return res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error("addAddress error:", err);
    return res.status(500).json({ success: false, message: "Could not add address." });
  }
}

/** PATCH /api/auth/addresses/:id  { ...fields } */
export async function updateAddress(req, res) {
  try {
    const user = await User.findById(req.uid);
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

    const addr = user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ success: false, message: "Address not found." });

    const a = req.body || {};
    for (const k of ["label", "name", "phone", "line1", "line2", "city", "state", "pin"]) {
      if (a[k] !== undefined) addr[k] = a[k];
    }
    if (a.isDefault) {
      user.addresses.forEach((ad) => (ad.isDefault = false));
      addr.isDefault = true;
    }
    await user.save();
    return res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error("updateAddress error:", err);
    return res.status(500).json({ success: false, message: "Could not update address." });
  }
}

/** DELETE /api/auth/addresses/:id */
export async function deleteAddress(req, res) {
  try {
    const user = await User.findById(req.uid);
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

    const addr = user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ success: false, message: "Address not found." });
    const wasDefault = addr.isDefault;
    addr.deleteOne();
    // if we removed the default, promote the first remaining one
    if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
    await user.save();
    return res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error("deleteAddress error:", err);
    return res.status(500).json({ success: false, message: "Could not delete address." });
  }
}