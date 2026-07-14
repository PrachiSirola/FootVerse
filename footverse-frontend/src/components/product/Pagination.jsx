"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Numbered pagination with Previous / Next.
 *
 * With a large catalogue (10,000 products at 15/page ≈ 667 pages) rendering
 * every page number is unusable, so the list is WINDOWED around the current
 * page with ellipses, always keeping the first and last page reachable:
 *
 *   ‹ Prev   1 … 24 [25] 26 … 667   Next ›
 */
function pageWindow(page, pages) {
  const span = 1;                       // pages either side of the current one
  const out = new Set([1, pages]);      // first + last are always reachable
  for (let p = page - span; p <= page + span; p++) {
    if (p >= 1 && p <= pages) out.add(p);
  }
  // Pad the ends so the control doesn't jump around near the edges.
  if (page <= 3) [2, 3, 4].forEach((p) => p <= pages && out.add(p));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((p) => p >= 1 && out.add(p));

  const sorted = [...out].sort((a, b) => a - b);
  const withGaps = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) withGaps.push("…");
    withGaps.push(p);
    prev = p;
  }
  return withGaps;
}

export default function Pagination({ page, pages, total }) {
  const router = useRouter();
  const sp = useSearchParams();
  if (pages <= 1) return null;

  // Preserve every other query param (category, sub, q, sort, price) so
  // filtering / searching / sorting survive a page change.
  const go = (p) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(p));
    router.push(`/products?${next.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const items = pageWindow(page, pages);

  return (
    <nav className="mt-10" aria-label="Pagination">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className="rounded-lg border border-[#33231A]/15 px-3.5 py-2 text-sm font-medium text-[#33231A] transition-colors hover:border-[#A5793A] disabled:cursor-not-allowed disabled:opacity-35"
        >
          ‹ Previous
        </button>

        {items.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1.5 text-sm text-[#6E655C]" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              className={`h-10 min-w-[2.5rem] rounded-lg px-2 text-sm font-medium transition-colors ${
                p === page
                  ? "bg-[#33231A] text-white"
                  : "border border-[#33231A]/15 text-[#33231A] hover:border-[#A5793A]"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => go(page + 1)}
          className="rounded-lg border border-[#33231A]/15 px-3.5 py-2 text-sm font-medium text-[#33231A] transition-colors hover:border-[#A5793A] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Next ›
        </button>
      </div>

      <p className="mt-3 text-center text-[12px] text-[#6E655C]">
        Page {page.toLocaleString()} of {pages.toLocaleString()}
        {total ? <> · {total.toLocaleString()} products</> : null}
      </p>
    </nav>
  );
}