"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { usd } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const {
    detailed,
    subtotal,
    setQty,
    remove,
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const goToCheckout = () => {
    if (!user) {
      router.push("/login?redirect=/checkout&reason=checkout");
      return;
    }
    router.push("/checkout");
  };

  if (detailed.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="text-6xl">🛒</div>

        <h1 className="mt-4 text-3xl font-bold text-[#33231A]">
          Your Cart is Empty
        </h1>

        <p className="mt-2 text-[#6E655C]">
          Looks like you haven't added anything yet.
        </p>

        <Link
          href="/products"
          className="mt-8 inline-block rounded-lg bg-[#33231A] px-8 py-3 text-white"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-[#33231A]">
        Shopping Cart
      </h1>

      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">

        {/* Left */}

        <div className="space-y-5">

          {detailed.map((item) => {

            const p = item.product;

            return (
              <div
                key={`${item.id}-${item.size}-${item.color}`}
                className="flex gap-5 rounded-xl border bg-white p-5"
              >

                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="h-28 w-28 rounded-lg object-cover"
                />

                <div className="flex-1">

                  <h2 className="text-lg font-semibold">
                    {p.name}
                  </h2>

                  <p className="mt-1 text-sm text-[#6E655C]">
                    {item.color} • {item.size}
                  </p>

                  <p className="mt-3 text-xl font-bold">
                    {usd(p.price)}
                  </p>

                </div>

                <div className="flex flex-col items-end justify-between">

                  <button
                    onClick={() => remove(item)}
                    className="text-sm text-red-500"
                  >
                    Remove
                  </button>

                  <div className="flex items-center rounded border">

                    <button
                      onClick={() =>
                        setQty(item, item.qty - 1)
                      }
                      className="px-3 py-2"
                    >
                      −
                    </button>

                    <span className="px-4">
                      {item.qty}
                    </span>

                    <button
                      onClick={() =>
                        setQty(item, item.qty + 1)
                      }
                      className="px-3 py-2"
                    >
                      +
                    </button>

                  </div>

                </div>

              </div>
            );

          })}

        </div>

        {/* Right */}

        <div className="h-fit rounded-xl border bg-white p-6">

          <h2 className="mb-5 text-xl font-bold">
            Order Summary
          </h2>

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{usd(subtotal)}</span>
          </div>

          <div className="mt-2 flex justify-between">
            <span>Shipping</span>
            <span>Free</span>
          </div>

          <hr className="my-5" />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{usd(subtotal)}</span>
          </div>

          <button
            onClick={goToCheckout}
            className="mt-6 block w-full rounded-lg bg-[#33231A] py-3 text-center font-semibold text-white transition-colors hover:bg-[#4A3526]"
          >
            Proceed to Checkout
          </button>
          {!user && (
            <p className="mt-2 text-center text-xs text-[#6E655C]">Please log in to complete your purchase.</p>
          )}

        </div>

      </div>
    </div>
  );
}