"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import SectionHeading from "./SectionHeading";

const INITIALS = { men: "M", women: "W", kids: "K", sports: "S" };

export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
      <SectionHeading eyebrow="Browse" title="Shop by Category" href="/products" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map((c, i) => {
          const count = PRODUCTS.filter((p) => p.category === c.slug).length;
          return (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.45, 0, 0.25, 1] }}
            >
              <Link
                href={`/products?category=${c.slug}`}
                className="group flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-[0_8px_28px_-16px_rgba(51,35,26,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-16px_rgba(51,35,26,0.35)]"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F1ECE2] font-sans text-2xl font-bold text-[#33231A] transition-colors duration-300 group-hover:bg-[#A5793A] group-hover:text-white">
                  {INITIALS[c.slug]}
                </span>
                <span className="mt-4 text-sm font-semibold text-[#33231A]">{c.name}</span>
                <span className="mt-1 text-xs text-[#6E655C]">{count} styles</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}