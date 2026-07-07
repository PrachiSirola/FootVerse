"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/format";

const FALLBACK = "/products/placeholder.svg";

export default function MiniCart() {
  const { drawerOpen, closeDrawer, lastAdded, detailed, subtotal, setQty, remove } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 5;

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[60] bg-[#33231A]/45 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.45, 0, 0.25, 1] }}
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[410px] flex-col bg-[#F7F4EF] shadow-2xl"
            role="dialog"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#33231A]/10 bg-white px-6 py-5">
              <div>
                {lastAdded ? (
                  <p className="flex items-center gap-2 font-semibold text-[#33231A]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#A5793A]/15 text-sm text-[#A5793A]">✓</span>
                    Added to cart
                  </p>
                ) : (
                  <p className="font-semibold text-[#33231A]">Your Cart</p>
                )}
                <p className="mt-0.5 text-xs text-[#6E655C]">
                  {detailed.length} {detailed.length === 1 ? "item" : "items"}
                </p>
              </div>
              <button type="button" onClick={closeDrawer} aria-label="Close cart" className="text-lg text-[#6E655C] transition-colors hover:text-[#33231A]">
                ✕
              </button>
            </div>

            {/* Lines */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {detailed.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-4xl">🛒</p>
                  <p className="mt-3 text-sm text-[#6E655C]">Your cart is empty.</p>
                  <button type="button" onClick={closeDrawer} className="mt-5 rounded-lg border border-[#33231A] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#33231A] transition-colors hover:border-[#A5793A] hover:text-[#A5793A]">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {detailed.map((line) => {
                    const isNew =
                      lastAdded &&
                      line.id === lastAdded.id &&
                      line.size === lastAdded.size &&
                      line.color === lastAdded.color;
                    return (
                      <li
                        key={`${line.id}-${line.size}-${line.color}`}
                        className={`flex gap-3.5 rounded-2xl bg-white p-3.5 shadow-[0_8px_28px_-18px_rgba(51,35,26,0.3)] ${isNew ? "ring-1 ring-[#A5793A]/50" : ""}`}
                      >
                        <Link href={`/products/${line.id}`} className="w-[72px] shrink-0 overflow-hidden rounded-xl bg-[#F1ECE2]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={line.product.images?.[0] || FALLBACK}
                            alt={line.product.name}
                            className="aspect-square w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK;
                            }}
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/products/${line.id}`} className="line-clamp-1 text-[13.5px] font-medium text-[#33231A] hover:text-[#A5793A]">
                              {line.product.name}
                            </Link>
                            <button type="button" onClick={() => remove(line)} aria-label="Remove" className="text-xs text-[#6E655C] hover:text-[#B8352C]">
                              ✕
                            </button>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#6E655C]">
                            {line.size}{line.size && line.color ? " · " : ""}{line.color}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-1.5">
                            <div className="flex items-center rounded-full bg-[#33231A] px-1 text-white">
                              <button type="button" onClick={() => setQty(line, line.qty - 1)} className="px-2 py-0.5 text-sm" aria-label="Decrease">−</button>
                              <span className="w-5 text-center text-xs font-semibold">{line.qty}</span>
                              <button type="button" onClick={() => setQty(line, line.qty + 1)} className="px-2 py-0.5 text-sm" aria-label="Increase">+</button>
                            </div>
                            <p className="text-[13.5px] font-semibold text-[#33231A]">{inr(line.product.price * line.qty)}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {detailed.length > 0 && (
              <div className="border-t border-[#33231A]/10 bg-white px-6 py-5">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#6E655C]">Subtotal</dt>
                    <dd className="font-semibold text-[#33231A]">{inr(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-xs">
                    <dt className="text-[#6E655C]">Shipping</dt>
                    <dd className="text-[#6E655C]">{shipping === 0 ? "Free" : `${inr(shipping)} (free over $50)`}</dd>
                  </div>
                </dl>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link href="/cart" onClick={closeDrawer} className="rounded-lg border border-[#33231A] py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-[#33231A] transition-colors hover:border-[#A5793A] hover:text-[#A5793A]">
                    View Cart
                  </Link>
                  <Link href="/checkout" onClick={closeDrawer} className="rounded-lg bg-[#33231A] py-3 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-all hover:bg-[#4A3526]">
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}