/**
 * USD price formatting. Prices are already in USD (e.g. 1.92 = $1.92).
 * `inr` name kept for backward-compat with existing imports, but it now
 * formats USD. Prefer `usd` in new code.
 */
export const usd = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Back-compat alias — existing components import { inr }.
export const inr = usd;