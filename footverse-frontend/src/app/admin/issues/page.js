"use client";

import { useEffect, useState } from "react";
import { getIssues, getIssue, replyIssue, updateIssue } from "@/lib/admin";
import Spinner from "@/components/ui/Spinner";
import { PageHeader, Card, Table, Td, Badge, Empty, Stat } from "@/components/admin/ui";

const STATUSES = ["All", "Open", "In Progress", "Resolved", "Closed"];

export default function AdminIssues() {
  const [status, setStatus] = useState("All");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null); // the issue being viewed

  async function load() {
    setLoading(true);
    try {
      setData(await getIssues({ status, page: 1, limit: 50 }));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [status]);

  async function view(id) {
    const r = await getIssue(id);
    setOpen(r.issue);
  }

  return (
    <>
      <PageHeader title="Customer Issues" subtitle="Payment and order problems raised by customers" />

      {data?.counts && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Open" value={data.counts.Open || 0} tone={data.counts.Open ? "warn" : "default"} />
          <Stat label="In Progress" value={data.counts["In Progress"] || 0} />
          <Stat label="Resolved" value={data.counts.Resolved || 0} tone="gold" />
          <Stat label="Closed" value={data.counts.Closed || 0} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              status === s ? "bg-[#33231A] text-white" : "bg-white text-[#6E655C] hover:text-[#33231A]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading issues…" />
      ) : !data || data.issues.length === 0 ? (
        <Empty>No issues here.</Empty>
      ) : (
        <Table head={["Ticket", "Customer", "Subject", "Category", "Priority", "Status", "Raised"]}>
          {data.issues.map((i) => (
            <tr key={i._id} onClick={() => view(i._id)} className="cursor-pointer hover:bg-[#F7F4EF]">
              <Td className="font-semibold">{i.ticketNumber}</Td>
              <Td className="text-[#6E655C]">
                <p>{i.userName}</p>
                <p className="text-[11px]">{i.userEmail}</p>
              </Td>
              <Td>{i.subject}</Td>
              <Td className="text-[#6E655C]">{i.category}</Td>
              <Td><Badge>{i.priority}</Badge></Td>
              <Td><Badge>{i.status}</Badge></Td>
              <Td className="text-[#6E655C]">{new Date(i.createdAt).toLocaleDateString()}</Td>
            </tr>
          ))}
        </Table>
      )}

      {open && <IssueDrawer issue={open} onClose={() => setOpen(null)} onChanged={async (id) => { await view(id); await load(); }} />}
    </>
  );
}

function IssueDrawer({ issue, onClose, onChanged }) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await replyIssue(issue._id, reply.trim());
      setReply("");
      await onChanged(issue._id);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status) {
    setBusy(true);
    try {
      await updateIssue(issue._id, { status });
      await onChanged(issue._id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#A5793A]">
              {issue.ticketNumber}
            </p>
            <h2 className="mt-1 font-sans text-xl font-bold text-[#33231A]">{issue.subject}</h2>
            <p className="mt-1 text-[12px] text-[#6E655C]">
              {issue.userName} · {issue.userEmail}
              {issue.orderNumber && <> · Order {issue.orderNumber}</>}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-[#6E655C]">×</button>
        </div>

        <div className="mt-3 flex gap-2">
          <Badge>{issue.status}</Badge>
          <Badge>{issue.priority}</Badge>
          <Badge>{issue.category}</Badge>
        </div>

        <div className="mt-5 rounded-xl bg-[#F7F4EF] p-4 text-[13px] text-[#33231A]">
          {issue.description}
        </div>

        {/* Thread */}
        {issue.replies?.length > 0 && (
          <div className="mt-5 space-y-3">
            {issue.replies.map((r, i) => (
              <div
                key={i}
                className={`rounded-xl p-3.5 text-[13px] ${
                  r.author === "admin" ? "ml-6 bg-[#33231A] text-white" : "mr-6 bg-[#F1ECE2] text-[#33231A]"
                }`}
              >
                <p className="mb-1 text-[11px] font-semibold opacity-70">
                  {r.author === "admin" ? r.authorName || "Support" : r.authorName || "Customer"}
                </p>
                {r.message}
              </div>
            ))}
          </div>
        )}

        {/* Reply */}
        <div className="mt-5">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Write a reply to the customer…"
            className="w-full rounded-lg border border-[#33231A]/12 p-3 text-[13px] focus:border-[#A5793A] focus:outline-none"
          />
          <button
            onClick={send}
            disabled={busy || !reply.trim()}
            className="mt-2 w-full rounded-lg bg-[#33231A] py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send reply"}
          </button>
        </div>

        {/* Status actions */}
        <div className="mt-5 border-t border-[#33231A]/10 pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Update status
          </p>
          <div className="flex flex-wrap gap-2">
            {["Open", "In Progress", "Resolved", "Closed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                disabled={busy || issue.status === s}
                className="rounded-lg border border-[#33231A]/15 px-3 py-1.5 text-[12px] font-semibold text-[#33231A] transition-colors hover:border-[#A5793A] disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}