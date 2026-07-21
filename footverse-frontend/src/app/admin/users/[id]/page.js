"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getUser, adjustWallet } from "@/lib/admin";
import { usd } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { PageHeader, Card, Table, Td, Badge, Stat, Empty } from "@/components/admin/ui";

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "credit", amount: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      setData(await getUser(id));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [id]);

  async function submitWallet(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await adjustWallet(id, { type: form.type, amount: Number(form.amount), reason: form.reason });
      setForm({ type: "credit", amount: "", reason: "" });
      setMsg("Wallet updated.");
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Could not update the wallet.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner fullPage label="Loading user…" />;
  if (!data) return <Empty>User not found.</Empty>;

  const { user, orders, stats } = data;

  return (
    <>
      <Link href="/admin/users" className="text-[12px] text-[#6E655C] hover:text-[#A5793A]">← Users</Link>
      <PageHeader title={user.name} subtitle={user.email} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Orders" value={stats.orderCount} />
        <Stat label="Total spend" value={usd(stats.totalSpend)} tone="gold" />
        <Stat label="Wallet" value={usd(user.wallet?.balance || 0)} />
        <Stat label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Wallet */}
        <Card>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">Wallet</p>
          <p className="font-sans-serif text-2xl font-bold text-[#33231A]">{usd(user.wallet?.balance || 0)}</p>

          <form onSubmit={submitWallet} className="mt-4 space-y-2.5">
            <div className="flex gap-2">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-lg border border-[#33231A]/12 px-3 py-2 text-[13px]"
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
              <input
                type="number" step="0.01" min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount"
                className="w-28 rounded-lg border border-[#33231A]/12 px-3 py-2 text-[13px]"
                required
              />
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Reason"
                className="flex-1 rounded-lg border border-[#33231A]/12 px-3 py-2 text-[13px]"
              />
            </div>
            <button
              disabled={busy}
              className="w-full rounded-lg bg-[#33231A] py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-60"
            >
              {busy ? "Updating…" : "Adjust wallet"}
            </button>
            {msg && <p className="text-[12px] text-[#6E655C]">{msg}</p>}
          </form>

          {user.wallet?.transactions?.length > 0 && (
            <div className="mt-4 max-h-40 space-y-1.5 overflow-y-auto">
              {[...user.wallet.transactions].reverse().map((t, i) => (
                <div key={i} className="flex justify-between text-[12px]">
                  <span className="text-[#6E655C]">{t.reason || t.type}</span>
                  <span className={t.type === "credit" ? "text-[#3a7a3a]" : "text-[#B8352C]"}>
                    {t.type === "credit" ? "+" : "−"}{usd(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Addresses */}
        <Card>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">Addresses</p>
          {!user.addresses?.length ? (
            <p className="text-[13px] text-[#6E655C]">No saved addresses.</p>
          ) : (
            <div className="space-y-2.5">
              {user.addresses.map((a, i) => (
                <div key={i} className="rounded-lg bg-[#F7F4EF] p-3 text-[13px]">
                  <p className="font-semibold text-[#33231A]">{a.name}</p>
                  <p className="text-[#6E655C]">{a.address}, {a.city} {a.pin}</p>
                  {a.phone && <p className="text-[12px] text-[#6E655C]">{a.phone}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">Order history</p>
      {orders.length === 0 ? (
        <Empty>This user has no orders.</Empty>
      ) : (
        <Table head={["Order", "Total", "Status", "Payment", "Date"]}>
          {orders.map((o) => (
            <tr key={o._id} className="hover:bg-[#F7F4EF]">
              <Td>
                <Link href={`/admin/orders/${o._id}`} className="font-semibold hover:text-[#A5793A]">{o.orderNumber}</Link>
              </Td>
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