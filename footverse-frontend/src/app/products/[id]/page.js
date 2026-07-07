"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DbProductDetail from "@/components/product/DbProductDetail";

// Next 14: params is a plain object here (no use()/await needed).
export default function ProductPage({ params }) {
  return (
    <>
      <Navbar />
      <DbProductDetail id={params.id} />
      <Footer />
    </>
  );
}