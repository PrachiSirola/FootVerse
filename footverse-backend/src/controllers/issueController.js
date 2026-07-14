/** Customer-facing issues: submit an issue, view my issues, reply. */
import * as issues from "../services/issueService.js";
import User from "../models/User.js";

export async function submit(req, res) {
  const r = await issues.createIssue(req.uid, {
    category: req.body?.category,
    subject: req.body?.subject,
    description: req.body?.description,
    orderId: req.body?.orderId,
  });
  if (!r.ok) return res.status(r.status || 400).json({ success: false, message: r.message });
  res.json({ success: true, issue: r.issue, message: "Your issue has been submitted." });
}

export async function myIssues(req, res) {
  res.json({ success: true, issues: await issues.listUserIssues(req.uid) });
}

export async function detail(req, res) {
  const issue = await issues.getIssue(req.params.id, { userId: req.uid });
  if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });
  res.json({ success: true, issue });
}

export async function reply(req, res) {
  const me = await User.findById(req.uid).select("name").lean();
  const r = await issues.replyToIssue(req.params.id, {
    message: req.body?.message,
    author: "user",
    authorName: me?.name || "",
    userId: req.uid,
  });
  if (!r.ok) return res.status(r.status || 400).json({ success: false, message: r.message });
  res.json({ success: true, issue: r.issue });
}