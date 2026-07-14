"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Three promo cards tied to real filters:
 *  - New Arrivals  → /products?sort=newest
 *  - Best Rated    → /products?sort=rating
 *  - On Sale       → /products?sort=discount
 * Styled after the Luxe reference (big title, subtitle, "Shop →"), in the
 * FootVerse ivory/gold/espresso palette.
 */
const BANNERS = [
  {
    title: "New Arrivals",
    subtitle: "Fresh drops, just landed for the season.",
    href: "/products?sort=newest",
    className: "bg-[#EDE6DA]",
    accent: "text-[#33231A]",
  },
  {
    title: "Best Rated",
    subtitle: "Customer favourites with top reviews.",
    href: "/products?sort=rating",
    className: "bg-[#DCE3E6]",
    accent: "text-[#2C4A56]",
  },
  {
    title: "Big Sale — Up to 50% Off",
    subtitle: "Don't miss out on exclusive deals.",
    href: "/products?sort=discount",
    className: "bg-[#F0DEC9]",
    accent: "text-[#8A4B2A]",
  },
];

export default function PromoBanners() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        {BANNERS.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.45, 0, 0.25, 1] }}
          >
            <Link
              href={b.href}
              className={`group flex h-52 flex-col justify-between overflow-hidden rounded-2xl p-7 transition-shadow duration-300 hover:shadow-[0_18px_44px_-20px_rgba(51,35,26,0.4)] ${b.className}`}
            >
              <div>
                <h3 className={`font-sans text-2xl font-bold leading-tight ${b.accent}`}>
                  {b.title}
                </h3>
                <p className="mt-2 max-w-[16rem] text-sm text-[#5B534B]">{b.subtitle}</p>
              </div>
              <span className={`text-[13px] font-semibold uppercase tracking-[0.1em] ${b.accent}`}>
                Shop <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}