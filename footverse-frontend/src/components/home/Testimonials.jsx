"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/data/content";
import RatingStars from "@/components/product/RatingStars";
import SectionHeading from "./SectionHeading";

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
      <SectionHeading eyebrow="Word of Mouth" title="What Customers Say" />
      <div className="grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.45, 0, 0.25, 1] }}
            className="rounded-2xl bg-white p-7 shadow-[0_8px_28px_-16px_rgba(51,35,26,0.25)]"
          >
            <RatingStars rating={t.rating} size={16} />
            <blockquote className="mt-4 text-[15px] leading-relaxed text-[#33231A]">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A5793A]/15 font-playfair text-base font-bold text-[#A5793A]">
                {t.name[0]}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#33231A]">{t.name}</span>
                <span className="text-xs text-[#6E655C]">{t.city}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}