import Link from "next/link";
import { CATEGORIES } from "@/data/categories";

const COMPANY = [
  ["All Products", "/products"],
];
const ACCOUNT = [
  ["Login", "/login"], ["Register", "/register"], ["My Orders", "/orders"], ["Wishlist", "/wishlist"], ["Cart", "/cart"],
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#33231A] text-white">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-playfair text-[26px] font-bold leading-none">
            Foot<span className="text-[#D9B87A]">Verse</span>
          </p>
          <p className="mt-1.5 text-[11px] tracking-[0.02em] text-white/60">Your Universe of Footwear</p>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
            From sports and casual to formal, boots, sandals, and everyday
            essentials—discover the perfect pair for every style and every step.
          </p>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#D9B87A]">Shop</h3>
          <ul className="mt-4 space-y-2.5">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/products?category=${c.slug}`} className="text-sm text-white/75 transition-colors hover:text-[#D9B87A]">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#D9B87A]">Shop</h3>
          <ul className="mt-4 space-y-2.5">
            {COMPANY.map(([l, h]) => (
              <li key={h}><Link href={h} className="text-sm text-white/75 transition-colors hover:text-[#D9B87A]">{l}</Link></li>
            ))}
          </ul>
          <h3 className="mt-7 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#D9B87A]">Account</h3>
          <ul className="mt-4 space-y-2.5">
            {ACCOUNT.map(([l, h]) => (
              <li key={h}><Link href={h} className="text-sm text-white/75 transition-colors hover:text-[#D9B87A]">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#D9B87A]">Get in touch</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li>support@footverse.in</li>
            <li>+91 90000 00000</li>
            <li>Bengaluru, Karnataka, India</li>
            <li>Mon–Sat · 9 AM – 8 PM IST</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            {["VISA", "MC", "UPI", "RUPAY", "COD"].map((p) => (
              <span key={p} className="rounded border border-white/20 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white/70">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © 2026 FootVerse. All rights reserved. · UI demo — no real transactions.
      </div>
    </footer>
  );
}