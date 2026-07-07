"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/data/categories";

export default function MegaMenu({
  openMegaMenu,
  closeMegaMenu,
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
      className="absolute left-1/2 top-full z-50 mt-5 w-[1180px] -translate-x-1/2 rounded-2xl border border-[#ECE7E0] bg-white px-10 py-9 shadow-[0_30px_80px_rgba(0,0,0,0.12)]"
    >
      <h3 className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.35em] text-[#A5793A]">
        Shop By Category
      </h3>

      <div className="grid grid-cols-3 gap-x-16 gap-y-12">
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