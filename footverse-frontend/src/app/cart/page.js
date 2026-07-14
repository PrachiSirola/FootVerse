"use client";

import Link from "next/link";
import QuantityInput from "@/components/ui/QuantityInput";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { usd } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function CartPage() {
  const {
    detailed,
    subtotal,
    setQty,
    remove,
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // B2B minimum order value — fetched from the backend so it stays in sync with
  // the server-side rule (which is the one that actually enforces it).
  const [MIN_ORDER, setMinOrder] = useState(600);
  useEffect(() => {
    api.get("/orders/config")
      .then((r) => setMinOrder(Number(r.data?.minOrderValue) || 600))
      .catch(() => {}); // fall back to the default if the call fails
  }, []);

  const meetsMinimum = subtotal >= MIN_ORDER;
  const shortfall = Math.max(0, MIN_ORDER - subtotal);

  const goToCheckout = () => {
    if (!meetsMinimum) return; // B2B minimum not met
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

                  <QuantityInput
                    value={item.qty}
                    onChange={(n) => setQty(item, n)}
                    stock={item.stock || 0}
                    size="sm"
                  />

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

          {/* B2B minimum order value */}
          {!meetsMinimum && (
            <div className="mt-5 rounded-xl border border-[#B8352C]/30 bg-[#B8352C]/5 p-4">
              <p className="text-[13px] font-semibold text-[#B8352C]">
                Minimum order value: {usd(MIN_ORDER)}
              </p>
              <p className="mt-1 text-[13px] text-[#6E655C]">
                This is a wholesale (B2B) store. Add {usd(shortfall)} more to proceed to checkout.
              </p>
            </div>
          )}

          <button
            onClick={goToCheckout}
            disabled={!meetsMinimum}
            className="mt-6 block w-full rounded-lg bg-[#33231A] py-3 text-center font-semibold text-white transition-colors hover:bg-[#4A3526] disabled:cursor-not-allowed disabled:bg-[#33231A]/40 disabled:hover:bg-[#33231A]/40"
          >
            {meetsMinimum ? "Proceed to Checkout" : `Add ${usd(shortfall)} more to checkout`}
          </button>
          {!user && meetsMinimum && (
            <p className="mt-2 text-center text-xs text-[#6E655C]">Please log in to complete your purchase.</p>
          )}

        </div>

      </div>
    </div>
  );
}