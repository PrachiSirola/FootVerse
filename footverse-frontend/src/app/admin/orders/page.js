"use client";

import { useEffect, useState } from "react";
import { OrderListSkeleton } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminReconcileReport, adminReconcileRun } from "@/lib/order";
import Spinner from "@/components/ui/Spinner";

export default function AdminOrdersPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  useEffect(() => {
    if (ready && (!user || !user.isAdmin)) router.replace("/");
  }, [ready, user, router]);

  async function loadReport() {
    setLoading(true);
    try {
      setReport(await adminReconcileReport());
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (ready && user?.isAdmin) loadReport();
  }, [ready, user]);

  async function runReconcile() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await adminReconcileRun();
      setRunResult(res);
      await loadReport();
    } catch (e) {
      setRunResult({ error: e?.response?.data?.message || "Reconcile failed." });
    } finally {
      setRunning(false);
    }
  }

  if (!ready || loading) return <div className="mx-auto max-w-4xl px-5 py-10"><OrderListSkeleton rows={3} /></div>;
  if (!user?.isAdmin) return null;

  const counts = report?.counts || {};

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="mb-2 font-playfair text-3xl font-bold text-[#33231A]">Order Sync Health</h1>
      <p className="mb-8 text-sm text-[#6E655C]">
        Consistency between MongoDB and CJ Dropshipping.
      </p>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total orders" value={report?.total ?? 0} />
        <Stat label="Inconsistent" value={report?.inconsistent ?? 0} highlight={report?.inconsistent > 0} />
        <Stat label="Synced" value={counts.synced ?? 0} />
        <Stat label="Mongo-only" value={counts["mongo-only"] ?? 0} highlight={(counts["mongo-only"] ?? 0) > 0} />
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button
          onClick={runReconcile}
          disabled={running || (report?.inconsistent ?? 0) === 0}
          className="rounded-xl bg-[#33231A] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#4A3526] disabled:opacity-50"
        >
          {running ? "Reconciling…" : "Fix inconsistent orders"}
        </button>
        <button
          onClick={loadReport}
          className="rounded-xl border-2 border-[#33231A]/15 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#33231A] transition-colors hover:border-[#33231A]"
        >
          Refresh
        </button>
        {(report?.inconsistent ?? 0) === 0 && (
          <span className="text-[13px] font-semibold text-[#3a7a3a]">✓ Everything is in sync</span>
        )}
      </div>

      {running && (
        <p className="mb-4 text-[13px] text-[#6E655C]">
          Re-syncing to CJ with rate-limit spacing — this can take a moment per order…
        </p>
      )}

      {runResult && !runResult.error && (
        <div className="mb-6 rounded-xl bg-[#A5793A]/10 p-4 text-[13px] text-[#33231A]">
          Reconcile complete — fixed {runResult.fixed} of {runResult.attempted} attempted.
        </div>
      )}
      {runResult?.error && (
        <div className="mb-6 rounded-xl bg-[#B8352C]/10 p-4 text-[13px] text-[#B8352C]">{runResult.error}</div>
      )}

      {/* Inconsistent list */}
      {report?.buckets?.["mongo-only"]?.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[#33231A]">
            In MongoDB but not synced to CJ
          </h2>
          <div className="space-y-2">
            {report.buckets["mongo-only"].map((o) => (
              <div key={o.orderNumber} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F1ECE2] px-3.5 py-2.5 text-[13px]">
                <span className="font-semibold text-[#33231A]">{o.orderNumber}</span>
                <span className="text-[#6E655C]">{o.orderStatus} · {o.cjSyncStatus}</span>
                {o.error && <span className="text-[#B8352C]">{o.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${highlight ? "bg-[#B8352C]/10" : "bg-white"}`}>
      <p className={`text-2xl font-bold ${highlight ? "text-[#B8352C]" : "text-[#33231A]"}`}>{value}</p>
      <p className="mt-0.5 text-[12px] text-[#6E655C]">{label}</p>
    </div>
  );
}