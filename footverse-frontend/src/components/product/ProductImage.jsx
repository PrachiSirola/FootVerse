"use client";

/**
 * Product <img> that falls back to the branded placeholder when the real
 * file hasn't been added to /public/products yet.
 */
export default function ProductImage({ src, alt, className = "" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/products/placeholder.svg";
      }}
    />
  );
}