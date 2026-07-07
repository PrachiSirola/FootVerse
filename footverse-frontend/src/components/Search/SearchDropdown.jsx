"use client";

import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import { priceLabel } from "@/lib/format";

export default function SearchDropdown({

  products,

  loading,

}) {

  return (

    <div
      className="
      absolute
      top-full
      mt-3
      w-full
      rounded-2xl
      bg-white
      shadow-2xl
      border
      overflow-hidden
      z-50
    "
    >

      {loading && (
        <div className="p-5"><Spinner size={24} label="Searching…" /></div>
      )}

      {!loading && products.length === 0 && (

        <div className="p-5">

          No products found

        </div>

      )}

      {!loading &&

        products.map((product)=>(

          <Link

            key={product._id}

            href={`/products/${product.slug}`}

            className="
            flex
            items-center
            gap-4
            px-5
            py-4
            hover:bg-gray-100
            transition
          "
          >

            <img

              src={product.images?.[0]}

              alt={product.name}

              className="
              h-14
              w-14
              rounded-lg
              object-cover
            "
            />

            <div>

              <h3 className="font-semibold">

                {product.name}

              </h3>

              <p className="text-sm text-gray-500">

                {priceLabel(product.price)}

              </p>

            </div>

          </Link>

      ))}

    </div>

  );

}