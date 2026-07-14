"use client";

/** Shared admin primitives — keeps the six modules visually consistent. */

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-sans text-2xl font-bold text-[#33231A]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-[#6E655C]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-[#33231A]/8 bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

/** A KPI tile. `tone` shifts the accent for attention-worthy numbers. */
export function Stat({ label, value, sub, tone = "default" }) {
  const accent =
    tone === "warn" ? "text-[#B8352C]" : tone === "gold" ? "text-[#A5793A]" : "text-[#33231A]";
  return (
    <Card>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E655C]">{label}</p>
      <p className={`mt-2 font-sans text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-[12px] text-[#6E655C]">{sub}</p>}
    </Card>
  );
}

const BADGE_TONES = {
  Pending: "bg-[#6E655C]/10 text-[#6E655C]",
  Confirmed: "bg-[#A5793A]/12 text-[#A5793A]",
  Processing: "bg-[#A5793A]/12 text-[#A5793A]",
  Packed: "bg-[#A5793A]/12 text-[#A5793A]",
  Shipped: "bg-[#2C4A7C]/12 text-[#2C4A7C]",
  Delivered: "bg-[#3a7a3a]/12 text-[#3a7a3a]",
  Cancelled: "bg-[#B8352C]/10 text-[#B8352C]",
  Returned: "bg-[#B8352C]/10 text-[#B8352C]",
  Paid: "bg-[#3a7a3a]/12 text-[#3a7a3a]",
  Open: "bg-[#B8352C]/10 text-[#B8352C]",
  "In Progress": "bg-[#A5793A]/12 text-[#A5793A]",
  Resolved: "bg-[#3a7a3a]/12 text-[#3a7a3a]",
  Closed: "bg-[#6E655C]/10 text-[#6E655C]",
  Urgent: "bg-[#B8352C]/15 text-[#B8352C]",
  High: "bg-[#B8352C]/10 text-[#B8352C]",
  Medium: "bg-[#A5793A]/12 text-[#A5793A]",
  Low: "bg-[#6E655C]/10 text-[#6E655C]",
};

export function Badge({ children }) {
  const tone = BADGE_TONES[children] || "bg-[#33231A]/8 text-[#33231A]";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {children}
    </span>
  );
}

export function Table({ head = [], children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#33231A]/8 bg-white">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-[#33231A]/8">
            {head.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6E655C]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#33231A]/6">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 text-[#33231A] ${className}`}>{children}</td>;
}

export function Empty({ children = "Nothing here yet." }) {
  return (
    <div className="rounded-xl border border-dashed border-[#33231A]/15 bg-white p-12 text-center text-[13px] text-[#6E655C]">
      {children}
    </div>
  );
}

/**
 * A compact bar chart — deliberately simple SVG rather than a chart library.
 * The data is low-cardinality (30 days), so a dependency isn't justified.
 */
export function BarChart({ data = [], xKey = "date", yKey = "revenue", height = 160, format = (v) => v }) {
  if (!data.length) return <Empty>No data for this range.</Empty>;
  const max = Math.max(...data.map((d) => Number(d[yKey]) || 0), 1);

  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {data.map((d, i) => {
          const v = Number(d[yKey]) || 0;
          const h = Math.max(2, (v / max) * height);
          return (
            <div key={i} className="group relative flex-1" style={{ height }}>
              <div
                className="absolute bottom-0 w-full rounded-t-sm bg-[#A5793A]/70 transition-colors group-hover:bg-[#A5793A]"
                style={{ height: h }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#33231A] px-2 py-1 text-[11px] text-white group-hover:block">
                {d[xKey]}: {format(v)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-[#6E655C]">
        <span>{data[0]?.[xKey]}</span>
        <span>{data[data.length - 1]?.[xKey]}</span>
      </div>
    </div>
  );
}

/** A funnel — each stage as a proportional bar. */
export function Funnel({ stages = [] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="space-y-2.5">
      {stages.map((s) => (
        <div key={s.stage}>
          <div className="mb-1 flex justify-between text-[12px]">
            <span className="font-semibold text-[#33231A]">{s.stage}</span>
            <span className="text-[#6E655C]">
              {s.count}
              {max > 0 && <span className="ml-1.5">({Math.round((s.count / max) * 100)}%)</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F1ECE2]">
            <div
              className="h-full rounded-full bg-[#33231A]"
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Pagination controls shared by the admin tables. */
export function Pager({ page, totalPages, total, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-[12px] text-[#6E655C]">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-[#33231A]/12 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#33231A] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-[#33231A]/12 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#33231A] disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}