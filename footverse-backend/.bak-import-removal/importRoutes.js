import express from "express";
import {
  bulkImport,
  importAll,
} from "../controllers/importController.js";

const router = express.Router();

router.post("/", bulkImport);

router.post("/all", importAll);

export default router;