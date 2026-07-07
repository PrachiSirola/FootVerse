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
      <BestSellers />
      <TrustBar />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  );
}