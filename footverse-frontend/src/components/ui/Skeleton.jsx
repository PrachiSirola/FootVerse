"use client";

/**
 * FootVerse skeleton loaders — ivory base with a soft gold/taupe shimmer sweep.
 * Prevents layout shift by matching the real content's dimensions, and respects
 * prefers-reduced-motion (see .fv-skeleton in globals.css).
 *
 * Base:      <Skeleton className="h-4 w-24" />
 * Composed:  <ProductCardSkeleton />, <ProductGridSkeleton count={8} />, etc.
 */

export function Skeleton({ className = "" }) {
  return <span className={`fv-skeleton block ${className}`} aria-hidden="true" />;
}

/* ---------- Product card (matches ProductCard dimensions) ---------- */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Product grid (listing / category / search / home rows) ---------- */
export function ProductGridSkeleton({ count = 8, className = "" }) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ---------- Product detail (image + info column) ---------- */
export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-5 pt-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-28" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex gap-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-12 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-14 flex-1 rounded-xl" />
          <Skeleton className="h-14 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Cart row ---------- */
export function CartRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-24 rounded-lg" />
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export function CartSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <CartRowSkeleton key={i} />
      ))}
    </div>
  );
}

/* ---------- Order row (order history / admin lists) ---------- */
export function OrderRowSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

export function OrderListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <OrderRowSkeleton key={i} />
      ))}
    </div>
  );
}

/* ---------- Profile ---------- */
export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-10">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;