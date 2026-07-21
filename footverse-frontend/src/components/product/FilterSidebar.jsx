"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { CATEGORIES as STATIC_CATEGORIES } from "@/data/categories";


function Section({ title, children }) {
  return (
    <div className="border-b border-[#33231A]/10 py-5 first:pt-0 last:border-0">
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#33231A]">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function FilterSidebar() {
  const router = useRouter();
  const sp = useSearchParams();

  // Accepts set("key", "value") OR set({ key1: val1, key2: val2 }) so multiple
  // params update in ONE router.replace (avoids the stale-sp race where two
  // back-to-back calls clobber each other).
  const set = (keyOrObj, value) => {
    const next = new URLSearchParams(sp.toString());
    const pairs = typeof keyOrObj === "object" ? keyOrObj : { [keyOrObj]: value };
    for (const [k, v] of Object.entries(pairs)) {
      if (v === "" || v === null || v === undefined) next.delete(k);
      else next.set(k, v);
    }
    next.delete("page"); // any filter change resets pagination
    router.replace(`/products?${next.toString()}`, { scroll: false });
  };

  // Build the category tree from REAL data (only options that return products).
  // Falls back to the static list if the request fails.
  const [categories, setCategories] = useState(STATIC_CATEGORIES);
  useEffect(() => {
    let alive = true;
    api
      .get("/products/facets")
      .then((r) => {
        const rows = Array.isArray(r.data) ? r.data : [];
        if (!rows.length) return;
        const built = rows.map((c) => ({
          slug: String(c.name).toLowerCase(),
          name: c.name,
          count: c.count,
          subs: (c.subs || []).map((sub) => sub.name),
        }));
        if (alive) setCategories(built);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const activeCat = sp.get("category") || "";
  const cat = categories.find((c) => c.slug === activeCat);

  return (
    <aside className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-lg font-semibold uppercase tracking-wide text-[#33231A]">
          Filters
        </h2>
        <button
          type="button"
          onClick={() => router.replace("/products", { scroll: false })}
          className="text-xs font-medium text-[#A5793A] underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      </div>

      <Section title="Category">
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => set({ sub: "", category: activeCat === c.slug ? "" : c.slug })}
                className={`text-[13.5px] transition-colors ${activeCat === c.slug ? "font-semibold text-[#A5793A]" : "text-[#33231A] hover:text-[#A5793A]"}`}
              >
                {c.name}
              </button>
              {activeCat === c.slug && (
                <ul className="mt-2 space-y-1.5 border-l border-[#A5793A]/30 pl-3">
                  {c.subs.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => set("sub", sp.get("sub") === s ? "" : s)}
                        className={`text-[12.5px] transition-colors ${sp.get("sub") === s ? "font-semibold text-[#A5793A]" : "text-[#6E655C] hover:text-[#33231A]"}`}
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={sp.get("min") || ""}
            onBlur={(e) => set("min", e.target.value)}
            className="w-full rounded-lg border border-[#33231A]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#A5793A]"
          />
          <span className="text-[#6E655C]">–</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={sp.get("max") || ""}
            onBlur={(e) => set("max", e.target.value)}
            className="w-full rounded-lg border border-[#33231A]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#A5793A]"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[[0, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 0]].map(([lo, hi]) => (
            <button
              key={`${lo}-${hi}`}
              type="button"
              onClick={() => set({ min: lo ? String(lo) : "", max: hi ? String(hi) : "" })}
              className="rounded-full border border-[#33231A]/15 px-3 py-1 text-[11.5px] text-[#33231A] transition-colors hover:border-[#A5793A] hover:text-[#A5793A]"
            >
              {hi ? `$${lo}–$${hi}` : `$${lo}+`}
            </button>
          ))}
        </div>
      </Section>

    </aside>
  );
}