"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import SectionHeading from "./SectionHeading";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.get("/products");
        const all = Array.isArray(res.data) ? res.data : res.data.items || [];

        // Spread across categories so the row isn't all one type.
        const byGroup = new Map();
        for (const p of all) {
          const key = `${p.category}|${p.subcategory}`;
          if (!byGroup.has(key)) byGroup.set(key, []);
          byGroup.get(key).push(p);
        }
        const groups = [...byGroup.values()];
        const picks = [];
        let idx = 0;
        while (picks.length < 8 && groups.some((g) => g.length)) {
          const g = groups[idx % groups.length];
          if (g && g.length) picks.push(g.shift());
          idx++;
        }
        setProducts(picks.slice(0, 8));
      } catch (err) {
        console.error(err);
      }
    }

    loadProducts();
  }, []);

  return (
    <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
      <SectionHeading
        eyebrow="Handpicked"
        title="Featured Products"
        href="/products"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}