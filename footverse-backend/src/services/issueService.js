/** Customer issues / support tickets — customer submission + admin handling. */
import Issue from "../models/Issue.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

function ticketNumber() {
  return `TKT-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
}

/** Customer raises an issue (optionally linked to one of their orders). */
export async function createIssue(userId, { category, subject, description, orderId }) {
  if (!subject || !description) {
    return { ok: false, status: 400, message: "Subject and description are required." };
  }

  const user = await User.findById(userId).select("name email").lean();
  if (!user) return { ok: false, status: 404, message: "User not found." };

  let order = null;
  if (orderId) {
    order = await Order.findOne({ _id: orderId, user: userId }).select("orderNumber").lean();
    if (!order) return { ok: false, status: 400, message: "That order does not belong to you." };
  }

  const issue = await Issue.create({
    ticketNumber: ticketNumber(),
    user: userId,
    userName: user.name,
    userEmail: user.email,
    order: order?._id || null,
    orderNumber: order?.orderNumber || null,
    category: category || "Other",
    subject,
    description,
    status: "Open",
  });

  console.log(`[issue] ${issue.ticketNumber} raised by ${user.email} (${issue.category})`);
  return { ok: true, issue };
}

/** A customer's own issues. */
export async function listUserIssues(userId) {
  return Issue.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

/** One issue (admin, or the owner). */
export async function getIssue(issueId, { userId = null, isAdmin = false } = {}) {
  const issue = await Issue.findById(issueId).lean();
  if (!issue) return null;
  if (!isAdmin && String(issue.user) !== String(userId)) return null;
  return issue;
}

/** Add a reply (customer or admin). */
export async function replyToIssue(issueId, { message, author, authorName, userId = null }) {
  if (!message?.trim()) return { ok: false, status: 400, message: "Reply cannot be empty." };
  const issue = await Issue.findById(issueId);
  if (!issue) return { ok: false, status: 404, message: "Issue not found." };

  // Customers may only reply to their own issue.
  if (author === "user" && String(issue.user) !== String(userId)) {
    return { ok: false, status: 403, message: "Not your issue." };
  }

  issue.replies.push({ author, authorName: authorName || "", message: message.trim() });
  // An admin reply moves an Open ticket to In Progress.
  if (author === "admin" && issue.status === "Open") issue.status = "In Progress";
  await issue.save();
  return { ok: true, issue };
}

/** Admin updates status / priority, and can resolve. */
export async function updateIssue(issueId, { status, priority, by = "admin" }) {
  const issue = await Issue.findById(issueId);
  if (!issue) return { ok: false, status: 404, message: "Issue not found." };

  if (status) {
    issue.status = status;
    if (["Resolved", "Closed"].includes(status)) {
      issue.resolvedAt = new Date();
      issue.resolvedBy = by;
    }
  }
  if (priority) issue.priority = priority;
  await issue.save();
  console.log(`[issue] ${issue.ticketNumber} → ${issue.status}${priority ? ` / ${priority}` : ""}`);
  return { ok: true, issue };
}