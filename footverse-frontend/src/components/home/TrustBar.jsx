const FEATURES = [
  { title: "Free Shipping", sub: "On orders over $50", icon: "truck" },
  { title: "Premium Quality", sub: "Carefully selected footwear", icon: "refresh" },
  { title: "Secure Payment", sub: "100% secure checkout", icon: "lock" },
  { title: "24/7 Support", sub: "We're here to help", icon: "headset" },
];

function Icon({ name }) {
  const common = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "#A5793A", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "truck")
    return (<svg {...common}><path d="M1 8h13v8H1zM14 11h4l3 3v2h-7z" /><circle cx="6" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>);
  if (name === "refresh")
    return (<svg {...common}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>);
  if (name === "lock")
    return (<svg {...common}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
  return (<svg {...common}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2zM20 14a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z" /><path d="M18 16v1a3 3 0 0 1-3 3h-3" /></svg>);
}

export default function TrustBar() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <div className="grid grid-cols-2 gap-6 rounded-2xl bg-[#F1ECE2] px-6 py-8 md:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <Icon name={f.icon} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#33231A]">{f.title}</p>
              <p className="text-xs text-[#6E655C]">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}