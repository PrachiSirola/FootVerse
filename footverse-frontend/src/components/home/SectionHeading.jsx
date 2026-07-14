import Link from "next/link";

export default function SectionHeading({ eyebrow, title, href, linkLabel }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#A5793A]">{eyebrow}</p>
        <h2 className="mt-1.5 font-sans text-3xl font-bold text-[#33231A] sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group text-[13px] font-semibold uppercase tracking-[0.1em] text-[#33231A] transition-colors hover:text-[#A5793A]">
          {linkLabel || "View all"} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </Link>
      )}
    </div>
  );
}