"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { submitIssue, myIssues } from "@/lib/admin";
import { getOrders } from "@/lib/order";
import Spinner from "@/components/ui/Spinner";

const CATEGORIES = ["Payment", "Order", "Delivery", "Product", "Refund", "Other"];

export default function SupportPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "Order", subject: "", description: "", orderId: "" });

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/support");
  }, [ready, user, router]);

  async function load() {
    try {
      const [o, i] = await Promise.all([getOrders().catch(() => []), myIssues().catch(() => ({ issues: [] }))]);
      setOrders(Array.isArray(o) ? o : []);
      setIssues(i.issues || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (ready && user) load(); }, [ready, user]);

  async function submit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      return setError("Please provide a subject and a description.");
    }
    setBusy(true);
    setError("");
    try {
      const r = await submitIssue({
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
        orderId: form.orderId || undefined,
      });
      setDone(r.issue);
      setForm({ category: "Order", subject: "", description: "", orderId: "" });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit your issue.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || loading) return <Spinner fullPage label="Loading…" />;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-sans-serif text-3xl font-bold text-[#33231A]">Support</h1>
      <p className="mt-1 text-sm text-[#6E655C]">
        Raise a payment or order issue and our team will respond.
      </p>

      {done && (
        <div className="mt-6 rounded-xl bg-[#3a7a3a]/10 p-4 text-[13px] text-[#33231A]">
          Issue <strong>{done.ticketNumber}</strong> submitted. We&apos;ll be in touch shortly.
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[12px] font-semibold text-[#6E655C]">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6E655C]">Related order (optional)</label>
            <select
              value={form.orderId}
              onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
            >
              <option value="">— None —</option>
              {orders.map((o) => (
                <option key={o._id} value={o._id}>{o.orderNumber}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-[#6E655C]">Subject</label>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Brief summary of the issue"
            className="mt-1 w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[12px] font-semibold text-[#6E655C]">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            placeholder="Tell us what happened"
            className="mt-1 w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
          />
        </div>

        {error && <p className="text-[13px] text-[#B8352C]">{error}</p>}

        <button
          disabled={busy}
          className="w-full rounded-xl bg-[#33231A] py-3.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#4A3526] disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit issue"}
        </button>
      </form>

      {issues.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-[#6E655C]">
            Your issues
          </h2>
          <div className="space-y-3">
            {issues.map((i) => (
              <div key={i._id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-[#33231A]">{i.subject}</p>
                  <span className="rounded-full bg-[#33231A]/8 px-2.5 py-1 text-[11px] font-semibold text-[#33231A]">
                    {i.status}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[#6E655C]">
                  {i.ticketNumber} · {i.category}
                  {i.orderNumber && <> · Order {i.orderNumber}</>}
                </p>
                {i.replies?.length > 0 && (
                  <p className="mt-2 rounded-lg bg-[#F1ECE2] p-3 text-[13px] text-[#33231A]">
                    <span className="font-semibold">Latest reply: </span>
                    {i.replies[i.replies.length - 1].message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}