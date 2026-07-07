import { inr } from "@/lib/format";

export default function PriceTag({ product, large = false }) {
  return (
    <div className={`flex flex-wrap items-baseline ${large ? "gap-3" : "gap-2"}`}>
      <span className={`font-semibold text-[#33231A] ${large ? "text-3xl" : "text-[15px]"}`}>
        {inr(product.price)}
      </span>
      {product.discount > 0 && (
        <>
          <span className={`text-[#6E655C] line-through ${large ? "text-lg" : "text-xs"}`}>
            {inr(product.mrp)}
          </span>
          <span className={`font-semibold text-[#A5793A] ${large ? "text-base" : "text-xs"}`}>
            {product.discount}% off
          </span>
        </>
      )}
    </div>
  );
}