"use client";

import { useState } from "react";

const REASONS = [
  "Ordered by mistake",
  "Changed my mind",
  "Better price elsewhere",
  "Delivery taking too long",
  "Wrong product",
  "Other",
];

export default function CancelModal({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isOnline = order?.paymentMethod === "Stripe" && order?.paymentStatus === "Paid";

  async function submit() {
    const finalReason = reason === "Other" ? otherText.trim() : reason;
    if (!finalReason) {
      setError("Please select a reason.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm(finalReason);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not cancel the order.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-sans text-2xl font-bold text-[#33231A]">Cancel Order</h2>
        <p className="mt-1 text-sm text-[#6E655C]">
          Order {order?.orderNumber}. Please tell us why you're cancelling.
        </p>

        <div className="mt-4 space-y-2">
          {REASONS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[#33231A]">
              <input
                type="radio"
                name="cancel-reason"
                checked={reason === r}
                onChange={() => setReason(r)}
                className="h-4 w-4 accent-[#A5793A]"
              />
              {r}
            </label>
          ))}
          {reason === "Other" && (
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Tell us more…"
              className="mt-1 w-full rounded-lg border border-[#33231A]/15 p-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
              rows={2}
            />
          )}
        </div>

        {isOnline && (
          <p className="mt-4 rounded-lg bg-[#A5793A]/10 p-3 text-[13px] text-[#6E655C]">
            Your payment was made online. The refund will be processed to your original payment
            method within 5–7 working days.
          </p>
        )}

        {error && <p className="mt-3 text-[13px] text-[#B8352C]">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border-2 border-[#33231A]/15 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#33231A] transition-colors hover:border-[#33231A]"
          >
            Keep Order
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-xl bg-[#B8352C] py-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#9c2c24] disabled:opacity-60"
          >
            {busy ? "Cancelling…" : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}