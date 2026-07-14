"use client";

import { useState, useEffect } from "react";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { inr } from "@/lib/format";
import { createCheckoutSession } from "@/lib/payment";
import api, { getToken } from "@/lib/api";

const inputClass = "w-full border border-[#33231A]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#A5793A]";

export default function CheckoutPage() {
  const { detailed, subtotal, clear } = useCart();
  const { user, ready } = useAuth();
  const router = useRouter();

  // Auth gate: guests can browse + fill cart, but must log in to checkout.
  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?redirect=/checkout&reason=checkout");
    }
  }, [ready, user, router]);

  const [placed, setPlaced] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "", email: user?.email || "", phone: "",
    address: "", city: "", state: "", pin: "", payment: "online", // B2B: card only
  });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const tax = 0; // no tax (USD store)
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 5;
  const grandTotal = Math.round((subtotal + tax + shipping) * 100) / 100;

  async function handlePlace(e) {
    e.preventDefault();
    setError("");

    // ---- Online payment (Stripe) ----
    setBusy(true);
    try {
      const stripeItems = detailed.map((i) => ({
        id: i.id, name: i.product.name, image: i.product.images?.[0] || "",
        price: i.product.price, quantity: i.qty,
      }));
      const customer = { name: form.name, email: form.email, phone: form.phone };
      const shippingInfo = { address: form.address, city: form.city, state: form.state, pin: form.pin };
      const response = await createCheckoutSession(stripeItems, customer, shippingInfo);
      if (!response.url) {
        setError("No checkout URL returned from the server.");
        return;
      }
      window.location.href = response.url;
    } catch (err) {
      setError(err.message || "Unable to start payment.");
    } finally {
      setBusy(false);
    }
  }

  // ---- Order placed ----
  if (placed) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#A5793A]/15 text-3xl text-[#A5793A]">✓</div>
        <h1 className="font-sans text-3xl font-bold text-[#33231A]">Order Placed Successfully</h1>
        <p className="mt-3 text-[#6E655C]">
          Order <span className="font-semibold text-[#33231A]">#{placed.orderNumber}</span>
          {"."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/orders" className="rounded-lg bg-[#33231A] px-7 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#4A3526]">
            View Orders
          </Link>
          <Link href="/products" className="rounded-lg border border-[#33231A] px-7 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#33231A] transition-colors hover:border-[#A5793A] hover:text-[#A5793A]">
            Keep Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ---- Empty cart ----
  if (detailed.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-sans text-3xl font-bold text-[#33231A]">Nothing to checkout</h1>
        <Link href="/products" className="mt-4 inline-block text-[#A5793A] hover:underline">Back to Shop</Link>
      </div>
    );
  }

  // While auth is resolving, or a guest is being redirected, show a spinner
  // instead of flashing the checkout form.
  if (!ready || !user) {
    return <Spinner fullPage label="Loading checkout…" />;
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <h1 className="mb-8 font-sans text-3xl font-bold text-[#33231A]">Checkout</h1>
      <form onSubmit={handlePlace} className="flex flex-col gap-8 lg:flex-row">
        {/* LEFT */}
        <div className="flex-1 space-y-6">
          <div className="rounded-xl border border-[#33231A]/10 bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-[#33231A]">Shipping Details</h2>
            <input required placeholder="Full Name" value={form.name} onChange={update("name")} className={inputClass} />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input required type="email" placeholder="Email" value={form.email} onChange={update("email")} className={inputClass} />
              <input required placeholder="Phone" value={form.phone} onChange={update("phone")} className={inputClass} />
            </div>
            <input required placeholder="Street Address" value={form.address} onChange={update("address")} className={`${inputClass} mt-4`} />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <input required placeholder="City" value={form.city} onChange={update("city")} className={inputClass} />
              <input required placeholder="State" value={form.state} onChange={update("state")} className={inputClass} />
              <input required placeholder="PIN Code" value={form.pin} onChange={update("pin")} className={inputClass} />
            </div>
          </div>

          <div className="rounded-xl border border-[#33231A]/10 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#33231A]">Payment Method</h2>
            <div className="flex items-center gap-3 rounded-lg border border-[#A5793A]/30 bg-[#A5793A]/5 p-4">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#A5793A]" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-[#33231A]">Card Payment (Stripe)</p>
                <p className="text-[12px] text-[#6E655C]">
                  Secure card payment. All FootVerse wholesale orders are paid online.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-80">
          <div className="sticky top-24 rounded-xl border border-[#33231A]/10 bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-[#33231A]">Summary ({detailed.length})</h2>
            {detailed.map((i) => (
              <div key={`${i.id}-${i.size}-${i.color}`} className="mb-3 flex justify-between text-sm">
                <span className="text-[#6E655C]">{i.product.name} × {i.qty}</span>
                <span className="text-[#33231A]">{inr(i.product.price * i.qty)}</span>
              </div>
            ))}
            <hr className="my-4 border-[#33231A]/10" />
            <div className="mb-2 flex justify-between text-sm"><span className="text-[#6E655C]">Subtotal</span><span>{inr(subtotal)}</span></div>
            <div className="mb-4 flex justify-between text-sm"><span className="text-[#6E655C]">Shipping</span><span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "Free" : inr(shipping)}</span></div>
            <hr className="mb-4 border-[#33231A]/10" />
            <div className="flex justify-between text-lg font-bold text-[#33231A]"><span>Total</span><span>{inr(grandTotal)}</span></div>
            {error && <p className="mt-4 text-xs text-[#B8352C]">{error}</p>}
            <button type="submit" disabled={busy} className="mt-6 w-full rounded-lg bg-[#33231A] py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#4A3526] disabled:opacity-50">
              {busy ? "Processing…" : `Place Order — ${inr(grandTotal)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}