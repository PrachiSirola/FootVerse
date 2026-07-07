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

        setProducts(res.data.slice(0, 8));
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