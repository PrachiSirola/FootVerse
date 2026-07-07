"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ page, pages }) {
  const router = useRouter();
  const sp = useSearchParams();
  if (pages <= 1) return null;

  const go = (p) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(p));
    router.push(`/products?${next.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className="rounded-lg border border-[#33231A]/15 px-3.5 py-2 text-sm text-[#33231A] transition-colors hover:border-[#A5793A] disabled:opacity-35"
      >
        ← Prev
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => go(p)}
          aria-current={p === page ? "page" : undefined}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-[#33231A] text-white" : "border border-[#33231A]/15 text-[#33231A] hover:border-[#A5793A]"}`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => go(page + 1)}
        className="rounded-lg border border-[#33231A]/15 px-3.5 py-2 text-sm text-[#33231A] transition-colors hover:border-[#A5793A] disabled:opacity-35"
      >
        Next →
      </button>
    </nav>
  );
}