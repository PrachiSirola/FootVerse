import express from "express";
import {
  searchProducts,
  importProduct,
} from "../controllers/cjController.js";

const router = express.Router();

router.get("/search", searchProducts);
router.post("/import", importProduct);

export default router;