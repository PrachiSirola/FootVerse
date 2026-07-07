"use client";

/**
 * Clean, modern circular spinner (rotating ring).
 * Usage:
 *   <Spinner />                     // default, centered in its container
 *   <Spinner size={48} />           // custom size (px)
 *   <Spinner label="Loading products…" />
 *   <Spinner fullPage />            // fills a large centered area
 */
export default function Spinner({ size = 40, label = "", fullPage = false, className = "" }) {
  const ring = (
    <span
      className="inline-block animate-spin rounded-full border-[3px] border-[#33231A]/15 border-t-[#A5793A]"
      style={{ width: size, height: size }}
      role="status"
      aria-label={label || "Loading"}
    />
  );

  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-3 ${fullPage ? "min-h-[50vh]" : "py-12"} ${className}`}
    >
      {ring}
      {label ? <p className="text-sm text-[#6E655C]">{label}</p> : null}
    </div>
  );
}