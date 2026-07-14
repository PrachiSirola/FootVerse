"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminOrders, getOrderAnalytics } from "@/lib/admin";
import { usd } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { PageHeader, Card, Table, Td, Badge, Funnel, Empty, Stat, Pager } from "@/components/admin/ui";

const TABS = ["All", "Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];

export default function AdminOrders() {
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderAnalytics().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAdminOrders({ status: tab, q, page, limit: 25 })
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tab, q, page]);

  return (
    <>
      <PageHeader title="Orders" subtitle="Manage and track every order" />

      {/* Analytics */}
      {stats && (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Stat label="Total orders" value={stats.total} />
          <Stat label="Delivered" value={stats.counts.Delivered} tone="gold" />
          <Card>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
              Fulfilment funnel
            </p>
            <Funnel stages={stats.funnel} />
          </Card>
        </div>
      )}

      {/* Status tabs */}
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
            {stats && t !== "All" && stats.counts[t] > 0 && (
              <span className="ml-1.5 opacity-60">{stats.counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setPage(1); }}
        placeholder="Search order number, customer name or email…"
        className="mb-4 w-full max-w-md rounded-lg border border-[#33231A]/12 bg-white px-3.5 py-2.5 text-[13px] focus:border-[#A5793A] focus:outline-none"
      />

      {loading ? (
        <Spinner label="Loading orders…" />
      ) : !data || data.orders.length === 0 ? (
        <Empty>No orders match this filter.</Empty>
      ) : (
        <>
          <Table head={["Order", "Customer", "Total", "Status", "Payment", "CJ Sync", "Date"]}>
            {data.orders.map((o) => (
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
                <Td><Badge>{o.orderStatus}</Badge></Td>
                <Td><Badge>{o.paymentStatus}</Badge></Td>
                <Td className="text-[11px] text-[#6E655C]">{o.cjSyncStatus || "—"}</Td>
                <Td className="text-[#6E655C]">{new Date(o.createdAt).toLocaleDateString()}</Td>
              </tr>
            ))}
          </Table>

          <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}
