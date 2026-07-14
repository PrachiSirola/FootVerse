"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAdminOrder, updateOrderStatus } from "@/lib/admin";
import { usd } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { PageHeader, Card, Badge, Empty, Stat } from "@/components/admin/ui";

/**
 * ADMIN order view. Deliberately contains NO customer actions — no Cancel Order,
 * no Request Return. An admin acting in the admin panel is an admin, full stop.
 * (When an admin shops, they use /orders/[id] like any customer.)
 */
const NEXT_STATUS = {
  Confirmed: ["Processing", "Packed", "Shipped"],
  Processing: ["Packed", "Shipped"],
  Packed: ["Shipped"],
  Shipped: ["Delivered"],
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const r = await getAdminOrder(id);
      setOrder(r.order);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [id]);

  async function advance(status) {
    setBusy(true);
    setNotice("");
    try {
      await updateOrderStatus(id, status);
      setNotice(`Order marked ${status}.`);
      await load();
    } catch (e) {
      setNotice(e?.response?.data?.message || "Could not update the status.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner fullPage label="Loading order…" />;
  if (!order) return <Empty>Order not found.</Empty>;

  const next = NEXT_STATUS[order.orderStatus] || [];
  const c = order.customer || {};
  const r = order.returnRequest;

  return (
    <>
      <Link href="/admin/orders" className="text-[12px] text-[#6E655C] hover:text-[#A5793A]">
        ← Orders
      </Link>

      <PageHeader
        title={order.orderNumber}
        subtitle={`Placed ${new Date(order.createdAt).toLocaleString()}`}
      />

      {notice && (
        <div className="mb-5 rounded-xl bg-[#A5793A]/10 px-4 py-3 text-[13px] text-[#33231A]">
          {notice}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total" value={usd(order.grandTotal)} tone="gold" />
        <Stat label="Status" value={order.orderStatus} />
        <Stat label="Payment" value={order.paymentStatus} />
        <Stat label="CJ sync" value={order.cjSyncStatus || "—"} />
      </div>

      {/* Fulfilment — the ONLY action an admin takes here */}
      <Card className="mb-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
          Fulfilment
        </p>
        {next.length > 0 ? (
          <>
            <p className="mb-3 text-[13px] text-[#6E655C]">
              Currently <Badge>{order.orderStatus}</Badge> — advance it to:
            </p>
            <div className="flex flex-wrap gap-2">
              {next.map((s) => (
                <button
                  key={s}
                  onClick={() => advance(s)}
                  disabled={busy}
                  className="rounded-lg bg-[#33231A] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-white transition-colors hover:bg-[#4A3526] disabled:opacity-60"
                >
                  {busy ? "Working…" : `Mark ${s}`}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#6E655C]">
            This order is <Badge>{order.orderStatus}</Badge> — no further fulfilment steps.
          </p>
        )}
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Customer */}
        <Card>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Customer
          </p>
          <div className="space-y-1.5 text-[13px]">
            <p className="font-semibold text-[#33231A]">{c.name || "—"}</p>
            <p className="text-[#6E655C]">{c.email}</p>
            {c.phone && <p className="text-[#6E655C]">{c.phone}</p>}
            <p className="pt-2 text-[#6E655C]">
              {c.address}
              {c.city && <>, {c.city}</>}
              {c.state && <>, {c.state}</>}
              {c.pin && <> — {c.pin}</>}
              {c.country && <><br />{c.country}</>}
            </p>
          </div>
        </Card>

        {/* Payment / totals */}
        <Card>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Payment
          </p>
          <div className="space-y-2 text-[13px]">
            <Row label="Method" value={order.paymentMethod} />
            <Row label="Subtotal" value={usd(order.subtotal)} />
            {order.shippingCharge > 0 && <Row label="Shipping" value={usd(order.shippingCharge)} />}
            {order.discount > 0 && <Row label="Discount" value={`− ${usd(order.discount)}`} />}
            <div className="border-t border-[#33231A]/10 pt-2">
              <Row label="Total" value={usd(order.grandTotal)} strong />
            </div>
            {order.refund?.status && order.refund.status !== "None" && (
              <p className="pt-1 text-[12px] text-[#6E655C]">
                Refund: <Badge>{order.refund.status}</Badge> {usd(order.refund.amount)}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Return request (read-only here — managed in Return Requests) */}
      {r && r.status !== "None" && (
        <Card className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
              Return request
            </p>
            <Link
              href="/admin/returns"
              className="text-[12px] font-semibold text-[#A5793A] hover:underline"
            >
              Manage in Return Requests →
            </Link>
          </div>
          <div className="space-y-1.5 text-[13px]">
            <p><Badge>{r.status}</Badge></p>
            <p className="text-[#6E655C]"><span className="font-semibold text-[#33231A]">Reason:</span> {r.reason}</p>
            {r.comments && <p className="text-[#6E655C]">{r.comments}</p>}
          </div>
        </Card>
      )}

      {/* Cancellation (read-only) */}
      {order.orderStatus === "Cancelled" && order.cancellation?.reason && (
        <Card className="mb-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Cancellation
          </p>
          <p className="text-[13px] text-[#6E655C]">
            {order.cancellation.reason}
            {order.cancellation.cancelledBy && <> · by {order.cancellation.cancelledBy}</>}
          </p>
        </Card>
      )}

      {/* Items */}
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
        Items
      </p>
      <div className="space-y-2">
        {(order.items || []).map((it, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-[#33231A]/8 bg-white p-4">
            {it.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#33231A]">{it.name}</p>
              <p className="text-[12px] text-[#6E655C]">
                Qty {it.quantity}
                {it.size && <> · Size {it.size}</>}
              </p>
            </div>
            <p className="text-[13px] font-semibold text-[#33231A]">{usd(it.subtotal)}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {order.timeline?.length > 0 && (
        <>
          <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Timeline
          </p>
          <Card>
            <div className="space-y-3">
              {[...order.timeline].reverse().map((t, i) => (
                <div key={i} className="flex gap-3 text-[13px]">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#A5793A]" />
                  <div>
                    <p className="font-semibold text-[#33231A]">{t.status}</p>
                    {t.note && <p className="text-[#6E655C]">{t.note}</p>}
                    <p className="text-[11px] text-[#6E655C]">{new Date(t.at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#6E655C]">{label}</span>
      <span className={strong ? "font-sans text-lg font-bold text-[#33231A]" : "font-semibold text-[#33231A]"}>
        {value}
      </span>
    </div>
  );
}