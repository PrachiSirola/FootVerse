"use client";

import { useEffect, useMemo, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES } from "@/data/categories";
import FilterSidebar from "./FilterSidebar";
import Pagination from "./Pagination";
import ProductCard from "./ProductCard";

const SORTS = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["rating", "Top Rated"],
  ["discount", "Biggest Discount"],
];

export default function Listing() {
  const sp = useSearchParams();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const criteria = useMemo(() => ({
    q: sp.get("q") || "",
    category: sp.get("category") || "",
    sub: sp.get("sub") || "",
    sort: sp.get("sort") || "featured",
  }), [sp]);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);

        const params = {
          category: criteria.category
            ? criteria.category.charAt(0).toUpperCase() + criteria.category.slice(1)
            : undefined,
          sub: criteria.sub || undefined,
          q: criteria.q || undefined,
        };

        const res = await api.get("/products", { params });

        // Backend may return an array OR { items: [...] } — handle both.
        let data = Array.isArray(res.data) ? res.data : res.data.items || [];

        // TEMP DEBUG — remove once confirmed working. Shows in the browser console.
        console.log("[FootVerse] GET /products", params, "→", data.length, "items");

        switch (criteria.sort) {
          case "price-asc":
            data.sort((a, b) => a.price - b.price);
            break;

          case "price-desc":
            data.sort((a, b) => b.price - a.price);
            break;

          default:
            break;
        }

        setItems(data);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();

  }, [criteria]);

  const total = items.length;
  const pages = 1;
  const page = 1;

  const cat = CATEGORIES.find((c) => c.slug === criteria.category);
  const title = criteria.q
    ? `Results for “${criteria.q}”`
    : criteria.sub || (cat ? cat.name : "All Footwear");

  const setSort = (value) => {
    const next = new URLSearchParams(sp.toString());
    next.set("sort", value);
    next.delete("page");
    router.replace(`/products?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
      {/* Heading */}
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#A5793A]">
        {cat ? cat.name : "Shop"}
      </p>
      <h1 className="mt-1 font-playfair text-4xl font-bold text-[#33231A]">{title}</h1>

      {/* Sort bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-[#33231A]/10 py-3">
        <p className="text-sm text-[#6E655C]">
          <span className="font-semibold text-[#33231A]">{total}</span> products
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="rounded-lg border border-[#33231A]/15 px-4 py-2 text-sm font-medium text-[#33231A] lg:hidden"
          >
            Filters
          </button>
          <label className="flex items-center gap-2 text-sm text-[#6E655C]">
            Sort by
            <select
              value={criteria.sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-[#33231A]/15 bg-white px-3 py-2 text-sm text-[#33231A] outline-none focus:border-[#A5793A]"
            >
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-8 flex gap-10">
        {/* Sticky sidebar (desktop) */}
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
            <FilterSidebar />
          </div>
        </div>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-white p-14 text-center shadow-sm">
              <p className="font-playfair text-2xl font-bold text-[#33231A]">No products found</p>
              <p className="mt-2 text-sm text-[#6E655C]">
                Try removing a filter or two — the perfect pair is out there.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                />
              ))}
            </div>
          )}
          <Pagination page={page} pages={pages} />
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-40 bg-[#33231A]/40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.45, 0, 0.25, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-[#F7F4EF] p-6 shadow-2xl lg:hidden"
            >
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="mb-4 ml-auto block text-sm font-medium text-[#A5793A]"
              >
                Close ✕
              </button>
              <FilterSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}