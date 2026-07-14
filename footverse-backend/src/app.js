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
import adminRoutes from "./routes/adminRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";

const app = express();

// JWT lives in localStorage and is sent as a Bearer header, so we don't need
// cookie credentials — a permissive CORS origin is fine for local dev.
const allowList = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://localhost:3001,http://localhost:3002")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Allow: explicit CLIENT_ORIGIN entries, any localhost, and any Vercel URL for
// this project (production domain + every per-deployment preview URL, which
// change on each deploy). This prevents CORS breaking when Vercel serves the
// site from a deployment-specific *.vercel.app host.
function isAllowedOrigin(origin) {
  if (!origin) return true; // non-browser clients (curl, server-to-server)
  if (allowList.includes(origin)) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  // any Vercel subdomain (foot-verse-*.vercel.app, previews, etc.)
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      console.warn(`[cors] blocked origin: ${origin}`);
      return callback(null, false);
    },
  })
);
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


// Payments (Stripe) + Orders (my-orders, lookup)
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);

// Admin panel (all endpoints admin-only) + customer issues
app.use("/api/admin", adminRoutes);
app.use("/api/issues", issueRoutes);

// Public: the storefront reads the hero banner the admin edits in the CMS.
app.get("/api/cms/hero", async (_req, res) => {
  try {
    const { getHero } = await import("./services/cmsService.js");
    res.json({ success: true, hero: await getHero() });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ===========================
   Health Check
=========================== */

app.get("/", (req, res) => {
  res.json({ success: true, message: "🚀 FootVerse Backend Running" });
});

export default app;