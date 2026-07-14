"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ProductImage from "./ProductImage";
import RatingStars from "./RatingStars";
import PriceTag from "./PriceTag";
import ProductCard from "./ProductCard";
import { COLOR_HEX } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export default function ProductDetail({ product }) {
  const router = useRouter();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [image, setImage] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const wished = has(product.id);

  const related = PRODUCTS.filter(
    (p) => p.id !== product.id && (p.subcategory === product.subcategory || p.category === product.category),
  ).slice(0, 4);

  const addToCart = () => {
    add(product.id, size, color, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
      {/* Breadcrumbs */}
      <nav className="text-xs text-[#6E655C]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#A5793A]">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/products?category=${product.category}`} className="hover:text-[#A5793A]">
          {product.categoryName}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#33231A]">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <motion.div
            key={image}
            initial={{ opacity: 0.4, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-2xl bg-[#F1ECE2]"
          >
            <ProductImage
              src={product.images[image]}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </motion.div>
          <div className="mt-3 flex gap-3">
            {product.images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setImage(i)}
                aria-label={`View image ${i + 1}`}
                className={`w-20 overflow-hidden rounded-xl border-2 transition-colors ${i === image ? "border-[#A5793A]" : "border-transparent hover:border-[#33231A]/20"}`}
              >
                <ProductImage src={src} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#A5793A]">
            {product.brand} · {product.subcategory}
          </p>
          <h1 className="mt-1 font-sans text-4xl font-bold text-[#33231A]">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2">
            <RatingStars rating={product.rating} size={16} />
            <span className="text-sm text-[#6E655C]">
              {product.rating} · {product.reviews} reviews
            </span>
            {product.badge && (
              <span className="rounded-full bg-[#A5793A]/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#A5793A]">
                {product.badge}
              </span>
            )}
          </div>

          <div className="mt-5"><PriceTag product={product} large /></div>
          <p className="mt-1 text-xs text-[#6E655C]">Free shipping over $50</p>

          {/* Color */}
          <div className="mt-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#33231A]">
              Color — <span className="font-normal text-[#6E655C]">{color}</span>
            </p>
            <div className="mt-2.5 flex gap-2.5">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={`Select color ${c}`}
                  onClick={() => setColor(c)}
                  className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-[#A5793A] ring-2 ring-[#A5793A]/30" : "border-white shadow"}`}
                  style={{ backgroundColor: COLOR_HEX[c] }}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mt-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#33231A]">Size</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`rounded-lg border px-4 py-2.5 text-sm transition-colors ${size === s ? "border-[#33231A] bg-[#33231A] text-white" : "border-[#33231A]/15 text-[#33231A] hover:border-[#A5793A]"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Qty + actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-[#33231A]/15">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 text-[#33231A] hover:text-[#A5793A]" aria-label="Decrease quantity">−</button>
              <span className="w-8 text-center text-sm font-semibold text-[#33231A]">{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(9, qty + 1))} className="px-4 py-3 text-[#33231A] hover:text-[#A5793A]" aria-label="Increase quantity">+</button>
            </div>
            <button
              type="button"
              disabled={!product.inStock}
              onClick={addToCart}
              className="rounded-lg bg-[#33231A] px-8 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-14px_rgba(51,35,26,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4A3526] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {added ? "✓ Added" : product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => { add(product.id, size, color, qty); router.push("/checkout"); }}
              className="rounded-lg border border-[#33231A] px-8 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#33231A] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#A5793A] hover:text-[#A5793A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Buy Now
            </button>
            <button
              type="button"
              onClick={() => toggle(product.id)}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#33231A]/15 transition-colors hover:border-[#B8352C]"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill={wished ? "#B8352C" : "none"} stroke={wished ? "#B8352C" : "#33231A"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.6 4.5 6.2 4.5c2.2 0 3.9 1.2 4.8 3 1-1.8 2.6-3 4.8-3 3.6 0 5.7 3.5 4.2 7.2C19.5 16.3 12 21 12 21z" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <div className="mt-9 border-t border-[#33231A]/10 pt-6">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#33231A]">Description</h2>
            <p className="mt-2.5 max-w-lg text-[15px] leading-relaxed text-[#6E655C]">{product.description}</p>
            <ul className="mt-4 grid max-w-lg grid-cols-1 gap-2 text-[13px] text-[#6E655C] sm:grid-cols-2">
              <li>✓ Genuine brand product</li>
              <li>✓ 30-day easy returns</li>
              <li>✓ COD available</li>
              <li>✓ Secure checkout</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-sans text-3xl font-bold text-[#33231A]">You may also like</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}