import { priceLabel, isPriceless } from "@/lib/format";

export default function PriceTag({ product, large = false }) {
  const priceless = isPriceless(product?.price);

  return (
    <div className={`flex flex-wrap items-baseline ${large ? "gap-3" : "gap-2"}`}>
      <span className={`font-semibold text-[#33231A] ${large ? "text-3xl" : "text-[15px]"} ${priceless ? "!text-[#A5793A]" : ""}`}>
        {priceLabel(product?.price)}
      </span>
      {!priceless && product.discount > 0 && (
        <>
          <span className={`text-[#6E655C] line-through ${large ? "text-lg" : "text-xs"}`}>
            {priceLabel(product.mrp)}
          </span>
          <span className={`font-semibold text-[#A5793A] ${large ? "text-base" : "text-xs"}`}>
            {product.discount}% off
          </span>
        </>
      )}
    </div>
  );
}