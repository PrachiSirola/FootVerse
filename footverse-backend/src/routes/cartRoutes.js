import express from "express";
import { authRequired } from "../middleware/auth.js";
import {
  getCart, addItem, updateItem, removeItem, clearCart, mergeCart,
} from "../controllers/cartController.js";

const router = express.Router();
router.use(authRequired);

router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items", updateItem);
router.delete("/items", removeItem);
router.post("/merge", mergeCart);
router.delete("/", clearCart);

export default router;