"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/** Centered premium auth card matching the reference "Welcome back" layout. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 before:absolute before:inset-0 before:-z-10 before:bg-[url('/backgrounds/wallpaper1.0.png')] before:bg-cover before:bg-center before:blur-md before:scale-110">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.45, 0, 0.25, 1] }}
        className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-[0_20px_60px_-24px_rgba(51,35,26,0.35)] sm:p-10"
      >
        {/* Brand */}
        <Link href="/" className="mb-8 inline-flex flex-col">
          <span className="font-sans text-[26px] font-bold leading-none">
            <span className="text-[#33231A]">Foot</span>
            <span className="text-[#A5793A]">Verse</span>
          </span>
          <span className="mt-1 text-[10px] tracking-[0.02em] text-[#6E655C]">
            Your Universe of Footwear
          </span>
        </Link>

        <h1 className="font-sans text-3xl font-bold text-[#33231A]">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-[#6E655C]">{subtitle}</p>}

        <div className="mt-7">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-[#6E655C]">{footer}</div>}
      </motion.div>
    </div>
  );
}