"use client";

import { useEffect, useState } from "react";
import { getFinance, getFinanceSettings, updateFinanceSettings } from "@/lib/admin";
import { usd } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { PageHeader, Card, Stat, Empty } from "@/components/admin/ui";

const RANGES = [7, 30, 90];

export default function AdminFinance() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [f, s] = await Promise.all([getFinance(days), getFinanceSettings()]);
      setData(f);
      setSettings(s.settings);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [days]);

  async function saveSettings(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await updateFinanceSettings({
        gstRate: Number(settings.gstRate),
        commissionRate: Number(settings.commissionRate),
        gatewayFeePercent: Number(settings.gatewayFeePercent),
        gatewayFeeFixed: Number(settings.gatewayFeeFixed),
        settlementCycleDays: Number(settings.settlementCycleDays),
      });
      setMsg("Rates saved — figures recalculated.");
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner fullPage label="Loading finance…" />;
  if (!data) return <Empty>Could not load finance data.</Empty>;

  const s = data.summary;

  return (
    <>
      <PageHeader
        title="Commission & Finance"
        subtitle={`Computed from paid orders over the last ${days} days`}
        action={
          <div className="flex gap-1 rounded-lg border border-[#33231A]/10 bg-white p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`rounded px-3 py-1.5 text-[12px] font-semibold ${
                  days === r ? "bg-[#33231A] text-white" : "text-[#6E655C]"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Gross revenue" value={usd(s.grossRevenue)} sub={`${s.orders} paid orders`} tone="gold" />
        <Stat label="GST" value={usd(s.gst)} sub={`${data.rates.gstRate}% (inclusive)`} />
        <Stat label="Gateway fees" value={usd(s.gatewayFees)} sub={`${data.rates.gatewayFeePercent}% + ${usd(data.rates.gatewayFeeFixed)}`} />
        <Stat label="Commission" value={usd(s.commission)} sub={`${data.rates.commissionRate}% of net`} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Settlement breakdown */}
        <Card>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Settlement breakdown
          </p>
          <div className="space-y-2.5 text-[13px]">
            <Row label="Gross revenue" value={usd(s.grossRevenue)} />
            <Row label={`GST (${data.rates.gstRate}%)`} value={`− ${usd(s.gst)}`} negative />
            <Row label="Payment gateway fees" value={`− ${usd(s.gatewayFees)}`} negative />
            <Row label={`Commission (${data.rates.commissionRate}%)`} value={`− ${usd(s.commission)}`} negative />
            <Row label="Coupon cost" value={`− ${usd(s.couponCost)}`} negative />
            <Row label="Refunds issued" value={`− ${usd(s.refunded)}`} negative />
            <div className="!mt-4 border-t border-[#33231A]/10 pt-3">
              <Row label="Net settlement" value={usd(s.netSettlement)} strong />
            </div>
            <p className="pt-1 text-[11px] text-[#6E655C]">
              Settled every {data.rates.settlementCycleDays} days.
            </p>
          </div>
        </Card>

        {/* Rates */}
        <Card>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">
            Rates
          </p>
          <form onSubmit={saveSettings} className="space-y-3">
            <Field label="GST rate (%)" value={settings.gstRate} onChange={(v) => setSettings({ ...settings, gstRate: v })} />
            <Field label="Commission rate (%)" value={settings.commissionRate} onChange={(v) => setSettings({ ...settings, commissionRate: v })} />
            <Field label="Gateway fee (%)" value={settings.gatewayFeePercent} onChange={(v) => setSettings({ ...settings, gatewayFeePercent: v })} />
            <Field label="Gateway fixed fee (USD)" value={settings.gatewayFeeFixed} onChange={(v) => setSettings({ ...settings, gatewayFeeFixed: v })} />
            <Field label="Settlement cycle (days)" value={settings.settlementCycleDays} onChange={(v) => setSettings({ ...settings, settlementCycleDays: v })} />
            <button
              disabled={saving}
              className="w-full rounded-lg bg-[#33231A] py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save rates"}
            </button>
            {msg && <p className="text-[12px] text-[#6E655C]">{msg}</p>}
          </form>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value, negative, strong }) {
  return (
    <div className="flex justify-between">
      <span className={strong ? "font-semibold text-[#33231A]" : "text-[#6E655C]"}>{label}</span>
      <span className={`${strong ? "font-sans-serif text-lg font-bold text-[#33231A]" : negative ? "text-[#B8352C]" : "font-semibold text-[#33231A]"}`}>
        {value}
      </span>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-[#6E655C]">{label}</label>
      <input
        type="number" step="0.01" min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[#33231A]/12 px-3 py-2 text-[13px] focus:border-[#A5793A] focus:outline-none"
      />
    </div>
  );
}