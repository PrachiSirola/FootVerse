"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import SectionHeading from "./SectionHeading";

/**
 * Best Sellers row. Prefers products flagged `bestseller`, then falls back to
 * highest-rated, then simply the first 8 — so it always fills even if nothing
 * is flagged in the DB.
 */
export default function BestSellers() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/products");
        const all = Array.isArray(res.data) ? res.data : res.data.items || [];

        let picks = all.filter((p) => p.bestseller);
        if (picks.length < 8) {
          // CJ products have no real ratings (all 0), so instead of a meaningless
          // rating sort (which returns one clustered category), spread the picks
          // across different categories/subcategories for a varied showcase.
          const seen = new Set(picks.map((p) => p._id));
          const byGroup = new Map();
          for (const p of all) {
            const key = `${p.category}|${p.subcategory}`;
            if (!byGroup.has(key)) byGroup.set(key, []);
            byGroup.get(key).push(p);
          }
          // Round-robin across groups so no single category dominates.
          const groups = [...byGroup.values()];
          let idx = 0;
          while (picks.length < 8 && groups.some((g) => g.length)) {
            const g = groups[idx % groups.length];
            if (g && g.length) {
              const p = g.shift();
              if (p && !seen.has(p._id)) { picks.push(p); seen.add(p._id); }
            }
            idx++;
          }
        }
        if (alive) setProducts(picks.slice(0, 8));
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8">
      <SectionHeading
        eyebrow="Most Loved"
        title="Best Sellers"
        href="/products?sort=rating"
        linkLabel="View All Products"
      />
      <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}