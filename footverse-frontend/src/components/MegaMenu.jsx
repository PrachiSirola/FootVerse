"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/data/categories";

export default function MegaMenu({
  openMegaMenu,
  closeMegaMenu,
  onNavigate,
}) {
  return (
    <motion.div
      onMouseEnter={openMegaMenu}
      onMouseLeave={closeMegaMenu}
      initial={{
        opacity: 0,
        y: 18,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 18,
        scale: 0.98,
      }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="absolute left-1/2 top-full z-50 mt-5 max-h-[calc(100vh-7rem)] w-[min(1180px,calc(100vw-2.5rem))] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#ECE7E0] bg-white px-6 py-7 shadow-[0_30px_80px_rgba(0,0,0,0.12)] sm:px-10 sm:py-9"
    >
      <h3 className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.35em] text-[#A5793A]">
        Shop By Category
      </h3>

      {/* All Products — the whole catalog, always first. */}
      <Link
        href="/products"
        onClick={onNavigate}
        className="mb-7 flex items-center justify-between rounded-xl border border-[#A5793A]/25 bg-[#A5793A]/5 px-5 py-4 transition-colors hover:border-[#A5793A]/60 hover:bg-[#A5793A]/10"
      >
        <div>
          <p className="text-[14px] font-semibold text-[#33231A]">All Products</p>
          <p className="text-[12px] text-[#6E655C]">Browse the entire catalogue</p>
        </div>
        <span className="text-[#A5793A]">→</span>
      </Link>

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 md:gap-x-10 md:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
        {CATEGORIES.map((category) => (
          <div key={category.slug}>
            <h4 className="mb-4 border-b border-[#EFEAE3] pb-3 text-[16px] font-semibold text-[#33231A]">
              {category.name}
            </h4>

            <ul className="space-y-3">
              {category.subs.map((sub) => (
                <li key={sub}>
                  <Link
                    href={`/products?category=${category.slug}&sub=${encodeURIComponent(
                      sub
                    )}`}
                    className="group flex items-center text-[15px] text-[#6E655C] transition-all duration-300 hover:translate-x-2 hover:text-[#A5793A] hover:font-medium"
                  >
                    <span>{sub}</span>

                    <span className="ml-2 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}