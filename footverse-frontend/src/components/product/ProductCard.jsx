"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ProductImage from "./ProductImage";
import RatingStars from "./RatingStars";
import PriceTag from "./PriceTag";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

const BADGE_STYLES = {
  New: "bg-[#33231A] text-white",
  Bestseller: "bg-[#A5793A] text-white",
  Sale: "bg-[#B8352C] text-white",
};

export default function ProductCard({ product }) {
  const { has, toggle } = useWishlist();
  const {
    add,
    setMiniCartOpen,
  }= useCart();

  // Support both MongoDB (_id) and static (id)
  const productId = product._id || product.id;

  const wished = has(productId);

  // Support both image formats
  const image =
    typeof product.images?.[0] === "string"
      ? product.images[0]
      : product.images?.[0]?.url;

  // Support MongoDB products
  const inStock =
    product.inStock ??
    (product.stock > 0);

  const rating = product.rating ?? 5;
  const reviews = product.reviews ?? 0;

  const categoryName =
    product.categoryName || product.category;

  const firstSize =
    product.sizes?.[0] ||
    product.variants?.[0]?.size ||
    "UK 8";

  const firstColor =
    product.colors?.[0] ||
    product.variants?.[0]?.color ||
    "Default";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.45, 0, 0.25, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_-16px_rgba(51,35,26,0.25)] transition-shadow duration-300 hover:shadow-[0_18px_44px_-16px_rgba(51,35,26,0.35)]"
    >
      {product.badge && (
        <span
          className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${BADGE_STYLES[product.badge]}`}
        >
          {product.badge}
        </span>
      )}

      <button
        type="button"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() =>
          toggle({
            id: productId,
            name: product.name,
            image,
            price: Number(product.price) || 0,
            brand: product.brand || "",
          })
        }
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill={wished ? "#B8352C" : "none"}
          stroke={wished ? "#B8352C" : "#33231A"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.6 4.5 6.2 4.5c2.2 0 3.9 1.2 4.8 3 1-1.8 2.6-3 4.8-3 3.6 0 5.7 3.5 4.2 7.2C19.5 16.3 12 21 12 21z" />
        </svg>
      </button>

      <Link
        href={`/products/${product._id}`}
        className="relative block overflow-hidden bg-[#F1ECE2]"
      >
        <ProductImage
          src={image}
          alt={product.name}
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {!inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-[#33231A]/85 py-1.5 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-white">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#A5793A]">
          {product.brand}
        </p>

        <Link
          href={`/products/${productId}`}
          className="line-clamp-1 text-[15px] font-medium text-[#33231A] transition-colors hover:text-[#A5793A]"
        >
          {product.name}
        </Link>

        <p className="text-xs text-[#6E655C]">
          {categoryName} · {product.subcategory}
        </p>

        <div className="flex items-center gap-1.5">
          <RatingStars rating={rating} />
          <span className="text-xs text-[#6E655C]">
            ({reviews})
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <PriceTag product={product} />

          <button
            type="button"
            disabled={!inStock}
            onClick={() => {
              add({
                id: productId,
                name: product.name,
                image,
                price: Number(product.price) || 0,
                brand: product.brand || "",
                size: firstSize,
                color: firstColor,
              });
            }}
            className="rounded-lg bg-[#33231A] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4A3526] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}