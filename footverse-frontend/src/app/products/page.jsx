import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Listing from "@/components/product/Listing";

// Filters/search live in the URL, so this page renders per-request.
export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-[50vh] px-6 py-24 text-center text-[#6E655C]">Loading products…</div>}>
        <Listing />
      </Suspense>
      <Footer />
    </>
  );
}