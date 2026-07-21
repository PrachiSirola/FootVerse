"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getOrder, requestReturn } from "@/lib/order";
import { usd } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";

const REASONS = [
  "Product damaged / defective",
  "Wrong item received",
  "Size doesn't fit",
  "Not as described",
  "Quality not as expected",
  "Ordered by mistake",
  "Other",
];

export default function ReturnRequestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  // Form fields the customer fills in.
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [comments, setComments] = useState("");
  const [contact, setContact] = useState("");

  // COD refunds need payout details.
  const [useUpi, setUseUpi] = useState(true);
  const [bank, setBank] = useState({ accountName: "", accountNumber: "", ifsc: "", upiId: "" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getOrder(id);
        if (alive) {
          setOrder(data);
          setContact(data?.customer?.phone || data?.customer?.email || "");
        }
      } catch {
        if (alive) setError("Could not load this order.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const isCOD = order?.paymentMethod === "COD";

  async function submit(e) {
    e?.preventDefault?.();
    const finalReason = reason === "Other" ? otherReason.trim() : reason;
    if (!finalReason) return setError("Please select a reason for the return.");
    if (!contact.trim()) return setError("Please provide a contact phone or email.");

    let bankDetails;
    if (isCOD) {
      if (useUpi) {
        if (!bank.upiId.trim()) return setError("Please enter a UPI ID for the refund.");
        bankDetails = { upiId: bank.upiId.trim() };
      } else {
        if (!bank.accountName.trim() || !bank.accountNumber.trim() || !bank.ifsc.trim())
          return setError("Please complete all bank details for the refund.");
        bankDetails = {
          accountName: bank.accountName.trim(),
          accountNumber: bank.accountNumber.trim(),
          ifsc: bank.ifsc.trim(),
        };
      }
    }

    setBusy(true);
    setError("");
    try {
      const res = await requestReturn(id, {
        reason: finalReason,
        comments: comments.trim() || undefined,
        contact: contact.trim(),
        bankDetails,
      });
      setDone(res);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit the return request.");
      setBusy(false);
    }
  }

  if (loading) return <Spinner fullPage label="Loading order…" />;

  if (error && !order) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-sans-serif text-2xl font-bold text-[#33231A]">Order not found</h1>
        <Link href="/orders" className="mt-4 inline-block text-[#A5793A] underline">
          Back to your orders
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-sans-serif text-3xl font-bold text-[#33231A]">Return request submitted</h1>
        <p className="mt-3 text-[#6E655C]">{done.message}</p>
        {done.refundNote && (
          <p className="mt-2 rounded-xl bg-[#A5793A]/10 p-4 text-[13px] text-[#6E655C]">{done.refundNote}</p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={`/orders/${id}`}
            className="rounded-xl border-2 border-[#33231A] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#33231A] transition-colors hover:bg-[#33231A] hover:text-white"
          >
            View order
          </Link>
          <Link
            href="/orders"
            className="rounded-xl bg-[#33231A] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#4A3526]"
          >
            All orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href={`/orders/${id}`} className="text-[13px] text-[#6E655C] hover:text-[#A5793A]">
        ← Back to order
      </Link>

      <h1 className="mt-4 font-sans-serif text-3xl font-bold text-[#33231A]">Return Request</h1>
      <p className="mt-1 text-sm text-[#6E655C]">
        Complete the form below. Our team will review your request and respond shortly.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        {/* Auto-filled, read-only order details */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E655C]">
            Order details
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[12px] font-semibold text-[#6E655C]">Order ID</label>
              <input
                value={order?.orderNumber || ""}
                readOnly
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-[#33231A]/10 bg-[#F1ECE2] px-3 py-2.5 text-sm text-[#33231A]"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#6E655C]">Amount Paid</label>
              <input
                value={usd(order?.grandTotal)}
                readOnly
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-[#33231A]/10 bg-[#F1ECE2] px-3 py-2.5 text-sm font-semibold text-[#33231A]"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#6E655C]">Payment Method</label>
              <input
                value={order?.paymentMethod || ""}
                readOnly
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-[#33231A]/10 bg-[#F1ECE2] px-3 py-2.5 text-sm text-[#33231A]"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#6E655C]">Order Date</label>
              <input
                value={order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                readOnly
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-[#33231A]/10 bg-[#F1ECE2] px-3 py-2.5 text-sm text-[#33231A]"
              />
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E655C]">
            Reason for Return <span className="text-[#B8352C]">*</span>
          </label>
          <div className="mt-3 space-y-2">
            {REASONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[#33231A]">
                <input
                  type="radio"
                  name="return-reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="h-4 w-4 accent-[#A5793A]"
                />
                {r}
              </label>
            ))}
          </div>
          {reason === "Other" && (
            <input
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              placeholder="Please specify the reason"
              className="mt-3 w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
            />
          )}
        </div>

        {/* Comments + contact */}
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <label className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E655C]">
              Additional Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Describe the issue in more detail (optional)"
              className="mt-2 w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E655C]">
              Contact (phone or email) <span className="text-[#B8352C]">*</span>
            </label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="How can we reach you about this return?"
              className="mt-2 w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
            />
          </div>
        </div>

        {/* Refund destination */}
        {isCOD ? (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <label className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6E655C]">
              Refund Details (COD order) <span className="text-[#B8352C]">*</span>
            </label>
            <div className="mt-3 flex gap-4 text-[13px]">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="radio" checked={useUpi} onChange={() => setUseUpi(true)} className="accent-[#A5793A]" /> UPI
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="radio" checked={!useUpi} onChange={() => setUseUpi(false)} className="accent-[#A5793A]" /> Bank Account
              </label>
            </div>
            {useUpi ? (
              <input
                value={bank.upiId}
                onChange={(e) => setBank({ ...bank, upiId: e.target.value })}
                placeholder="yourname@upi"
                className="mt-3 w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
              />
            ) : (
              <div className="mt-3 space-y-2">
                <input value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} placeholder="Account holder name" className="w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none" />
                <input value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} placeholder="Account number" className="w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none" />
                <input value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} placeholder="IFSC code" className="w-full rounded-lg border border-[#33231A]/15 px-3 py-2.5 text-sm focus:border-[#A5793A] focus:outline-none" />
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-[#A5793A]/10 p-4 text-[13px] text-[#6E655C]">
            Once approved, your refund of <strong className="text-[#33231A]">{usd(order?.grandTotal)}</strong> will be
            credited to your original payment method within 5–7 working days.
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-[#B8352C]/10 px-4 py-3 text-[13px] text-[#B8352C]">{error}</p>
        )}

        <div className="flex gap-3">
          <Link
            href={`/orders/${id}`}
            className="flex-1 rounded-xl border-2 border-[#33231A]/15 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.06em] text-[#33231A] transition-colors hover:border-[#33231A]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-xl bg-[#33231A] py-3.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#4A3526] disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit Return Request"}
          </button>
        </div>
      </form>
    </div>
  );
}