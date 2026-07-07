"use client";
import { useParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { categories, products } from "@/data/placeholder";
import Link from "next/link";
import { useState } from "react";

const sortOptions = ["Relevance", "Price: Low–High", "Price: High–Low", "Rating"];

export default function CategoryPage() {
  const { slug } = useParams();
  const category = categories.find((c) => c.slug === slug);
  const [sort, setSort] = useState("Relevance");
  const [priceMax, setPriceMax] = useState(50000);

  let filtered = products.filter((p) => p.category === slug && p.price <= priceMax);
  if (sort === "Price: Low–High") filtered.sort((a, b) => a.price - b.price);
  if (sort === "Price: High–Low") filtered.sort((a, b) => b.price - a.price);
  if (sort === "Rating") filtered.sort((a, b) => b.rating - a.rating);
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{category?.name || slug}</span>
      </nav>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Sort By</h3>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
              {sortOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Max Price: ${priceMax}</h3>
            <input type="range" min={1000} max={50000} step={1000} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-brand-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Categories</h3>
            <ul className="space-y-1.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/categories/${c.slug}`} className={`text-sm ${c.slug === slug ? "text-brand-700 font-semibold" : "text-gray-600 hover:text-brand-700"} transition-colors`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{category?.name || "Products"}</h1>
            <span className="text-sm text-gray-400">{filtered.length} products</span>
          </div>
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm py-16 text-center">No products match your filters. Try increasing the price range.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}