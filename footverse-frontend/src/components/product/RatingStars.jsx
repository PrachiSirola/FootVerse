/** Static 5-star display with partial fill. */
export default function RatingStars({ rating, size = 14, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(Math.max(rating - i + 1, 0), 1) * 100;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }} aria-hidden>
            <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0" fill="#E2DBCE">
              <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
              <svg viewBox="0 0 24 24" width={size} height={size} fill="#A5793A">
                <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}