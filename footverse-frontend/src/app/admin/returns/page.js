"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReturns, resolveReturn } from "@/lib/admin";
import { usd } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { PageHeader, Card, Table, Td, Badge, Empty, Stat, Pager } from "@/components/admin/ui";

const TABS = ["All", "Requested", "Approved", "Item Received", "Refunded", "Rejected"];

/**
 * The return workflow. Each stage offers only the next VALID action, so a
 * refund can't be issued before the goods are back:
 *   Requested → Approve / Reject
 *   Approved  → Mark Item Received
 *   Item Received → Mark Refunded
 */
const NEXT_ACTIONS = {
  Requested: [
    { decision: "Approved", label: "Approve", primary: true },
    { decision: "Rejected", label: "Reject", danger: true },
  ],
  Approved: [{ decision: "Item Received", label: "Mark item received", primary: true }],
  "Item Received": [{ decision: "Refunded", label: "Mark refunded", primary: true }],
  Refunded: [],
  Rejected: [],
};

export default function AdminReturns() {
  const [tab, setTab] = useState("Requested");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getReturns({ status: tab, page, limit: 25 }));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [tab, page]);

  return (
    <>
      <PageHeader
        title="Return Requests"
        subtitle="Requested → Approved → Item Received → Refunded"
      />

      {data?.counts && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat
            label="Awaiting review"
            value={data.counts.Requested || 0}
            tone={data.counts.Requested ? "warn" : "default"}
          />
          <Stat label="Awaiting item" value={data.counts.Approved || 0} />
          <Stat label="Ready to refund" value={data.counts["Item Received"] || 0} tone="gold" />
          <Stat label="Refunded" value={data.counts.Refunded || 0} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              tab === t ? "bg-[#33231A] text-white" : "bg-white text-[#6E655C] hover:text-[#33231A]"
            }`}
          >
            {t}
            {data?.counts?.[t] > 0 && t !== "All" && (
              <span className="ml-1.5 opacity-60">{data.counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading returns…" />
      ) : !data || data.returns.length === 0 ? (
        <Empty>No return requests in this stage.</Empty>
      ) : (
        <>
          <Table head={["Order", "Customer", "Amount", "Reason", "Stage", "Requested", ""]}>
            {data.returns.map((o) => (
              <tr key={o._id} className="hover:bg-[#F7F4EF]">
                <Td>
                  <Link href={`/admin/orders/${o._id}`} className="font-semibold hover:text-[#A5793A]">
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td className="text-[#6E655C]">
                  <p>{o.customer?.name || "—"}</p>
                  <p className="text-[11px]">{o.customer?.email || ""}</p>
                </Td>
                <Td className="font-semibold">{usd(o.grandTotal)}</Td>
                <Td className="max-w-[220px] truncate text-[#6E655C]">
                  {o.returnRequest?.reason || "—"}
                </Td>
                <Td><Badge>{o.returnRequest?.status}</Badge></Td>
                <Td className="text-[#6E655C]">
                  {o.returnRequest?.requestedAt
                    ? new Date(o.returnRequest.requestedAt).toLocaleDateString()
                    : "—"}
                </Td>
                <Td>
                  <button
                    onClick={() => setOpen(o)}
                    className="rounded-lg border border-[#33231A]/15 px-3 py-1.5 text-[12px] font-semibold text-[#33231A] hover:border-[#A5793A]"
                  >
                    Review
                  </button>
                </Td>
              </tr>
            ))}
          </Table>
          <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
        </>
      )}

      {open && (
        <ReturnDrawer
          order={open}
          onClose={() => setOpen(null)}
          onDone={async () => { setOpen(null); await load(); }}
        />
      )}
    </>
  );
}

function ReturnDrawer({ order, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const r = order.returnRequest || {};
  const actions = NEXT_ACTIONS[r.status] || [];

  async function act(decision) {
    setBusy(true);
    setError("");
    try {
      await resolveReturn(order._id, decision, note.trim() || undefined);
      await onDone();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not update this return.");
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
              Return request
            </p>
            <h2 className="mt-1 font-sans-serif text-xl font-bold text-[#33231A]">
              {order.orderNumber}
            </h2>
            <p className="mt-1 text-[12px] text-[#6E655C]">
              {order.customer?.name} · {order.customer?.email}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-[#6E655C]">×</button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{r.status}</Badge>
          {order.refund?.status && order.refund.status !== "None" && (
            <Badge>{order.refund.status}</Badge>
          )}
        </div>

        {/* Progress through the workflow */}
        <div className="mt-5 rounded-xl bg-[#F7F4EF] p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Progress
          </p>
          <Steps status={r.status} />
        </div>

        {/* The customer's submission */}
        <div className="mt-5 space-y-3 text-[13px]">
          <Field label="Amount paid" value={usd(order.grandTotal)} strong />
          <Field label="Payment method" value={order.paymentMethod} />
          <Field label="Reason" value={r.reason || "—"} />
          {r.comments && <Field label="Comments" value={r.comments} />}
          {r.contact && <Field label="Contact" value={r.contact} />}
          {order.paymentMethod === "COD" && r.bankDetails && (
            <Field
              label="Refund to"
              value={
                r.bankDetails.upiId
                  ? `UPI ${r.bankDetails.upiId}`
                  : `${r.bankDetails.accountName} · ${r.bankDetails.accountNumber} · ${r.bankDetails.ifsc}`
              }
            />
          )}
          {r.adminNote && <Field label="Admin note" value={r.adminNote} />}
        </div>

        {/* Actions — only the valid next step is offered */}
        {actions.length > 0 ? (
          <div className="mt-6 border-t border-[#33231A]/10 pt-5">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note (optional) — the customer sees this on their order timeline."
              className="mb-3 w-full rounded-lg border border-[#33231A]/12 p-3 text-[13px] focus:border-[#A5793A] focus:outline-none"
            />
            {error && <p className="mb-3 text-[13px] text-[#B8352C]">{error}</p>}
            <div className="flex gap-2.5">
              {actions.map((a) => (
                <button
                  key={a.decision}
                  onClick={() => act(a.decision)}
                  disabled={busy}
                  className={`flex-1 rounded-xl py-3 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors disabled:opacity-60 ${
                    a.danger
                      ? "border-2 border-[#B8352C] text-[#B8352C] hover:bg-[#B8352C] hover:text-white"
                      : "bg-[#33231A] text-white hover:bg-[#4A3526]"
                  }`}
                >
                  {busy ? "Working…" : a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-xl bg-[#F1ECE2] p-4 text-[13px] text-[#6E655C]">
            This return is {r.status.toLowerCase()} — no further action is needed.
          </p>
        )}
      </div>
    </div>
  );
}

function Steps({ status }) {
  const flow = ["Requested", "Approved", "Item Received", "Refunded"];
  if (status === "Rejected") {
    return (
      <div className="flex items-center gap-2 text-[13px]">
        <Dot done /> <span className="text-[#33231A]">Requested</span>
        <span className="text-[#6E655C]">→</span>
        <Dot danger /> <span className="font-semibold text-[#B8352C]">Rejected</span>
      </div>
    );
  }
  const idx = flow.indexOf(status);
  return (
    <div className="space-y-2">
      {flow.map((s, i) => (
        <div key={s} className="flex items-center gap-2.5 text-[13px]">
          <Dot done={i <= idx} />
          <span className={i <= idx ? "font-semibold text-[#33231A]" : "text-[#6E655C]"}>{s}</span>
          {i === idx && <span className="text-[11px] text-[#A5793A]">← current</span>}
        </div>
      ))}
    </div>
  );
}

function Dot({ done, danger }) {
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
        danger ? "bg-[#B8352C]" : done ? "bg-[#A5793A]" : "bg-[#33231A]/15"
      }`}
    />
  );
}

function Field({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-[#6E655C]">{label}</span>
      <span className={`text-right ${strong ? "font-semibold text-[#33231A]" : "text-[#33231A]"}`}>
        {value}
      </span>
    </div>
  );
}