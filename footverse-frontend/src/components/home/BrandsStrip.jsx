import { BRANDS } from "@/data/categories";

export default function BrandsStrip() {
  return (
    <section className="border-y border-[#33231A]/10 bg-white py-10">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <p className="mb-6 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-[#A5793A]">
          Trusted brands, one universe
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {BRANDS.map((b) => (
            <span
              key={b}
              className="font-oswald text-xl font-semibold uppercase tracking-[0.12em] text-[#6E655C]/70 transition-colors duration-300 hover:text-[#33231A]"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}