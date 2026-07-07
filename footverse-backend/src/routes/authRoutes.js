import express from "express";
import {
  register, verifyOtpAndRegister, resendOtp,
  login, forgotPassword, resetPassword,
  me, updateMe,
  updateAvatar, changePassword,
  getAddresses, addAddress, updateAddress, deleteAddress,
} from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";
import { otpLimiter, authLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// Registration + OTP
router.post("/register", otpLimiter, register);
router.post("/verify-otp", authLimiter, verifyOtpAndRegister);
router.post("/resend-otp", otpLimiter, resendOtp);

// Login
router.post("/login", authLimiter, login);

// Password reset
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// Session
router.get("/me", authRequired, me);
router.patch("/me", authRequired, updateMe);

// Profile
router.patch("/avatar", authRequired, updateAvatar);
router.post("/change-password", authRequired, authLimiter, changePassword);
router.get("/addresses", authRequired, getAddresses);
router.post("/addresses", authRequired, addAddress);
router.patch("/addresses/:id", authRequired, updateAddress);
router.delete("/addresses/:id", authRequired, deleteAddress);

export default router;