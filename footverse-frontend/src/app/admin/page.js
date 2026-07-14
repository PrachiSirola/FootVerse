"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard } from "@/lib/admin";
import { usd } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { PageHeader, Card, Stat, Badge, Table, Td, BarChart, Empty } from "@/components/admin/ui";

const RANGES = [7, 30, 90];

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDashboard(days)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [days]);

  if (loading) return <Spinner fullPage label="Loading dashboard…" />;
  if (!data) return <Empty>Could not load the dashboard.</Empty>;

  const k = data.kpis;
  const pa = data.pendingActions;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Performance over the last ${days} days`}
        action={
          <div className="flex gap-1 rounded-lg border border-[#33231A]/10 bg-white p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`rounded px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  days === r ? "bg-[#33231A] text-white" : "text-[#6E655C] hover:text-[#33231A]"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue" value={usd(k.revenue)} sub={`${k.paidOrders} paid orders`} tone="gold" />
        <Stat label="Orders" value={k.orders} sub={`${k.delivered} delivered`} />
        <Stat label="Avg Order Value" value={usd(k.avgOrderValue)} />
        <Stat
          label="Cancel Rate"
          value={`${k.cancelRate}%`}
          sub={`${k.cancelled} cancelled`}
          tone={k.cancelRate > 15 ? "warn" : "default"}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Revenue graph */}
        <Card className="lg:col-span-2">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Revenue
          </p>
          <BarChart data={data.series} yKey="revenue" format={(v) => usd(v)} />
        </Card>

        {/* Pending actions — what needs the admin's attention */}
        <Card>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Needs attention
          </p>
          <div className="space-y-3">
            <ActionRow
              label="Open customer issues"
              count={pa.openIssues}
              href="/admin/issues"
            />
            <ActionRow
              label="Pending return requests"
              count={pa.pendingReturns}
              href="/admin/returns"
            />
            <ActionRow
              label="Orders not synced to CJ"
              count={pa.unsyncedOrders}
              href="/admin/orders"
            />
          </div>
        </Card>
      </div>

      {/* Orders graph */}
      <Card className="mb-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
          Orders per day
        </p>
        <BarChart data={data.series} yKey="orders" height={120} />
      </Card>

      {/* Recent orders */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
          Recent orders
        </p>
        <Link href="/admin/orders" className="text-[12px] font-semibold text-[#A5793A] hover:underline">
          View all →
        </Link>
      </div>
      {data.recentOrders.length === 0 ? (
        <Empty>No orders yet.</Empty>
      ) : (
        <Table head={["Order", "Customer", "Total", "Status", "Payment", "Date"]}>
          {data.recentOrders.map((o) => (
            <tr key={o._id} className="hover:bg-[#F7F4EF]">
              <Td>
                <Link href={`/admin/orders/${o._id}`} className="font-semibold hover:text-[#A5793A]">
                  {o.orderNumber}
                </Link>
              </Td>
              <Td className="text-[#6E655C]">{o.customer?.name || "—"}</Td>
              <Td className="font-semibold">{usd(o.grandTotal)}</Td>
              <Td><Badge>{o.orderStatus}</Badge></Td>
              <Td><Badge>{o.paymentStatus}</Badge></Td>
              <Td className="text-[#6E655C]">{new Date(o.createdAt).toLocaleDateString()}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

function ActionRow({ label, count, href }) {
  const urgent = count > 0;
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-[#33231A]/8 px-3.5 py-3 transition-colors hover:border-[#A5793A]/40"
    >
      <span className="text-[13px] text-[#33231A]">{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
          urgent ? "bg-[#B8352C]/10 text-[#B8352C]" : "bg-[#3a7a3a]/10 text-[#3a7a3a]"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}