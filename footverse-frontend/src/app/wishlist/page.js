"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/product/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import api from "@/lib/api";

/** Shape a DB product or a wishlist snapshot into what ProductCard expects. */
function toCard(product, snapshot) {
  if (product) {
    return {
      ...product,
      _id: product._id,
      images: product.images?.length ? product.images : [{ url: snapshot?.image }],
    };
  }
  // fall back to the snapshot only
  return {
    _id: snapshot.id,
    id: snapshot.id,
    name: snapshot.name,
    brand: snapshot.brand,
    price: snapshot.price,
    images: [{ url: snapshot.image }],
    stock: 1,
  };
}

export default function WishlistPage() {
  const { items, ready } = useWishlist();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      setLoading(true);
      // Fetch full details from the DB for each saved id; fall back to snapshot.
      const results = await Promise.all(
        items.map(async (snap) => {
          try {
            const r = await api.get(`/products/${snap.id}`);
            return toCard(r.data, snap);
          } catch {
            return toCard(null, snap);
          }
        }),
      );
      if (alive) {
        setCards(results);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [items, ready]);

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
        <h1 className="font-sans text-4xl font-bold text-[#33231A]">Your Wishlist ❤️</h1>

        {ready && !loading && cards.length === 0 ? (
          <div className="mx-auto max-w-lg py-20 text-center">
            <p className="font-sans text-2xl font-bold text-[#33231A]">Nothing saved yet</p>
            <p className="mt-2 text-sm text-[#6E655C]">Tap the ♥ on any product to keep it here.</p>
            <Link href="/products" className="mt-7 inline-block rounded-lg bg-[#33231A] px-8 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#4A3526]">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((p) => (
              <ProductCard key={p._id || p.id} product={p} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}