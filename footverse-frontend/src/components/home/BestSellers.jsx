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
          const rated = [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0));
          const seen = new Set(picks.map((p) => p._id));
          for (const p of rated) {
            if (picks.length >= 8) break;
            if (!seen.has(p._id)) { picks.push(p); seen.add(p._id); }
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