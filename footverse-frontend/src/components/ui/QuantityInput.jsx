"use client";

import { useEffect, useState } from "react";

/**
 * B2B quantity selector: +/− buttons AND a typeable input, so wholesale buyers
 * can enter large quantities directly (e.g. 250) instead of clicking + 250 times.
 *
 * Behaviour:
 *  - No upper cap. Minimum is 1.
 *  - The field may be left EMPTY while typing (so users can clear and retype);
 *    it clamps to a valid number on blur.
 *  - If `stock` is provided and the quantity exceeds it, a warning is shown —
 *    but the value is NOT blocked (the buyer decides).
 */
export default function QuantityInput({
  value,
  onChange,
  stock = 0,
  size = "md",
  className = "",
}) {
  // Local text state lets the input be temporarily empty/partial while typing.
  const [text, setText] = useState(String(value ?? 1));

  // Keep the visible text in sync when the value changes from outside (e.g. +/−).
  useEffect(() => {
    setText(String(value ?? 1));
  }, [value]);

  const commit = (raw) => {
    const s = String(raw).trim();
    // A leading "-" means the user meant a negative — treat as invalid, not as
    // the positive digits that follow. (The typing filter blocks "-" anyway, so
    // this is belt-and-braces.)
    const n = s.startsWith("-") ? NaN : parseInt(s.replace(/[^\d]/g, ""), 10);
    const next = Number.isFinite(n) && n >= 1 ? n : 1; // clamp: empty/0/invalid → 1
    setText(String(next));
    if (next !== value) onChange(next);
  };

  const handleType = (e) => {
    const raw = e.target.value;
    // Allow an empty field and digits only while typing.
    if (raw === "" || /^\d+$/.test(raw)) {
      setText(raw);
      // Push valid numbers up immediately so totals stay live as they type.
      if (raw !== "") {
        const n = parseInt(raw, 10);
        if (n >= 1 && n !== value) onChange(n);
      }
    }
  };

  const pad = size === "sm" ? "px-2 py-1" : "px-2.5 py-1.5";
  const inputW = size === "sm" ? "w-12" : "w-16";
  const overStock = stock > 0 && value > stock;

  return (
    <div className={className}>
      <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-[#33231A]/20">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, (Number(value) || 1) - 1))}
          disabled={(Number(value) || 1) <= 1}
          className={`${pad} text-base leading-none text-[#33231A] transition-colors hover:bg-[#F1ECE2] disabled:cursor-not-allowed disabled:opacity-40`}
          aria-label="Decrease quantity"
        >
          −
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={text}
          onChange={handleType}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className={`${inputW} border-x border-[#33231A]/15 bg-white text-center text-sm font-semibold text-[#33231A] outline-none focus:bg-[#F7F4EF]`}
          aria-label="Quantity"
        />

        <button
          type="button"
          onClick={() => onChange((Number(value) || 1) + 1)}
          className={`${pad} text-base leading-none text-[#33231A] transition-colors hover:bg-[#F1ECE2]`}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {overStock && (
        <p className="mt-1.5 text-[12px] text-[#B8352C]">
          Only {stock.toLocaleString()} in stock — larger orders may ship in batches.
        </p>
      )}
    </div>
  );
}