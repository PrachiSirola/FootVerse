import express from "express";
import cors from "cors";

import productRoutes from "./routes/productRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import cjRoutes from "./routes/cjRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();

// JWT lives in localStorage and is sent as a Bearer header, so we don't need
// cookie credentials — a permissive CORS origin is fine for local dev.
const origins = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://localhost:3001,http://localhost:3002")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: origins }));
app.use(express.json({ limit: "5mb" }));

/* ===========================
   API Routes
=========================== */

// Auth (register / login / me)
app.use("/api/auth", authRoutes);

// Product search — mounted BEFORE "/:id" style product routes to avoid clashes
app.use("/api/products/search", searchRoutes);

// Product CRUD
app.use("/api/products", productRoutes);

// Cart & Wishlist (auth required inside the routers)
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);

// CJ Dropshipping
app.use("/api/cj", cjRoutes);


// Payments (Stripe) + Orders (COD, my-orders, lookup)
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);

/* ===========================
   Health Check
=========================== */

app.get("/", (req, res) => {
  res.json({ success: true, message: "🚀 FootVerse Backend Running" });
});

export default app;