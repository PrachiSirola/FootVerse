"use client";

import { useState } from "react";

const REASONS = [
  "Product damaged / defective",
  "Wrong item received",
  "Size doesn't fit",
  "Not as described",
  "Changed my mind",
  "Other",
];

export default function ReturnModal({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isCOD = order?.paymentMethod === "COD";
  const [useUpi, setUseUpi] = useState(true);
  const [bank, setBank] = useState({ accountName: "", accountNumber: "", ifsc: "", upiId: "" });

  async function submit() {
    const finalReason = reason === "Other" ? otherText.trim() : reason;
    if (!finalReason) {
      setError("Please select a reason.");
      return;
    }
    let bankDetails = undefined;
    if (isCOD) {
      if (useUpi) {
        if (!bank.upiId.trim()) return setError("Please enter your UPI ID for the refund.");
        bankDetails = { upiId: bank.upiId.trim() };
      } else {
        if (!bank.accountName.trim() || !bank.accountNumber.trim() || !bank.ifsc.trim())
          return setError("Please fill in all bank details.");
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
      await onConfirm({ reason: finalReason, comments: comments.trim() || undefined, bankDetails });
    } catch (e) {
      setError(e?.response?.data?.message || "Could not submit the return request.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-sans text-2xl font-bold text-[#33231A]">Return Order</h2>
        <p className="mt-1 text-sm text-[#6E655C]">
          Order {order?.orderNumber}. Select a reason for your return.
        </p>

        <div className="mt-4 space-y-2">
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
          {reason === "Other" && (
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Tell us more…"
              className="w-full rounded-lg border border-[#33231A]/15 p-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
              rows={2}
            />
          )}
        </div>

        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Additional comments (optional)"
          className="mt-3 w-full rounded-lg border border-[#33231A]/15 p-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
          rows={2}
        />

        {isCOD ? (
          <div className="mt-4 rounded-lg bg-[#F1ECE2] p-3.5">
            <p className="text-[13px] font-semibold text-[#33231A]">Refund details (COD order)</p>
            <div className="mt-2 flex gap-4 text-[13px]">
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
                className="mt-2.5 w-full rounded-lg border border-[#33231A]/15 p-2.5 text-sm focus:border-[#A5793A] focus:outline-none"
              />
            ) : (
              <div className="mt-2.5 space-y-2">
                <input value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} placeholder="Account holder name" className="w-full rounded-lg border border-[#33231A]/15 p-2.5 text-sm focus:border-[#A5793A] focus:outline-none" />
                <input value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} placeholder="Account number" className="w-full rounded-lg border border-[#33231A]/15 p-2.5 text-sm focus:border-[#A5793A] focus:outline-none" />
                <input value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} placeholder="IFSC code" className="w-full rounded-lg border border-[#33231A]/15 p-2.5 text-sm focus:border-[#A5793A] focus:outline-none" />
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-[#A5793A]/10 p-3 text-[13px] text-[#6E655C]">
            Once approved, your refund will be credited to your original payment method within 5–7
            working days.
          </p>
        )}

        {error && <p className="mt-3 text-[13px] text-[#B8352C]">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border-2 border-[#33231A]/15 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#33231A] transition-colors hover:border-[#33231A]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-xl bg-[#33231A] py-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#4A3526] disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit Return"}
          </button>
        </div>
      </div>
    </div>
  );
}