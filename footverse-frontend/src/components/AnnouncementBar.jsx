export default function AnnouncementBar() {
  return (
    <div className="bg-espresso px-4 py-2 text-center">
      <p className="text-[10px] uppercase tracking-[0.28em] text-ivory/85 sm:text-[11px]">
        Free express shipping over $50
        <span className="mx-3 text-gold" aria-hidden>
          ·
        </span>
        Easy 30-day returns
      </p>
    </div>
  );
}