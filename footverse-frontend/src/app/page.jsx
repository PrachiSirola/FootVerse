import Navbar from "@/components/Navbar";
import Hero from "@/components/hero/Hero";
import PromoBanners from "@/components/home/PromoBanners";
import BestSellers from "@/components/home/BestSellers";
import TrustBar from "@/components/home/TrustBar";
import Testimonials from "@/components/home/Testimonials";
import Newsletter from "@/components/home/Newsletter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-[100svh] flex-col">
      {/* Hero and everything above stays exactly as-is */}
      <Navbar />
      <Hero />

      {/* Rebuilt lower section (Luxe-style, FootVerse palette) */}
      <PromoBanners />
      {/* Minimum order value notice */}
      <div className="px-5 py-10 sm:py-12">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 rounded-2xl border border-[#A5793A]/25 bg-[#F7F4EF] px-6 py-4 text-center shadow-[0_8px_28px_-18px_rgba(51,35,26,0.35)]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A5793A"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          <p className="text-sm text-[#33231A] sm:text-[15px]">
            <span className="font-semibold">Minimum order value: $600.</span>{" "}
            <span className="text-[#6E655C]">Orders below this amount cannot be placed.</span>
          </p>
        </div>
      </div>
      <BestSellers />
      <TrustBar />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  );
}