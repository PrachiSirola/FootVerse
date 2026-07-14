"use client";

export function Card({ children, className = "" }) {
  return <div className={`rounded-2xl bg-white p-6 shadow-[0_8px_28px_-18px_rgba(51,35,26,0.3)] sm:p-7 ${className}`}>{children}</div>;
}

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[#33231A]">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-[#33231A]/15 bg-white px-4 py-3 text-sm text-[#33231A] outline-none transition-colors placeholder:text-[#6E655C]/50 focus:border-[#A5793A] disabled:bg-[#F1ECE2]/60"
      />
    </label>
  );
}

export function Btn({ children, variant = "solid", ...props }) {
  const base = "rounded-xl px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = variant === "solid"
    ? "bg-[#33231A] text-white hover:-translate-y-0.5 hover:bg-[#4A3526]"
    : variant === "outline"
    ? "border border-[#33231A] text-[#33231A] hover:border-[#A5793A] hover:text-[#A5793A]"
    : "border border-[#B8352C]/40 text-[#B8352C] hover:bg-[#B8352C]/5";
  return <button {...props} className={`${base} ${styles}`}>{children}</button>;
}

export function Alert({ type = "error", children }) {
  if (!children) return null;
  const s = type === "error" ? "bg-[#B8352C]/8 text-[#B8352C]" : "bg-[#2F7C4A]/10 text-[#2F7C4A]";
  return <div className={`rounded-lg px-3.5 py-2.5 text-[13px] ${s}`}>{children}</div>;
}

export function EmptyState({ icon = "✦", title, sub }) {
  return (
    <div className="py-16 text-center">
      <p className="text-4xl">{icon}</p>
      <p className="mt-3 font-sans text-2xl font-bold text-[#33231A]">{title}</p>
      {sub && <p className="mt-2 text-sm text-[#6E655C]">{sub}</p>}
    </div>
  );
}