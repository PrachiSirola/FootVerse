/**
 * USD price formatting. Prices are already in USD (e.g. 1.92 = $1.92).
 * `inr` name kept for backward-compat with existing imports, but it now
 * formats USD. Prefer `usd` in new code.
 */
export const usd = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Back-compat alias — existing components import { inr }.
export const inr = usd;

/** True when a product has no real price (exactly 0 / missing). */
export const isPriceless = (n) => !(Number(n) > 0);

/**
 * Display helper: returns "Price on Request" when price is 0/missing,
 * otherwise the formatted USD price.
 */
export const priceLabel = (n) => (isPriceless(n) ? "Price on Request" : usd(n));