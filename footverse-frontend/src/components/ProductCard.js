"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/placeholder";

export default function ProductCard({ product = {} }) {
  const { addItem } = useCart();

  const price = Number(product.sellPrice ?? product.price) || 0;
  const mrp = Number(product.mrp) || 0;

  const discount =
    mrp > 0 && price > 0 && mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  // ✅ NEW: shared link object (clean approach)
  const productLink = {
    pathname: `/products/${product.id}`,
    query: {
      name: product.name,
      price: product.sellPrice,
      image: product.image,
    },
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg">
      
      {/* IMAGE CLICK */}
      <Link href={productLink}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {product.image ? (
            <img
              src={product.images?.[0]?.url || "/placeholder.png"}
              alt={product.name || "Product image"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}

          {product.badge ? (
            <span className="absolute left-3 top-3 rounded-full bg-brand-700 px-2.5 py-1 text-[11px] font-semibold text-white">
              {product.badge}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="p-4">
        <p className="mb-1 text-xs font-medium text-gray-400">
          {product.supplier || "Supplier"}
        </p>

        {/* TITLE CLICK */}
        <Link href={productLink}>
          <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand-700">
            {product.name || "Product name"}
          </h3>
        </Link>

        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-sm text-yellow-500">★</span>
          <span className="text-xs text-gray-500">
            {product.rating ?? "0"} ({product.reviews ?? "0"})
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(price)}
            </span>

            {mrp > price ? (
              <>
                <span className="ml-2 text-xs text-gray-400 line-through">
                  {formatPrice(mrp)}
                </span>
                <span className="ml-1.5 text-xs font-semibold text-green-600">
                  {discount}% off
                </span>
              </>
            ) : null}
          </div>
        </div>

        <button
          onClick={() => addItem(product)}
          className="mt-3 w-full rounded-lg border border-brand-200 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}