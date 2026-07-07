import { PRODUCTS } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import SectionHeading from "./SectionHeading";

export default function NewArrivals() {
  const newest = [...PRODUCTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
      <SectionHeading eyebrow="Just In" title="New Arrivals" href="/products?sort=newest" />
      <div className="-mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 [scrollbar-width:thin]">
        {newest.map((p) => (
          <div key={p.id} className="w-[270px] shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}