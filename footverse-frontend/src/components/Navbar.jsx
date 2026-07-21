"use client";

import { useEffect, useRef, useState } from "react";
import { priceLabel } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MegaMenu from "./MegaMenu";
import { AnimatePresence, motion } from "framer-motion";
import { searchProducts } from "@/lib/search";
import { CATEGORIES } from "@/data/categories";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Categories", mega: true },
  { label: "New Arrivals", href: "/products?sort=new" },
  { label: "Sale", href: "/products?sale=true" },
];

export default function Navbar() {
  const router = useRouter();
  const { count, ready: cartReady } = useCart();
  const { count: wishCount, ready: wishReady } = useWishlist();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const closeTimer = useRef(null);
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Real backend-backed search (debounced). No fake/demo product fallback —
  // if the backend returns nothing, results stays empty and the panel shows
  // its "No matches" state.
  const [results, setResults] = useState([]);
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    let active = true;
    const t = setTimeout(async () => {
      const data = await searchProducts(term);
      if (active) setResults((data || []).slice(0, 6));
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [q]);
  const catHits = q.trim()
    ? CATEGORIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    : [];

  const submit = () => {
    if (!q.trim()) return;
    setSearchOpen(false);
    router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  };
  const openMegaMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShowMegaMenu(true);
  };
  const closeMegaMenu = () => {
    closeTimer.current = setTimeout(() => {
      setShowMegaMenu(false);
    }, 180);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-40 border-b border-[#33231A]/10 bg-white"
    >
      <nav
        className="relative mx-auto flex h-[84px] max-w-[1500px] items-center gap-4 px-5 sm:px-8 lg:gap-6"
        aria-label="Primary"
      >
        {/* Wordmark */}
        <Link href="/" className="flex shrink-0 flex-col">
          <span className="font-sans text-[28px] font-bold leading-none tracking-tight sm:text-[30px]">
            <span className="text-[#33231A]">Foot</span>
            <span className="text-[#A5793A]">Verse</span>
          </span>
          <span className="mt-1 text-[10.5px] font-normal tracking-[0.02em] text-[#6E655C]">
            Your Universe of Footwear
          </span>
        </Link>

        {/* Centered menu */}
        <ul className="hidden min-w-0 flex-1 items-center justify-center gap-6 lg:flex xl:gap-9">
          {NAV_LINKS.map((item) => (
            <li 
              key={item.label}
              className="relative"
              onMouseEnter={item.mega ? openMegaMenu : undefined}
              onMouseLeave={item.mega ? closeMegaMenu : undefined}
            >
              {item.mega ? (
                <>
                  <button 
                    type="button"
                    className="flex items-center gap-1 whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.05em] text-[#33231A] transition-colors duration-300 hover:text-[#A5793A] xl:text-[13px] xl:tracking-[0.06em]">
                    Categories
                    <motion.span
                      animate={{ rotate: showMegaMenu ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-[10px]"
                    >
                      ▼
                    </motion.span>
                  </button>
                  {showMegaMenu && (
                    <MegaMenu
                      openMegaMenu={openMegaMenu}
                      closeMegaMenu={closeMegaMenu}
                    />
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className="text-[13px] font-medium uppercase tracking-[0.06em] text-[#33231A] transition-colors duration-300 hover:text-[#A5793A]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Right-side icons */}
        <div className="flex shrink-0 items-center gap-3.5 sm:gap-5 lg:gap-4 xl:gap-6">
          <button
            type="button"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            className="text-[#33231A] transition-colors hover:text-[#A5793A]"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.8-3.8" />
            </svg>
          </button>

          {/* Admin only — a quick switch into the dashboard. Regular users never
              see this; the admin panel itself is also route-guarded. */}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="flex items-center text-[#33231A] transition-colors hover:text-[#A5793A]"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="hidden sm:inline"></span>
            </Link>
          )}

          <Link href="/wishlist" aria-label={`Wishlist, ${wishReady ? wishCount : 0} items`} className="relative text-[#33231A] transition-colors hover:text-[#A5793A]">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.6 4.5 6.2 4.5c2.2 0 3.9 1.2 4.8 3 1-1.8 2.6-3 4.8-3 3.6 0 5.7 3.5 4.2 7.2C19.5 16.3 12 21 12 21z" />
            </svg>
            {wishReady && wishCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#B8352C] text-[9px] font-semibold text-white">
                {wishCount}
              </span>
            )}
          </Link>

          <Link href={user ? "/profile" : "/login"} aria-label={user ? "Profile" : "Login"} className="text-[#33231A] transition-colors hover:text-[#A5793A]">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5" />
            </svg>
          </Link>

          <Link href="/cart" aria-label={`Shopping bag, ${cartReady ? count : 0} items`} className="relative text-[#33231A] transition-colors hover:text-[#A5793A]">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#A5793A] text-[9px] font-semibold text-white">
              {cartReady ? count : 0}
            </span>
          </Link>
        </div>
      </nav>

      {/* Live search panel */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 top-full z-50 border-b border-[#33231A]/10 bg-white shadow-[0_24px_44px_-24px_rgba(51,35,26,0.35)]"
          >
            <div className="mx-auto max-w-3xl px-5 py-5">
              <div className="flex items-center gap-3 rounded-xl border border-[#33231A]/15 bg-[#F7F4EF] px-4 py-3 focus-within:border-[#A5793A]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E655C" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.8-3.8" />
                </svg>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setSearchOpen(false); }}
                  placeholder="Search shoes, brands, categories…"
                  className="w-full bg-transparent text-[15px] text-[#33231A] outline-none placeholder:text-[#6E655C]/60"
                />
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="text-sm text-[#6E655C] hover:text-[#33231A]">✕</button>
              </div>

              {q.trim() && (
                <div className="mt-4">
                  {catHits.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {catHits.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/products?category=${c.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="rounded-full border border-[#A5793A]/40 px-3.5 py-1.5 text-xs font-medium text-[#A5793A] hover:bg-[#A5793A]/10"
                        >
                          {c.name} →
                        </Link>
                      ))}
                    </div>
                  )}
                  {results.length === 0 ? (
                    <p className="py-4 text-center text-sm text-[#6E655C]">No matches — press Enter to search everything.</p>
                  ) : (
                    <ul className="divide-y divide-[#33231A]/8">
                      {results.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/products/${p.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between gap-4 py-2.5 text-sm hover:text-[#A5793A]"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-[#33231A]">{p.name}</span>
                              <span className="text-xs text-[#6E655C]">{p.categoryName} · {p.subcategory}</span>
                            </span>
                            <span className="shrink-0 font-semibold text-[#33231A]">{priceLabel(p.price)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}