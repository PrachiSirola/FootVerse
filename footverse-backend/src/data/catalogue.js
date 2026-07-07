import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const CATALOGUE = JSON.parse(readFileSync(join(here, "catalogue.json"), "utf8"));

const BY_ID = new Map(CATALOGUE.map((p) => [p.id, p]));

export const getProduct = (id) => BY_ID.get(id) || null;

/** Lightweight text search over the bundled catalogue. */
export function searchCatalogue(q, limit = 8) {
  const needle = String(q || "").trim().toLowerCase();
  if (!needle) return [];
  const scored = [];
  for (const p of CATALOGUE) {
    const hay = `${p.name} ${p.brand} ${p.categoryName} ${p.subcategory}`.toLowerCase();
    const idx = hay.indexOf(needle);
    if (idx !== -1) scored.push([idx, p]);
  }
  scored.sort((a, b) => a[0] - b[0]);
  return scored.slice(0, limit).map(([, p]) => p);
}