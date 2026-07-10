"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { priceLabel, isPriceless } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";

const FALLBACK = "/products/placeholder.svg";

/** Pull image URLs out of the CJ product shape (images:[{url,isPrimary}]). */
function imageUrls(product) {
  const urls = (product?.images || [])
    .map((im) => (typeof im === "string" ? im : im?.url))
    .filter(Boolean);
  return urls.length ? urls : [FALLBACK];
}

/** Unique, order-preserving list. */
const uniq = (arr) => [...new Set(arr.filter(Boolean))];

export default function DbProductDetail({ id }) {
  const router = useRouter();
  const { add } = useCart();
  const { user } = useAuth();
  const { has, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [image, setImage] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        if (alive) setProduct(res.data);
      } catch (err) {
        if (alive) setError(err.response?.data?.message || "Product not found");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // Derive sizes/colors from variants only.
  const sizes = useMemo(() => uniq((product?.variants || []).map((v) => v.size)), [product]);
  const colors = useMemo(() => uniq((product?.variants || []).map((v) => v.color)), [product]);

  // Default the selectors once the product loads.
  useEffect(() => {
    if (sizes.length) setSize((s) => s || sizes[0]);
    if (colors.length) setColor((c) => c || colors[0]);
  }, [sizes, colors]);

  const images = product ? imageUrls(product) : [FALLBACK];
  const wished = product ? has(product._id) : false;

  const price = Number(product?.price) || 0;
  const compare = Number(product?.comparePrice) || 0;
  const discount = compare > price && compare > 0 ? Math.round(((compare - price) / compare) * 100) : 0;

  // Build the snapshot the cart stores (so cart/checkout never re-fetch).
  const snapshot = () => ({
    id: product._id,
    name: product.name,
    image: images[0],
    price,
    brand: product.brand || "",
    size,
    color,
  });

  const addToCart = (openDrawer = true) => {
    if (!product) return;
    add(snapshot(), qty, { openDrawer });
  };

  const buyNow = () => {
    if (!user) {
      // Guests can add to cart, but must log in to purchase.
      addToCart(false);
      router.push("/login?redirect=/checkout&reason=checkout");
      return;
    }
    addToCart(false);
    router.push("/checkout");
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-playfair text-3xl font-bold text-[#33231A]">Product not found</h1>
        <Link href="/products" className="mt-4 inline-block text-[#A5793A] hover:underline">
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-[#6E655C]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[#A5793A]">Home</Link>
        <span className="mx-1.5">›</span>
        <Link href={`/products?category=${(product.category || "").toLowerCase()}`} className="hover:text-[#A5793A]">
          {product.category}
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-[#33231A]">{product.subcategory}</span>
      </nav>

      <div className="mt-5 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* Gallery */}
        <div>
          <motion.div
            key={image}
            initial={{ opacity: 0.4, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center overflow-hidden rounded-2xl border border-[#33231A]/8 bg-[#F1ECE2] p-6 sm:p-10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[image]}
              alt={product.name}
              className="aspect-square w-full max-w-[520px] object-contain"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK; }}
            />
          </motion.div>

          {images.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.slice(0, 5).map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`w-[86px] overflow-hidden rounded-xl border-2 bg-[#F1ECE2] p-1.5 transition-colors ${i === image ? "border-[#33231A]" : "border-[#33231A]/10 hover:border-[#A5793A]/60"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="aspect-square w-full object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            {product.brand ? (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#A5793A] font-playfair text-[11px] font-bold text-white">
                  {product.brand[0]}
                </span>
                <span className="text-[13px] font-semibold text-[#33231A]">{product.brand}</span>
              </>
            ) : (
              <span className="text-[13px] font-semibold text-[#33231A]">{product.category} · {product.subcategory}</span>
            )}
            {product.bestseller && (
              <span className="ml-1 rounded-full bg-[#A5793A]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#A5793A]">Bestseller</span>
            )}
          </div>

          <h1 className="mt-2.5 font-playfair text-[30px] font-bold leading-tight text-[#33231A] sm:text-[34px]">
            {product.name}
          </h1>

          {product.description && (
            <div className="mt-5">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#33231A]">Product Description</h2>
              <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[#6E655C]">
                {String(product.description).replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 400)}
              </p>
            </div>
          )}

          {/* Price */}
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className={`text-[34px] font-bold tracking-tight ${isPriceless(price) ? "text-[#A5793A]" : "text-[#33231A]"}`}>{priceLabel(price)}</span>
            {!isPriceless(price) && discount > 0 && (
              <>
                <span className="text-lg text-[#6E655C] line-through">{priceLabel(compare)}</span>
                <span className="rounded-full bg-[#A5793A]/10 px-2.5 py-0.5 text-[12px] font-semibold text-[#A5793A]">{discount}% off</span>
              </>
            )}
          </div>

          {/* Size — only if variants have sizes */}
          {sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#33231A]">Size</p>
              <div className="mt-2.5 flex max-w-md flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`min-w-[52px] rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors ${size === s ? "border-[#33231A] bg-[#33231A] text-white" : "border-[#33231A]/15 text-[#33231A] hover:border-[#A5793A]"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-full bg-[#33231A] px-1.5 py-1 text-white">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="px-2.5 text-base leading-none" aria-label="Decrease quantity">−</button>
              <span className="w-6 text-center text-sm font-semibold">{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(9, qty + 1))} className="px-2.5 text-base leading-none" aria-label="Increase quantity">+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-stretch gap-3">
            {!isPriceless(price) ? (
              <>
                <button
                  type="button"
                  onClick={buyNow}
                  className="flex-1 rounded-xl bg-[#33231A] py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_14px_30px_-14px_rgba(51,35,26,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4A3526]"
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  onClick={() => addToCart(true)}
                  className="flex-1 rounded-xl border-2 border-[#33231A] py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#33231A] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#A5793A] hover:text-[#A5793A]"
                >
                  Add To Cart
                </button>
              </>
            ) : (
              <div className="flex-1 rounded-xl border-2 border-dashed border-[#A5793A]/40 bg-[#A5793A]/5 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-[#A5793A]">
                Price on Request
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                toggle({
                  id: product._id,
                  name: product.name,
                  image: images[0],
                  price,
                  brand: product.brand || "",
                })
              }
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              className="flex w-[58px] items-center justify-center rounded-xl border-2 border-[#33231A]/15 transition-colors hover:border-[#B8352C]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={wished ? "#B8352C" : "none"} stroke={wished ? "#B8352C" : "#33231A"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.6 4.5 6.2 4.5c2.2 0 3.9 1.2 4.8 3 1-1.8 2.6-3 4.8-3 3.6 0 5.7 3.5 4.2 7.2C19.5 16.3 12 21 12 21z" />
              </svg>
            </button>
          </div>

          <p className="mt-4 flex items-center gap-2 text-[12px] text-[#6E655C]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A5793A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M1 8h13v8H1zM14 11h4l3 3v2h-7z" /><circle cx="6" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" />
            </svg>
            Free Delivery On Orders Over $50
          </p>
        </div>
      </div>
    </div>
  );
}