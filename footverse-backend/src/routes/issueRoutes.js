import express from "express";
import { authRequired } from "../middleware/auth.js";
import * as c from "../controllers/issueController.js";

const router = express.Router();

router.post("/", authRequired, c.submit);
router.get("/my", authRequired, c.myIssues);
router.get("/:id", authRequired, c.detail);
router.post("/:id/reply", authRequired, c.reply);

export default router;