import express from "express";
import { authRequired } from "../middleware/auth.js";
import { getWishlist, toggle, mergeWishlist } from "../controllers/wishlistController.js";

const router = express.Router();
router.use(authRequired);

router.get("/", getWishlist);
router.post("/toggle", toggle);
router.post("/merge", mergeWishlist);

export default router;